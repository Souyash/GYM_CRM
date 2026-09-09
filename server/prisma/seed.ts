import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding IronVault Gym CRM database...');

  // 1. Clean existing records for fresh seed
  await prisma.notificationLog.deleteMany();
  await prisma.failedAccessLog.deleteMany();
  await prisma.attendanceEntry.deleteMany();
  await prisma.deviceChangeRequest.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.facility.deleteMany();

  // 2. Create physical facility with 50-meter geofence coordinates
  // Coordinates set to San Francisco Market St entrance or generic GPS: (37.774929, -122.419416)
  const facility = await prisma.facility.create({
    data: {
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

  console.log(`Facility created: ${facility.name} (ID: ${facility.id})`);

  // 3. Password hashes
  const adminPassHash = await bcrypt.hash('Admin@12345', 10);
  const managerPassHash = await bcrypt.hash('Manager@12345', 10);
  const memberPassHash = await bcrypt.hash('Member@12345', 10);

  // 4. Create Super Admin (Owner)
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@ironvaultgym.com',
      fullName: 'Marcus Vance (Owner)',
      passwordHash: adminPassHash,
      role: 'SUPER_ADMIN',
      phone: '+1-555-019-8800',
      facilityId: facility.id,
      deviceStatus: 'NORMAL'
    }
  });

  // 5. Create Manager (Staff)
  const manager = await prisma.user.create({
    data: {
      email: 'manager@ironvaultgym.com',
      fullName: 'Sarah Jenkins (Desk Staff)',
      passwordHash: managerPassHash,
      role: 'MANAGER',
      phone: '+1-555-019-4422',
      facilityId: facility.id,
      deviceStatus: 'NORMAL'
    }
  });

  // 6. Clean Member for Testing: Alex Rivera
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const member = await prisma.user.create({
    data: {
      email: 'macbook.member@ironvaultgym.com',
      fullName: 'Alex Rivera',
      passwordHash: memberPassHash,
      role: 'MEMBER',
      phone: '+1-555-017-7700',
      facilityId: facility.id,
      deviceStatus: 'NORMAL'
    }
  });

  await prisma.subscription.create({
    data: {
      userId: member.id,
      planName: 'Monthly Unlimited Pro Pass',
      price: 65.0,
      startDate: now,
      endDate: thirtyDaysLater,
      status: 'ACTIVE',
      deskBilledById: manager.id,
      paymentMethod: 'ONLINE'
    }
  });

  console.log('✅ Clean database initialized successfully!');
  console.log('---------------------------------------------------------');
  console.log('👑 Gym Owner:  admin@ironvaultgym.com / Admin@12345');
  console.log('🧑‍💼 Front Desk: manager@ironvaultgym.com / Manager@12345');
  console.log('🏃 Active Member: macbook.member@ironvaultgym.com / Member@12345');
  console.log('✨ 0 attendance entries logged - Ready for clean real testing!');
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

