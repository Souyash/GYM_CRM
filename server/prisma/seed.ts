import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Multi-Tenant IronVault SaaS database...');

  // 1. Clean existing records in referential integrity order
  await prisma.otpVerification.deleteMany();
  await prisma.memberHealthProfile.deleteMany();
  await prisma.classBooking.deleteMany();
  await prisma.groupClass.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.failedAccessLog.deleteMany();
  await prisma.attendanceEntry.deleteMany();
  await prisma.deviceChangeRequest.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.gym.deleteMany();

  // 2. Create Tenant Gym 1: IronVault Apex Fitness Downtown (Code: 100001)
  const gym1 = await prisma.gym.create({
    data: {
      name: 'IronVault Apex Fitness Downtown',
      slug: 'ironvault-downtown',
      inviteCode: '100001',
      address: '500 Market Street, Suite 100',
      city: 'San Francisco',
      state: 'CA',
      latitude: 37.774929,
      longitude: -122.419416,
      geofenceRadiusMeters: 50.0,
      staticQrCodeHash: 'FACILITY_IV_APEX_DOWNTOWN_STATIC_2026',
      exitQrCodeHash: 'FACILITY_IV_APEX_DOWNTOWN_EXIT_2026',
      ownerContactEmail: 'owner@ironvaultgym.com',
      ownerContactPhone: '+1-555-019-8800'
    }
  });

  const facility1 = await prisma.facility.create({
    data: {
      gymId: gym1.id,
      name: 'IronVault Apex Fitness Downtown',
      address: '500 Market Street, Suite 100, San Francisco, CA 94105',
      latitude: 37.774929,
      longitude: -122.419416,
      geofenceRadiusMeters: 50.0,
      staticQrCodeHash: 'FACILITY_IV_APEX_DOWNTOWN_STATIC_2026',
      exitQrCodeHash: 'FACILITY_IV_APEX_DOWNTOWN_EXIT_2026',
      ownerContactEmail: 'owner@ironvaultgym.com',
      ownerContactPhone: '+1-555-019-8800'
    }
  });

  // 3. Create Tenant Gym 2: Spartan Heavy Iron Arena (Code: 200002)
  const gym2 = await prisma.gym.create({
    data: {
      name: 'Spartan Heavy Iron Arena',
      slug: 'spartan-arena',
      inviteCode: '200002',
      address: '742 Evergreen Terrace, Suite 400',
      city: 'Austin',
      state: 'TX',
      latitude: 30.267153,
      longitude: -97.7430608,
      geofenceRadiusMeters: 60.0,
      staticQrCodeHash: 'FACILITY_SPARTAN_ARENA_STATIC_2026',
      exitQrCodeHash: 'FACILITY_SPARTAN_ARENA_EXIT_2026',
      ownerContactEmail: 'owner@spartaniron.com',
      ownerContactPhone: '+1-555-987-6543'
    }
  });

  const facility2 = await prisma.facility.create({
    data: {
      gymId: gym2.id,
      name: 'Spartan Heavy Iron Arena',
      address: '742 Evergreen Terrace, Suite 400, Austin, TX 78701',
      latitude: 30.267153,
      longitude: -97.7430608,
      geofenceRadiusMeters: 60.0,
      staticQrCodeHash: 'FACILITY_SPARTAN_ARENA_STATIC_2026',
      exitQrCodeHash: 'FACILITY_SPARTAN_ARENA_EXIT_2026',
      ownerContactEmail: 'owner@spartaniron.com',
      ownerContactPhone: '+1-555-987-6543'
    }
  });

  console.log(`Tenant 1 created: ${gym1.name} (Code: ${gym1.inviteCode})`);
  console.log(`Tenant 2 created: ${gym2.name} (Code: ${gym2.inviteCode})`);

  // 4. Password hashes
  const adminPassHash = await bcrypt.hash('Admin@12345', 10);
  const managerPassHash = await bcrypt.hash('Manager@12345', 10);
  const memberPassHash = await bcrypt.hash('Member@12345', 10);
  const spartanOwnerPassHash = await bcrypt.hash('Spartan@12345', 10);
  const spartanMemberPassHash = await bcrypt.hash('SpartanMember@12345', 10);

  // 5. Create Super Admin (Global SaaS manager)
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@ironvaultgym.com',
      fullName: 'Marcus Vance (Super Admin)',
      passwordHash: adminPassHash,
      role: 'SUPER_ADMIN',
      phone: '+1-555-019-8800',
      gymId: gym1.id,
      facilityId: facility1.id,
      deviceStatus: 'NORMAL'
    }
  });

  // 6. Create Gym Owner / Manager for Gym 1
  const manager1 = await prisma.user.create({
    data: {
      email: 'manager@ironvaultgym.com',
      fullName: 'Sarah Jenkins (IronVault Owner)',
      passwordHash: managerPassHash,
      role: 'GYM_OWNER',
      phone: '+1-555-019-4422',
      gymId: gym1.id,
      facilityId: facility1.id,
      deviceStatus: 'NORMAL'
    }
  });

  // 7. Create Member for Gym 1: Alex Rivera
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const member1 = await prisma.user.create({
    data: {
      email: 'macbook.member@ironvaultgym.com',
      fullName: 'Alex Rivera',
      passwordHash: memberPassHash,
      role: 'MEMBER',
      phone: '+1-555-017-7700',
      gymId: gym1.id,
      facilityId: facility1.id,
      deviceStatus: 'NORMAL'
    }
  });

  await prisma.subscription.create({
    data: {
      gymId: gym1.id,
      userId: member1.id,
      planName: 'Monthly Unlimited Pro Pass',
      price: 65.0,
      startDate: now,
      endDate: thirtyDaysLater,
      status: 'ACTIVE',
      deskBilledById: manager1.id,
      paymentMethod: 'ONLINE'
    }
  });

  // Member 1 Health Profile
  await prisma.memberHealthProfile.create({
    data: {
      gymId: gym1.id,
      userId: member1.id,
      dateOfBirth: new Date('1996-04-12'),
      age: 30,
      gender: 'Male',
      houseFlatStreet: '450 Mission St Apt 12',
      localityArea: 'SoMa',
      city: 'San Francisco',
      state: 'CA',
      pinCode: '94105',
      isPermanentSame: true,
      referralSource: 'Social Media',
      currentWeightKg: 78.5,
      heightCm: 180,
      bmi: 24.2,
      bodyFatPercentage: 15.5,
      muscleMassKg: 62.0,
      waistCm: 82,
      chestCm: 104,
      hipCm: 98,
      hasHealthCondition: false,
      primaryGoal: 'Muscle Gain',
      specificGoal: 'Increase bench press and add lean muscle mass',
      targetWeightKg: 82.0,
      targetTimeline: '3 Months'
    }
  });

  // 8. Create Gym Owner for Gym 2: Spartan Heavy Iron Arena
  const spartanOwner = await prisma.user.create({
    data: {
      email: 'owner@spartaniron.com',
      fullName: 'Leonidas Stone (Spartan Owner)',
      passwordHash: spartanOwnerPassHash,
      role: 'GYM_OWNER',
      phone: '+1-555-987-6543',
      gymId: gym2.id,
      facilityId: facility2.id,
      deviceStatus: 'NORMAL'
    }
  });

  // 9. Create Member for Gym 2
  const spartanMember = await prisma.user.create({
    data: {
      email: 'marcus@spartaniron.com',
      fullName: 'Marcus Steel',
      passwordHash: spartanMemberPassHash,
      role: 'MEMBER',
      phone: '+1-555-777-8899',
      gymId: gym2.id,
      facilityId: facility2.id,
      deviceStatus: 'NORMAL'
    }
  });

  await prisma.subscription.create({
    data: {
      gymId: gym2.id,
      userId: spartanMember.id,
      planName: 'Spartan Heavy Barbell Pass',
      price: 85.0,
      startDate: now,
      endDate: thirtyDaysLater,
      status: 'ACTIVE',
      deskBilledById: spartanOwner.id,
      paymentMethod: 'CARD'
    }
  });

  await prisma.memberHealthProfile.create({
    data: {
      gymId: gym2.id,
      userId: spartanMember.id,
      dateOfBirth: new Date('1992-08-20'),
      age: 34,
      gender: 'Male',
      city: 'Austin',
      state: 'TX',
      primaryGoal: 'Strength Building',
      targetWeightKg: 95.0,
      targetTimeline: '6 Months'
    }
  });

  // 10. Seed Community Posts for Gym 1
  const post1 = await prisma.communityPost.create({
    data: {
      gymId: gym1.id,
      authorId: superAdmin.id,
      facilityId: facility1.id,
      content: '📢 Welcome to IronVault Apex Community! Starting this Saturday at 10:00 AM, we are hosting our monthly Olympic Lifting & Strength Technique Workshop. Free for all active members. Let us know below if you are attending!',
      tag: 'Announcement',
      isPinned: true,
      isOfficial: true
    }
  });

  const post2 = await prisma.communityPost.create({
    data: {
      gymId: gym1.id,
      authorId: manager1.id,
      facilityId: facility1.id,
      content: '🔥 Today’s Workout of the Day (WOD):\n5 Rounds for time:\n• 10 Deadlifts (bodyweight)\n• 15 Box Jumps (24" / 20")\n• 200m Row sprint\n\nFocus on tight core bracing and explosive hip extension. Drop your finish times in the comments!',
      tag: 'Workout of the Day',
      isPinned: false,
      isOfficial: true
    }
  });

  const post3 = await prisma.communityPost.create({
    data: {
      gymId: gym1.id,
      authorId: member1.id,
      facilityId: facility1.id,
      content: '🎉 Milestone unlocked! Hit a new 185 lb bench press PR today after 6 months of consistency. Massive thanks to the 6 AM crew for the spot and hype!',
      tag: 'Member PR',
      isPinned: false,
      isOfficial: false
    }
  });

  // Post for Gym 2 (Isolated)
  await prisma.communityPost.create({
    data: {
      gymId: gym2.id,
      authorId: spartanOwner.id,
      facilityId: facility2.id,
      content: '🛡️ Welcome to Spartan Heavy Iron Arena! Power racks are cleaned, chalk buckets filled. Leave weakness at the door.',
      tag: 'Announcement',
      isPinned: true,
      isOfficial: true
    }
  });

  // Seed Likes & Comments for Gym 1
  await prisma.postLike.create({ data: { postId: post1.id, userId: member1.id } });
  await prisma.postLike.create({ data: { postId: post1.id, userId: manager1.id } });
  await prisma.postLike.create({ data: { postId: post2.id, userId: member1.id } });
  await prisma.postLike.create({ data: { postId: post3.id, userId: superAdmin.id } });

  await prisma.postComment.create({
    data: {
      postId: post1.id,
      authorId: member1.id,
      text: 'Count me in! Really looking forward to cleaning up my snatch technique.'
    }
  });

  // 11. Seed Group Classes for Gym 1
  const class1Time = new Date(now);
  class1Time.setHours(17, 30, 0, 0);
  const class2Time = new Date(now);
  class2Time.setHours(18, 45, 0, 0);

  const gc1 = await prisma.groupClass.create({
    data: {
      gymId: gym1.id,
      title: 'High-Octane HIIT & Core Circuit',
      coach: 'Coach Elena',
      startTime: class1Time,
      durationMinutes: 45,
      zone: 'Functional Turf Zone',
      maxSeats: 16,
      intensity: 'High',
      facilityId: facility1.id,
      createdById: manager1.id
    }
  });

  await prisma.groupClass.create({
    data: {
      gymId: gym1.id,
      title: 'Powerlifting Heavy Squat & Bench Clinic',
      coach: 'Coach Marcus',
      startTime: class2Time,
      durationMinutes: 60,
      zone: 'Olympic Lifting Platforms',
      maxSeats: 10,
      intensity: 'High',
      facilityId: facility1.id,
      createdById: superAdmin.id
    }
  });

  // Seed Group Class for Gym 2 (Isolated)
  await prisma.groupClass.create({
    data: {
      gymId: gym2.id,
      title: 'Spartan Atlas Stone & Log Press Clinic',
      coach: 'Coach Leonidas',
      startTime: class1Time,
      durationMinutes: 60,
      zone: 'Strongman Pit',
      maxSeats: 8,
      intensity: 'High',
      facilityId: facility2.id,
      createdById: spartanOwner.id
    }
  });

  // Member booking
  await prisma.classBooking.create({
    data: {
      classId: gc1.id,
      userId: member1.id
    }
  });

  // 12. Seed verified Attendance Entries for Gym 1
  for (let i = 0; i < 4; i++) {
    const scanDate = new Date();
    scanDate.setDate(scanDate.getDate() - i);
    scanDate.setHours(8 + i, 15, 0, 0);

    const exitDate = new Date(scanDate);
    exitDate.setMinutes(exitDate.getMinutes() + 55);

    await prisma.attendanceEntry.create({
      data: {
        gymId: gym1.id,
        userId: member1.id,
        facilityId: facility1.id,
        scannedAt: scanDate,
        exitedAt: exitDate,
        sessionDurationMinutes: 55,
        status: 'COMPLETED',
        deviceId: 'seed-verified-device-macbook',
        exitDeviceId: 'seed-exit-turnstile',
        gpsLat: facility1.latitude,
        gpsLng: facility1.longitude,
        distanceFromFacility: 4.2,
        cooldownExpiresAt: new Date(scanDate.getTime() + 180000)
      }
    });
  }

  console.log('✅ Multi-Tenant SaaS database initialized successfully!');
  console.log('---------------------------------------------------------');
  console.log('🏢 TENANT 1: IronVault Apex Fitness Downtown (Code: 100001)');
  console.log('   👑 Super Admin: admin@ironvaultgym.com / Admin@12345');
  console.log('   🧑‍💼 Gym Owner:   manager@ironvaultgym.com / Manager@12345');
  console.log('   🏃 Member:      macbook.member@ironvaultgym.com / Member@12345');
  console.log('---------------------------------------------------------');
  console.log('🏢 TENANT 2: Spartan Heavy Iron Arena (Code: 200002)');
  console.log('   🧑‍💼 Gym Owner:   owner@spartaniron.com / Spartan@12345');
  console.log('   🏃 Member:      marcus@spartaniron.com / SpartanMember@12345');
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
