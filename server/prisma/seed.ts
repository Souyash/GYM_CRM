import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Multi-Tenant IronVault SaaS database with comprehensive test data...');

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

  // Common password hashes
  const defaultPassHash = await bcrypt.hash('Member@12345', 10);
  const ownerPassHash = await bcrypt.hash('Owner@12345', 10);
  const adminPassHash = await bcrypt.hash('Admin@12345', 10);

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // Expired 15 days ago

  // ----------------------------------------------------------------------
  // 🏢 GYM 1: IronVault Apex Fitness Downtown (San Francisco, CA) - 100001
  // ----------------------------------------------------------------------
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

  // Super Admin
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

  // Gym 1 Owner
  const owner1 = await prisma.user.create({
    data: {
      email: 'manager@ironvaultgym.com',
      fullName: 'Sarah Jenkins',
      passwordHash: ownerPassHash,
      role: 'GYM_OWNER',
      phone: '+1-555-019-4422',
      gymId: gym1.id,
      facilityId: facility1.id,
      deviceStatus: 'NORMAL'
    }
  });

  // Gym 1 Members
  const m1_1 = await prisma.user.create({
    data: {
      email: 'macbook.member@ironvaultgym.com',
      fullName: 'Alex Rivera',
      passwordHash: defaultPassHash,
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
      userId: m1_1.id,
      planName: 'Monthly Unlimited Pro Pass',
      price: 65.0,
      startDate: now,
      endDate: thirtyDaysLater,
      status: 'ACTIVE',
      deskBilledById: owner1.id,
      paymentMethod: 'ONLINE'
    }
  });

  const m1_2 = await prisma.user.create({
    data: {
      email: 'jessica.huang@gmail.com',
      fullName: 'Jessica Huang',
      passwordHash: defaultPassHash,
      role: 'MEMBER',
      phone: '+1-555-017-8811',
      gymId: gym1.id,
      facilityId: facility1.id,
      deviceStatus: 'NORMAL'
    }
  });
  await prisma.subscription.create({
    data: {
      gymId: gym1.id,
      userId: m1_2.id,
      planName: 'Annual VIP Membership',
      price: 540.0,
      startDate: now,
      endDate: oneYearLater,
      status: 'ACTIVE',
      deskBilledById: owner1.id,
      paymentMethod: 'CARD'
    }
  });

  const m1_3 = await prisma.user.create({
    data: {
      email: 'david.miller@gmail.com',
      fullName: 'David Miller',
      passwordHash: defaultPassHash,
      role: 'MEMBER',
      phone: '+1-555-017-9922',
      gymId: gym1.id,
      facilityId: facility1.id,
      deviceStatus: 'NORMAL'
    }
  });
  await prisma.subscription.create({
    data: {
      gymId: gym1.id,
      userId: m1_3.id,
      planName: 'Day Pass',
      price: 15.0,
      startDate: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000),
      endDate: pastDate,
      status: 'EXPIRED',
      deskBilledById: owner1.id,
      paymentMethod: 'CASH'
    }
  });

  // ----------------------------------------------------------------------
  // 🏢 GYM 2: Spartan Heavy Iron Arena (Austin, TX) - 200002
  // ----------------------------------------------------------------------
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

  const owner2 = await prisma.user.create({
    data: {
      email: 'owner@spartaniron.com',
      fullName: 'Leonidas Stone',
      passwordHash: ownerPassHash,
      role: 'GYM_OWNER',
      phone: '+1-555-987-6543',
      gymId: gym2.id,
      facilityId: facility2.id,
      deviceStatus: 'NORMAL'
    }
  });

  const m2_1 = await prisma.user.create({
    data: {
      email: 'marcus@spartaniron.com',
      fullName: 'Marcus Steel',
      passwordHash: defaultPassHash,
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
      userId: m2_1.id,
      planName: 'Spartan Heavy Barbell Pass',
      price: 85.0,
      startDate: now,
      endDate: thirtyDaysLater,
      status: 'ACTIVE',
      deskBilledById: owner2.id,
      paymentMethod: 'CARD'
    }
  });

  const m2_2 = await prisma.user.create({
    data: {
      email: 'chloe.fit@gmail.com',
      fullName: 'Chloe Bennett',
      passwordHash: defaultPassHash,
      role: 'MEMBER',
      phone: '+1-555-777-1122',
      gymId: gym2.id,
      facilityId: facility2.id,
      deviceStatus: 'NORMAL'
    }
  });
  await prisma.subscription.create({
    data: {
      gymId: gym2.id,
      userId: m2_2.id,
      planName: 'Quarterly Elite Pass',
      price: 165.0,
      startDate: now,
      endDate: ninetyDaysLater,
      status: 'ACTIVE',
      deskBilledById: owner2.id,
      paymentMethod: 'ONLINE'
    }
  });

  const m2_3 = await prisma.user.create({
    data: {
      email: 'brandon.stark@yahoo.com',
      fullName: 'Brandon Stark',
      passwordHash: defaultPassHash,
      role: 'MEMBER',
      phone: '+1-555-777-3344',
      gymId: gym2.id,
      facilityId: facility2.id,
      deviceStatus: 'NORMAL'
    }
  });
  await prisma.subscription.create({
    data: {
      gymId: gym2.id,
      userId: m2_3.id,
      planName: 'Monthly Standard Pass',
      price: 55.0,
      startDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      endDate: pastDate,
      status: 'EXPIRED',
      deskBilledById: owner2.id,
      paymentMethod: 'CASH'
    }
  });

  // ----------------------------------------------------------------------
  // 🏢 GYM 3: GoldBarbell Elite Strength Club (Miami, FL) - 300003
  // ----------------------------------------------------------------------
  const gym3 = await prisma.gym.create({
    data: {
      name: 'GoldBarbell Elite Strength Club',
      slug: 'goldbarbell-miami',
      inviteCode: '300003',
      address: '1200 Ocean Drive, Suite 250',
      city: 'Miami',
      state: 'FL',
      latitude: 25.761681,
      longitude: -80.191788,
      geofenceRadiusMeters: 75.0,
      staticQrCodeHash: 'FACILITY_GOLDBARBELL_STATIC_2026',
      exitQrCodeHash: 'FACILITY_GOLDBARBELL_EXIT_2026',
      ownerContactEmail: 'carlos.goldbarbell@gmail.com',
      ownerContactPhone: '+1-305-555-0144'
    }
  });

  const owner3 = await prisma.user.create({
    data: {
      email: 'carlos.goldbarbell@gmail.com',
      fullName: 'Carlos Rodriguez',
      passwordHash: ownerPassHash,
      role: 'GYM_OWNER',
      phone: '+1-305-555-0144',
      gymId: gym3.id,
      deviceStatus: 'NORMAL'
    }
  });

  const m3_1 = await prisma.user.create({
    data: {
      email: 'isabella.santos@gmail.com',
      fullName: 'Isabella Santos',
      passwordHash: defaultPassHash,
      role: 'MEMBER',
      phone: '+1-305-555-2233',
      gymId: gym3.id,
      deviceStatus: 'NORMAL'
    }
  });
  await prisma.subscription.create({
    data: {
      gymId: gym3.id,
      userId: m3_1.id,
      planName: 'Gold VIP All-Access Pass',
      price: 95.0,
      startDate: now,
      endDate: thirtyDaysLater,
      status: 'ACTIVE',
      deskBilledById: owner3.id,
      paymentMethod: 'CARD'
    }
  });

  const m3_2 = await prisma.user.create({
    data: {
      email: 'mateo.rossi@gmail.com',
      fullName: 'Mateo Rossi',
      passwordHash: defaultPassHash,
      role: 'MEMBER',
      phone: '+1-305-555-4455',
      gymId: gym3.id,
      deviceStatus: 'NORMAL'
    }
  });
  await prisma.subscription.create({
    data: {
      gymId: gym3.id,
      userId: m3_2.id,
      planName: 'Monthly Unlimited Pro Pass',
      price: 65.0,
      startDate: now,
      endDate: thirtyDaysLater,
      status: 'ACTIVE',
      deskBilledById: owner3.id,
      paymentMethod: 'ONLINE'
    }
  });

  const m3_3 = await prisma.user.create({
    data: {
      email: 'lucas.silva@outlook.com',
      fullName: 'Lucas Silva',
      passwordHash: defaultPassHash,
      role: 'MEMBER',
      phone: '+1-305-555-6677',
      gymId: gym3.id,
      deviceStatus: 'NORMAL'
    }
  });
  await prisma.subscription.create({
    data: {
      gymId: gym3.id,
      userId: m3_3.id,
      planName: 'Gold VIP All-Access Pass',
      price: 95.0,
      startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      endDate: pastDate,
      status: 'EXPIRED',
      deskBilledById: owner3.id,
      paymentMethod: 'CARD'
    }
  });

  // ----------------------------------------------------------------------
  // 🏢 GYM 4: Titan Powerhouse Gym (Chicago, IL) - 400004
  // ----------------------------------------------------------------------
  const gym4 = await prisma.gym.create({
    data: {
      name: 'Titan Powerhouse Gym',
      slug: 'titan-powerhouse',
      inviteCode: '400004',
      address: '880 N Michigan Avenue, Floor 4',
      city: 'Chicago',
      state: 'IL',
      latitude: 41.878113,
      longitude: -87.629799,
      geofenceRadiusMeters: 55.0,
      staticQrCodeHash: 'FACILITY_TITAN_POWERHOUSE_STATIC_2026',
      exitQrCodeHash: 'FACILITY_TITAN_POWERHOUSE_EXIT_2026',
      ownerContactEmail: 'viktor.titan@gmail.com',
      ownerContactPhone: '+1-312-555-0899'
    }
  });

  const owner4 = await prisma.user.create({
    data: {
      email: 'viktor.titan@gmail.com',
      fullName: 'Viktor Vance',
      passwordHash: ownerPassHash,
      role: 'GYM_OWNER',
      phone: '+1-312-555-0899',
      gymId: gym4.id,
      deviceStatus: 'NORMAL'
    }
  });

  const m4_1 = await prisma.user.create({
    data: {
      email: 'emily.watson@gmail.com',
      fullName: 'Emily Watson',
      passwordHash: defaultPassHash,
      role: 'MEMBER',
      phone: '+1-312-555-1199',
      gymId: gym4.id,
      deviceStatus: 'NORMAL'
    }
  });
  await prisma.subscription.create({
    data: {
      gymId: gym4.id,
      userId: m4_1.id,
      planName: 'Titan Heavy Lifting Pass',
      price: 70.0,
      startDate: now,
      endDate: thirtyDaysLater,
      status: 'ACTIVE',
      deskBilledById: owner4.id,
      paymentMethod: 'CARD'
    }
  });

  const m4_2 = await prisma.user.create({
    data: {
      email: 'ryan.oconnor@gmail.com',
      fullName: 'Ryan O\'Connor',
      passwordHash: defaultPassHash,
      role: 'MEMBER',
      phone: '+1-312-555-2288',
      gymId: gym4.id,
      deviceStatus: 'NORMAL'
    }
  });
  await prisma.subscription.create({
    data: {
      gymId: gym4.id,
      userId: m4_2.id,
      planName: 'Annual Champion Pass',
      price: 599.0,
      startDate: now,
      endDate: oneYearLater,
      status: 'ACTIVE',
      deskBilledById: owner4.id,
      paymentMethod: 'ONLINE'
    }
  });

  // ----------------------------------------------------------------------
  // 🏢 GYM 5: ZenFit Body & Mind Studio (Seattle, WA) - 500005
  // ----------------------------------------------------------------------
  const gym5 = await prisma.gym.create({
    data: {
      name: 'ZenFit Body & Mind Studio',
      slug: 'zenfit-seattle',
      inviteCode: '500005',
      address: '2101 4th Ave, Suite 300',
      city: 'Seattle',
      state: 'WA',
      latitude: 47.606209,
      longitude: -122.332069,
      geofenceRadiusMeters: 50.0,
      staticQrCodeHash: 'FACILITY_ZENFIT_STATIC_2026',
      exitQrCodeHash: 'FACILITY_ZENFIT_EXIT_2026',
      ownerContactEmail: 'maya.zenfit@gmail.com',
      ownerContactPhone: '+1-206-555-0312'
    }
  });

  const owner5 = await prisma.user.create({
    data: {
      email: 'maya.zenfit@gmail.com',
      fullName: 'Maya Lin',
      passwordHash: ownerPassHash,
      role: 'GYM_OWNER',
      phone: '+1-206-555-0312',
      gymId: gym5.id,
      deviceStatus: 'NORMAL'
    }
  });

  const m5_1 = await prisma.user.create({
    data: {
      email: 'samuel.green@gmail.com',
      fullName: 'Samuel Green',
      passwordHash: defaultPassHash,
      role: 'MEMBER',
      phone: '+1-206-555-7711',
      gymId: gym5.id,
      deviceStatus: 'NORMAL'
    }
  });
  await prisma.subscription.create({
    data: {
      gymId: gym5.id,
      userId: m5_1.id,
      planName: 'Holistic Yoga & Gym Pass',
      price: 80.0,
      startDate: now,
      endDate: thirtyDaysLater,
      status: 'ACTIVE',
      deskBilledById: owner5.id,
      paymentMethod: 'ONLINE'
    }
  });

  const m5_2 = await prisma.user.create({
    data: {
      email: 'sophia.taylor@gmail.com',
      fullName: 'Sophia Taylor',
      passwordHash: defaultPassHash,
      role: 'MEMBER',
      phone: '+1-206-555-8822',
      gymId: gym5.id,
      deviceStatus: 'NORMAL'
    }
  });
  await prisma.subscription.create({
    data: {
      gymId: gym5.id,
      userId: m5_2.id,
      planName: 'Monthly Pro Access',
      price: 65.0,
      startDate: now,
      endDate: thirtyDaysLater,
      status: 'ACTIVE',
      deskBilledById: owner5.id,
      paymentMethod: 'CASH'
    }
  });

  // ----------------------------------------------------------------------
  // Community Posts, Classes & Attendance
  // ----------------------------------------------------------------------
  await prisma.communityPost.create({
    data: {
      gymId: gym1.id,
      authorId: superAdmin.id,
      facilityId: facility1.id,
      content: '📢 Welcome to IronVault Apex Community! Monthly Olympic Lifting Clinic is this Saturday at 10 AM.',
      tag: 'Announcement',
      isPinned: true,
      isOfficial: true
    }
  });

  await prisma.communityPost.create({
    data: {
      gymId: gym2.id,
      authorId: owner2.id,
      facilityId: facility2.id,
      content: '🛡️ Welcome to Spartan Heavy Iron Arena! Power racks are cleaned, chalk buckets filled.',
      tag: 'Announcement',
      isPinned: true,
      isOfficial: true
    }
  });

  console.log('✅ Multi-Tenant SaaS database initialized successfully with 5 gyms and 13 members!');
  console.log('------------------------------------------------------------------------------');
  console.log('🏢 TENANT 1: IronVault Apex Fitness Downtown (Code: 100001) | San Francisco, CA');
  console.log('   👑 Super Admin: admin@ironvaultgym.com / Admin@12345');
  console.log('   🧑‍💼 Gym Owner:   manager@ironvaultgym.com / Owner@12345');
  console.log('   🏃 Members:     Alex Rivera, Jessica Huang, David Miller');
  console.log('------------------------------------------------------------------------------');
  console.log('🏢 TENANT 2: Spartan Heavy Iron Arena (Code: 200002) | Austin, TX');
  console.log('   🧑‍💼 Gym Owner:   owner@spartaniron.com / Owner@12345');
  console.log('   🏃 Members:     Marcus Steel, Chloe Bennett, Brandon Stark');
  console.log('------------------------------------------------------------------------------');
  console.log('🏢 TENANT 3: GoldBarbell Elite Strength Club (Code: 300003) | Miami, FL');
  console.log('   🧑‍💼 Gym Owner:   carlos.goldbarbell@gmail.com / Owner@12345');
  console.log('   🏃 Members:     Isabella Santos, Mateo Rossi, Lucas Silva');
  console.log('------------------------------------------------------------------------------');
  console.log('🏢 TENANT 4: Titan Powerhouse Gym (Code: 400004) | Chicago, IL');
  console.log('   🧑‍💼 Gym Owner:   viktor.titan@gmail.com / Owner@12345');
  console.log("   🏃 Members:     Emily Watson, Ryan O'Connor");
  console.log('------------------------------------------------------------------------------');
  console.log('🏢 TENANT 5: ZenFit Body & Mind Studio (Code: 500005) | Seattle, WA');
  console.log('   🧑‍💼 Gym Owner:   maya.zenfit@gmail.com / Owner@12345');
  console.log('   🏃 Members:     Samuel Green, Sophia Taylor');
  console.log('------------------------------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
