import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { sendDeskOnboardOtpEmail, sendWelcomeEmail } from '../services/email.service.js';

/**
 * Calculates BMI given weight in KG and height in CM
 */
function computeBmi(weightKg?: number | null, heightCm?: number | null): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

/**
 * Auto-calculates age from Date of Birth
 */
function computeAge(dob?: string | Date | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const diffMs = Date.now() - birth.getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

/**
 * 1. Health Intelligence & Marketing Analytics Summary
 * Designed for Gym Owner / Developer to track leads, goal demographics, and marketing ROI.
 */
export async function getHealthIntelligenceSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const totalMembers = await prisma.user.count({ where: { role: 'MEMBER' } });
    const profiles = await prisma.memberHealthProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            createdAt: true
          }
        }
      }
    });

    const totalProfiles = profiles.length;

    // Goals breakdown
    const goalsMap: Record<string, number> = {};
    const referralMap: Record<string, number> = {};
    const conditionMap: Record<string, number> = {};
    const genderMap: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
    const bmiBuckets = { underweight: 0, normal: 0, overweight: 0, obese: 0 };
    const ageBuckets = { under20: 0, '20-29': 0, '30-39': 0, '40-49': 0, '50+': 0 };

    let totalBmi = 0;
    let bmiCount = 0;
    let totalAge = 0;
    let ageCount = 0;
    let medicalAlertCount = 0;

    profiles.forEach((p) => {
      // Primary Goal
      const goal = p.primaryGoal || 'General Fitness';
      goalsMap[goal] = (goalsMap[goal] || 0) + 1;

      // Referral Source
      const ref = p.referralSource || 'Walk-in';
      referralMap[ref] = (referralMap[ref] || 0) + 1;

      // Gender
      const g = p.gender || 'Other';
      genderMap[g] = (genderMap[g] || 0) + 1;

      // BMI Distribution
      if (p.bmi && p.bmi > 0) {
        totalBmi += p.bmi;
        bmiCount++;
        if (p.bmi < 18.5) bmiBuckets.underweight++;
        else if (p.bmi < 25) bmiBuckets.normal++;
        else if (p.bmi < 30) bmiBuckets.overweight++;
        else bmiBuckets.obese++;
      }

      // Age Distribution
      if (p.age && p.age > 0) {
        totalAge += p.age;
        ageCount++;
        if (p.age < 20) ageBuckets.under20++;
        else if (p.age < 30) ageBuckets['20-29']++;
        else if (p.age < 40) ageBuckets['30-39']++;
        else if (p.age < 50) ageBuckets['40-49']++;
        else ageBuckets['50+']++;
      }

      // Health Conditions parsing
      if (p.healthConditions) {
        try {
          const parsed = JSON.parse(p.healthConditions);
          if (Array.isArray(parsed)) {
            parsed.forEach((c: string) => {
              conditionMap[c] = (conditionMap[c] || 0) + 1;
            });
          }
        } catch {
          // ignore parsing error
        }
      }

      // Medical alerts
      if (p.isTakingMedication || p.advisedAvoidExercise || p.hasMajorSurgery || p.hasGymInjury) {
        medicalAlertCount++;
      }
    });

    res.json({
      summary: {
        totalProfiles,
        totalMembers,
        onboardingCompletionRate: totalMembers > 0 ? Math.round((totalProfiles / totalMembers) * 100) : 0,
        averageBmi: bmiCount > 0 ? Math.round((totalBmi / bmiCount) * 10) / 10 : null,
        averageAge: ageCount > 0 ? Math.round(totalAge / ageCount) : null,
        medicalAlertCount,
        goalsBreakdown: Object.entries(goalsMap)
          .map(([goal, count]) => ({
            goal,
            count,
            percentage: totalProfiles > 0 ? Math.round((count / totalProfiles) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count),
        referralBreakdown: Object.entries(referralMap)
          .map(([source, count]) => ({
            source,
            count,
            percentage: totalProfiles > 0 ? Math.round((count / totalProfiles) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count),
        conditionsBreakdown: Object.entries(conditionMap)
          .map(([condition, count]) => ({
            condition,
            count,
            percentage: totalProfiles > 0 ? Math.round((count / totalProfiles) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count),
        bmiBuckets,
        ageBuckets,
        genderMap
      }
    });
  } catch (error: any) {
    console.error('getHealthIntelligenceSummary error:', error);
    res.status(500).json({ error: 'Failed to compute health intelligence metrics.' });
  }
}

/**
 * 2. Get Filterable List of All Members with Health Profiles (Marketing Hub)
 */
export async function getMembersWithHealthData(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { search, goal, referralSource, city, condition } = req.query;

    const whereUser: any = { role: 'MEMBER' };
    if (search) {
      const q = String(search).trim();
      whereUser.OR = [
        { fullName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } }
      ];
    }

    const members = await prisma.user.findMany({
      where: whereUser,
      include: {
        healthProfile: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // In-memory filter for health profile specific attributes if requested
    let filtered = members;

    if (goal) {
      filtered = filtered.filter(m => m.healthProfile?.primaryGoal?.toLowerCase() === String(goal).toLowerCase());
    }

    if (referralSource) {
      filtered = filtered.filter(m => m.healthProfile?.referralSource?.toLowerCase() === String(referralSource).toLowerCase());
    }

    if (city) {
      filtered = filtered.filter(m => m.healthProfile?.city?.toLowerCase().includes(String(city).toLowerCase()));
    }

    if (condition) {
      filtered = filtered.filter(m => {
        if (!m.healthProfile?.healthConditions) return false;
        try {
          const list = JSON.parse(m.healthProfile.healthConditions);
          return Array.isArray(list) && list.some(c => c.toLowerCase() === String(condition).toLowerCase());
        } catch {
          return false;
        }
      });
    }

    const formatted = filtered.map(m => ({
      userId: m.id,
      fullName: m.fullName,
      email: m.email,
      phone: m.phone,
      joinedAt: m.createdAt,
      avatarUrl: m.avatarUrl,
      subscription: m.subscriptions[0] || null,
      healthProfile: m.healthProfile || null
    }));

    res.json({ count: formatted.length, members: formatted });
  } catch (error: any) {
    console.error('getMembersWithHealthData error:', error);
    res.status(500).json({ error: 'Failed to retrieve health profiles.' });
  }
}

/**
 * 3. Onboard Member with Full Health & Fitness Assessment (Unified Form 1 & Form 2)
 */
export async function onboardMemberWithHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      // Form 1: Contact & Address
      fullName,
      email,
      phone,
      password = 'MemberPass123!',
      dateOfBirth,
      age: explicitAge,
      gender,
      profilePhoto,
      houseFlatStreet,
      localityArea,
      city,
      state,
      pinCode,
      isPermanentSame = true,
      referralSource,
      referralDetails,

      // Plan & Billing
      planName = 'Monthly Pro Access',
      price = 65,
      durationDays = 30,
      paymentMethod = 'CASH',
      facilityId: requestedFacilityId,

      // Form 2: A. Body Metrics
      currentWeightKg,
      heightCm,
      bodyFatPercentage,
      muscleMassKg,
      waistCm,
      chestCm,
      hipCm,

      // Form 2: B. Health Condition Selector & Medical Questions
      hasHealthCondition = false,
      healthConditions = [],
      otherConditionText,
      isTakingMedication = false,
      medicationDetails,
      advisedAvoidExercise = false,
      avoidExerciseDetails,
      hasMajorSurgery = false,
      surgeryDetails,
      hasGymInjury = false,
      injuryDetails,

      // Form 2: C. Goals & Timeline
      primaryGoal,
      specificGoal,
      targetWeightKg,
      targetTimeline
    } = req.body;

    if (!fullName || !email) {
      res.status(400).json({ error: 'Full name and email address are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check existing
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // Compute automatic metrics
    const calculatedAge = explicitAge || computeAge(dateOfBirth);
    const parsedWeight = currentWeightKg ? parseFloat(String(currentWeightKg)) : null;
    const parsedHeight = heightCm ? parseFloat(String(heightCm)) : null;
    const calculatedBmi = computeBmi(parsedWeight, parsedHeight);

    // Get facility
    let facilityId = requestedFacilityId || req.user?.facilityId;
    if (!facilityId) {
      const defaultFacility = await prisma.facility.findFirst();
      facilityId = defaultFacility?.id;
    }

    // 1. Create or update user
    if (!user) {
      const passwordHash = await bcrypt.hash(password || 'MemberPass123!', 10);
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          fullName: fullName.trim(),
          phone: phone ? phone.trim() : null,
          passwordHash,
          role: 'MEMBER',
          facilityId,
          avatarUrl: profilePhoto || null,
          deviceStatus: 'NORMAL'
        }
      });
    }

    // 2. Create Active Subscription
    const now = new Date();
    const endDate = new Date(now.getTime() + (durationDays || 30) * 24 * 60 * 60 * 1000);
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planName: planName || 'Monthly Pro Access',
        price: parseFloat(String(price || 65)),
        startDate: now,
        endDate,
        status: 'ACTIVE',
        paymentMethod: paymentMethod || 'CASH',
        deskBilledById: req.user?.userId || null
      }
    });

    // 3. Upsert MemberHealthProfile (Form 1 + Form 2 data)
    const conditionsJson = Array.isArray(healthConditions) ? JSON.stringify(healthConditions) : (typeof healthConditions === 'string' ? healthConditions : null);

    const healthProfile = await prisma.memberHealthProfile.upsert({
      where: { userId: user.id },
      update: {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        age: calculatedAge,
        gender: gender || null,
        profilePhoto: profilePhoto || null,
        houseFlatStreet: houseFlatStreet || null,
        localityArea: localityArea || null,
        city: city || null,
        state: state || null,
        pinCode: pinCode || null,
        isPermanentSame: Boolean(isPermanentSame),
        referralSource: referralSource || null,
        referralDetails: referralDetails || null,
        currentWeightKg: parsedWeight,
        heightCm: parsedHeight,
        bmi: calculatedBmi,
        bodyFatPercentage: bodyFatPercentage ? parseFloat(String(bodyFatPercentage)) : null,
        muscleMassKg: muscleMassKg ? parseFloat(String(muscleMassKg)) : null,
        waistCm: waistCm ? parseFloat(String(waistCm)) : null,
        chestCm: chestCm ? parseFloat(String(chestCm)) : null,
        hipCm: hipCm ? parseFloat(String(hipCm)) : null,
        hasHealthCondition: Boolean(hasHealthCondition),
        healthConditions: conditionsJson,
        otherConditionText: otherConditionText || null,
        isTakingMedication: Boolean(isTakingMedication),
        medicationDetails: medicationDetails || null,
        advisedAvoidExercise: Boolean(advisedAvoidExercise),
        avoidExerciseDetails: avoidExerciseDetails || null,
        hasMajorSurgery: Boolean(hasMajorSurgery),
        surgeryDetails: surgeryDetails || null,
        hasGymInjury: Boolean(hasGymInjury),
        injuryDetails: injuryDetails || null,
        primaryGoal: primaryGoal || null,
        specificGoal: specificGoal || null,
        targetWeightKg: targetWeightKg ? parseFloat(String(targetWeightKg)) : null,
        targetTimeline: targetTimeline || null
      },
      create: {
        userId: user.id,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        age: calculatedAge,
        gender: gender || null,
        profilePhoto: profilePhoto || null,
        houseFlatStreet: houseFlatStreet || null,
        localityArea: localityArea || null,
        city: city || null,
        state: state || null,
        pinCode: pinCode || null,
        isPermanentSame: Boolean(isPermanentSame),
        referralSource: referralSource || null,
        referralDetails: referralDetails || null,
        currentWeightKg: parsedWeight,
        heightCm: parsedHeight,
        bmi: calculatedBmi,
        bodyFatPercentage: bodyFatPercentage ? parseFloat(String(bodyFatPercentage)) : null,
        muscleMassKg: muscleMassKg ? parseFloat(String(muscleMassKg)) : null,
        waistCm: waistCm ? parseFloat(String(waistCm)) : null,
        chestCm: chestCm ? parseFloat(String(chestCm)) : null,
        hipCm: hipCm ? parseFloat(String(hipCm)) : null,
        hasHealthCondition: Boolean(hasHealthCondition),
        healthConditions: conditionsJson,
        otherConditionText: otherConditionText || null,
        isTakingMedication: Boolean(isTakingMedication),
        medicationDetails: medicationDetails || null,
        advisedAvoidExercise: Boolean(advisedAvoidExercise),
        avoidExerciseDetails: avoidExerciseDetails || null,
        hasMajorSurgery: Boolean(hasMajorSurgery),
        surgeryDetails: surgeryDetails || null,
        hasGymInjury: Boolean(hasGymInjury),
        injuryDetails: injuryDetails || null,
        primaryGoal: primaryGoal || null,
        specificGoal: specificGoal || null,
        targetWeightKg: targetWeightKg ? parseFloat(String(targetWeightKg)) : null,
        targetTimeline: targetTimeline || null
      }
    });

    // 4. Send Welcome email in background
    sendWelcomeEmail({
      toEmail: user.email,
      fullName: user.fullName,
      planName: subscription.planName,
      endDate: subscription.endDate
    }).catch(err => console.warn('Onboard welcome email failed:', err.message));

    res.json({
      success: true,
      message: `Member ${user.fullName} onboarded with health assessment!`,
      member: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        subscription,
        healthProfile
      }
    });
  } catch (error: any) {
    console.error('onboardMemberWithHealth error:', error);
    res.status(500).json({ error: 'Failed to complete member health onboarding.' });
  }
}

/**
 * 4. Export Marketing CSV
 * Generates an exhaustive CSV containing all contact, demographic, fitness and referral data for marketing campaigns.
 */
export async function exportHealthDataCsv(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const members = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      include: {
        healthProfile: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const headers = [
      'Full Name',
      'Email',
      'Phone',
      'Gender',
      'Age',
      'Date of Birth',
      'City',
      'Locality / Area',
      'House / Flat',
      'State',
      'PIN Code',
      'Referral Source',
      'Referral Reference',
      'Current Weight (KG)',
      'Height (CM)',
      'BMI',
      'Body Fat %',
      'Muscle Mass (KG)',
      'Waist (CM)',
      'Chest (CM)',
      'Hip (CM)',
      'Has Health Conditions',
      'Health Conditions List',
      'Other Conditions',
      'Taking Medication',
      'Medication Details',
      'Doctor Advised Avoid Exercise',
      'Doctor Advice Details',
      'Major Surgery',
      'Surgery Details',
      'Gym Injury',
      'Injury Details',
      'Primary Fitness Goal',
      'Specific Goal Target',
      'Target Weight (KG)',
      'Target Timeline',
      'Active Plan Name',
      'Plan Price ($)',
      'Membership End Date',
      'Registration Date'
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const val = String(str).replace(/"/g, '""');
      return `"${val}"`;
    };

    const rows = members.map(m => {
      const p = m.healthProfile;
      const sub = m.subscriptions[0];
      const conditions = p?.healthConditions ? (()=>{
        try {
          const list = JSON.parse(p.healthConditions);
          return Array.isArray(list) ? list.join('; ') : p.healthConditions;
        } catch {
          return p.healthConditions;
        }
      })() : '';

      return [
        escapeCsv(m.fullName),
        escapeCsv(m.email),
        escapeCsv(m.phone || ''),
        escapeCsv(p?.gender || ''),
        escapeCsv(p?.age || ''),
        escapeCsv(p?.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : ''),
        escapeCsv(p?.city || ''),
        escapeCsv(p?.localityArea || ''),
        escapeCsv(p?.houseFlatStreet || ''),
        escapeCsv(p?.state || ''),
        escapeCsv(p?.pinCode || ''),
        escapeCsv(p?.referralSource || ''),
        escapeCsv(p?.referralDetails || ''),
        escapeCsv(p?.currentWeightKg || ''),
        escapeCsv(p?.heightCm || ''),
        escapeCsv(p?.bmi || ''),
        escapeCsv(p?.bodyFatPercentage || ''),
        escapeCsv(p?.muscleMassKg || ''),
        escapeCsv(p?.waistCm || ''),
        escapeCsv(p?.chestCm || ''),
        escapeCsv(p?.hipCm || ''),
        escapeCsv(p?.hasHealthCondition ? 'Yes' : 'No'),
        escapeCsv(conditions),
        escapeCsv(p?.otherConditionText || ''),
        escapeCsv(p?.isTakingMedication ? 'Yes' : 'No'),
        escapeCsv(p?.medicationDetails || ''),
        escapeCsv(p?.advisedAvoidExercise ? 'Yes' : 'No'),
        escapeCsv(p?.avoidExerciseDetails || ''),
        escapeCsv(p?.hasMajorSurgery ? 'Yes' : 'No'),
        escapeCsv(p?.surgeryDetails || ''),
        escapeCsv(p?.hasGymInjury ? 'Yes' : 'No'),
        escapeCsv(p?.injuryDetails || ''),
        escapeCsv(p?.primaryGoal || ''),
        escapeCsv(p?.specificGoal || ''),
        escapeCsv(p?.targetWeightKg || ''),
        escapeCsv(p?.targetTimeline || ''),
        escapeCsv(sub?.planName || ''),
        escapeCsv(sub?.price || ''),
        escapeCsv(sub?.endDate ? new Date(sub.endDate).toISOString().split('T')[0] : ''),
        escapeCsv(new Date(m.createdAt).toISOString().split('T')[0])
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="IronVault_Member_Marketing_Data.csv"');
    res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('exportHealthDataCsv error:', error);
    res.status(500).json({ error: 'Failed to generate CSV export.' });
  }
}

/**
 * 5. Get Specific Member Health Profile
 */
export async function getMemberHealthProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const profile = await prisma.memberHealthProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            createdAt: true,
            avatarUrl: true
          }
        }
      }
    });

    if (!profile) {
      res.status(404).json({ error: 'Health profile not found for this member.' });
      return;
    }

    res.json({ profile });
  } catch (error: any) {
    console.error('getMemberHealthProfile error:', error);
    res.status(500).json({ error: 'Failed to retrieve member health profile.' });
  }
}

/**
 * 6. Get My Health Profile (Member self-view)
 */
export async function getMyHealthProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const profile = await prisma.memberHealthProfile.findUnique({
      where: { userId }
    });

    res.json({ profile });
  } catch (error: any) {
    console.error('getMyHealthProfile error:', error);
    res.status(500).json({ error: 'Failed to retrieve your fitness profile.' });
  }
}

/**
 * 7. Update My Health Profile (Member self-update)
 */
export async function updateMyHealthProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const {
      // Optional user basic info updates
      fullName,
      phone,

      // Form 1: Contact, Address, Referral
      dateOfBirth,
      age: explicitAge,
      gender,
      profilePhoto,
      houseFlatStreet,
      localityArea,
      city,
      state,
      pinCode,
      isPermanentSame,
      permanentAddress,
      referralSource,
      referralDetails,

      // Form 2: Body Metrics
      currentWeightKg,
      heightCm,
      bodyFatPercentage,
      muscleMassKg,
      waistCm,
      chestCm,
      hipCm,

      // Form 2: Health Conditions & Medical checks
      hasHealthCondition,
      healthConditions,
      otherConditionText,
      isTakingMedication,
      medicationDetails,
      advisedAvoidExercise,
      avoidExerciseDetails,
      hasMajorSurgery,
      surgeryDetails,
      hasGymInjury,
      injuryDetails,

      // Form 2: Goals & Timeline
      primaryGoal,
      specificGoal,
      targetWeightKg,
      targetTimeline
    } = req.body;

    // 1. Update basic user data if provided
    if (fullName || phone || profilePhoto) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(fullName ? { fullName: String(fullName).trim() } : {}),
          ...(phone ? { phone: String(phone).trim() } : {}),
          ...(profilePhoto ? { avatarUrl: String(profilePhoto).trim() } : {})
        }
      });
    }

    // 2. Computed values
    const parsedWeight = currentWeightKg !== undefined && currentWeightKg !== '' ? parseFloat(String(currentWeightKg)) : null;
    const parsedHeight = heightCm !== undefined && heightCm !== '' ? parseFloat(String(heightCm)) : null;
    const calculatedBmi = computeBmi(parsedWeight, parsedHeight);
    const calculatedAge = explicitAge !== undefined ? explicitAge : (dateOfBirth ? computeAge(dateOfBirth) : null);

    const conditionsJson = healthConditions !== undefined
      ? (Array.isArray(healthConditions) ? JSON.stringify(healthConditions) : (typeof healthConditions === 'string' ? healthConditions : null))
      : undefined;

    // 3. Upsert MemberHealthProfile
    const profile = await prisma.memberHealthProfile.upsert({
      where: { userId },
      update: {
        ...(dateOfBirth !== undefined ? { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null } : {}),
        ...(calculatedAge !== null ? { age: calculatedAge } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(profilePhoto !== undefined ? { profilePhoto } : {}),
        ...(houseFlatStreet !== undefined ? { houseFlatStreet } : {}),
        ...(localityArea !== undefined ? { localityArea } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(state !== undefined ? { state } : {}),
        ...(pinCode !== undefined ? { pinCode } : {}),
        ...(isPermanentSame !== undefined ? { isPermanentSame: Boolean(isPermanentSame) } : {}),
        ...(permanentAddress !== undefined ? { permanentAddress } : {}),
        ...(referralSource !== undefined ? { referralSource } : {}),
        ...(referralDetails !== undefined ? { referralDetails } : {}),

        ...(parsedWeight !== null ? { currentWeightKg: parsedWeight } : {}),
        ...(parsedHeight !== null ? { heightCm: parsedHeight } : {}),
        ...(calculatedBmi !== null ? { bmi: calculatedBmi } : {}),
        ...(bodyFatPercentage !== undefined ? { bodyFatPercentage: bodyFatPercentage ? parseFloat(String(bodyFatPercentage)) : null } : {}),
        ...(muscleMassKg !== undefined ? { muscleMassKg: muscleMassKg ? parseFloat(String(muscleMassKg)) : null } : {}),
        ...(waistCm !== undefined ? { waistCm: waistCm ? parseFloat(String(waistCm)) : null } : {}),
        ...(chestCm !== undefined ? { chestCm: chestCm ? parseFloat(String(chestCm)) : null } : {}),
        ...(hipCm !== undefined ? { hipCm: hipCm ? parseFloat(String(hipCm)) : null } : {}),

        ...(hasHealthCondition !== undefined ? { hasHealthCondition: Boolean(hasHealthCondition) } : {}),
        ...(conditionsJson !== undefined ? { healthConditions: conditionsJson } : {}),
        ...(otherConditionText !== undefined ? { otherConditionText } : {}),
        ...(isTakingMedication !== undefined ? { isTakingMedication: Boolean(isTakingMedication) } : {}),
        ...(medicationDetails !== undefined ? { medicationDetails } : {}),
        ...(advisedAvoidExercise !== undefined ? { advisedAvoidExercise: Boolean(advisedAvoidExercise) } : {}),
        ...(avoidExerciseDetails !== undefined ? { avoidExerciseDetails } : {}),
        ...(hasMajorSurgery !== undefined ? { hasMajorSurgery: Boolean(hasMajorSurgery) } : {}),
        ...(surgeryDetails !== undefined ? { surgeryDetails } : {}),
        ...(hasGymInjury !== undefined ? { hasGymInjury: Boolean(hasGymInjury) } : {}),
        ...(injuryDetails !== undefined ? { injuryDetails } : {}),

        ...(primaryGoal !== undefined ? { primaryGoal } : {}),
        ...(specificGoal !== undefined ? { specificGoal } : {}),
        ...(targetWeightKg !== undefined ? { targetWeightKg: targetWeightKg ? parseFloat(String(targetWeightKg)) : null } : {}),
        ...(targetTimeline !== undefined ? { targetTimeline } : {})
      },
      create: {
        userId,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        age: calculatedAge,
        gender: gender || null,
        profilePhoto: profilePhoto || null,
        houseFlatStreet: houseFlatStreet || null,
        localityArea: localityArea || null,
        city: city || null,
        state: state || null,
        pinCode: pinCode || null,
        isPermanentSame: isPermanentSame !== undefined ? Boolean(isPermanentSame) : true,
        permanentAddress: permanentAddress || null,
        referralSource: referralSource || null,
        referralDetails: referralDetails || null,

        currentWeightKg: parsedWeight,
        heightCm: parsedHeight,
        bmi: calculatedBmi,
        bodyFatPercentage: bodyFatPercentage ? parseFloat(String(bodyFatPercentage)) : null,
        muscleMassKg: muscleMassKg ? parseFloat(String(muscleMassKg)) : null,
        waistCm: waistCm ? parseFloat(String(waistCm)) : null,
        chestCm: chestCm ? parseFloat(String(chestCm)) : null,
        hipCm: hipCm ? parseFloat(String(hipCm)) : null,

        hasHealthCondition: Boolean(hasHealthCondition),
        healthConditions: conditionsJson || null,
        otherConditionText: otherConditionText || null,
        isTakingMedication: Boolean(isTakingMedication),
        medicationDetails: medicationDetails || null,
        advisedAvoidExercise: Boolean(advisedAvoidExercise),
        avoidExerciseDetails: avoidExerciseDetails || null,
        hasMajorSurgery: Boolean(hasMajorSurgery),
        surgeryDetails: surgeryDetails || null,
        hasGymInjury: Boolean(hasGymInjury),
        injuryDetails: injuryDetails || null,

        primaryGoal: primaryGoal || null,
        specificGoal: specificGoal || null,
        targetWeightKg: targetWeightKg ? parseFloat(String(targetWeightKg)) : null,
        targetTimeline: targetTimeline || null
      }
    });

    res.json({
      success: true,
      message: 'Your health and fitness assessment has been saved!',
      profile
    });
  } catch (error: any) {
    console.error('updateMyHealthProfile error:', error);
    res.status(500).json({ error: 'Failed to update fitness metrics.' });
  }
}
