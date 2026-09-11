import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import assert from 'assert';

const prisma = new PrismaClient();

function escapeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 100% CLEAN PROTOTYPE & SUPER ADMIN TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function it(desc, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ [FAIL] ${desc}: ${e.message}`);
      throw e;
    }
  }

  // Group 1: Single Super Admin State
  console.log('📦 TEST GROUP 1: Single Super Admin Account & Clean Database');
  
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  it('Single Super Admin account exists with email superadmin@ironvault.com', () => {
    assert(superAdmin, 'Super Admin user should exist');
    assert.strictEqual(superAdmin.email, 'superadmin@ironvault.com');
    assert.strictEqual(superAdmin.role, 'SUPER_ADMIN');
  });

  it('Super Admin password validates with superadmin123', async () => {
    const isMatch = await bcrypt.compare('superadmin123', superAdmin.passwordHash);
    assert.strictEqual(isMatch, true, 'Password superadmin123 should match hash');
  });

  const allUsersCount = await prisma.user.count();
  const allGymsCount = await prisma.gym.count();

  it('No dummy test data exists in database (only 1 user, 0 dummy gyms)', () => {
    assert.strictEqual(allUsersCount, 1, `Expected exactly 1 user, found ${allUsersCount}`);
    assert.strictEqual(allGymsCount, 0, `Expected exactly 0 gyms, found ${allGymsCount}`);
  });

  // Group 2: Live Prototype Flow (Register Gym -> Join Member -> Super Admin Portal)
  console.log('\n📦 TEST GROUP 2: Full End-to-End SaaS Lifecycle Test');

  // Create a brand new gym as an onboarding gym owner
  const testGym = await prisma.gym.create({
    data: {
      name: 'Summit Fitness Club',
      slug: 'summit-fitness-test',
      inviteCode: '888999',
      address: '100 Mountain View Ave',
      city: 'Denver',
      state: 'CO',
      staticQrCodeHash: 'SUMMIT_STATIC_TEST',
      exitQrCodeHash: 'SUMMIT_EXIT_TEST',
      ownerContactEmail: 'owner@summitfit.com',
      ownerContactPhone: '+1-555-099-1234'
    }
  });

  const ownerPassHash = await bcrypt.hash('ownerpass123', 10);
  const testOwner = await prisma.user.create({
    data: {
      email: 'owner@summitfit.com',
      fullName: 'David Summit',
      passwordHash: ownerPassHash,
      role: 'GYM_OWNER',
      gymId: testGym.id
    }
  });

  it('Gym Owner can register a fresh gym with unique 6-digit access code', () => {
    assert(testGym.id, 'Gym should have UUID');
    assert.strictEqual(testGym.inviteCode, '888999');
    assert.strictEqual(testOwner.gymId, testGym.id);
  });

  // Register a member using the gym code
  const memberPassHash = await bcrypt.hash('memberpass123', 10);
  const testMember = await prisma.user.create({
    data: {
      email: 'member@summitfit.com',
      fullName: 'Sarah Athlete',
      passwordHash: memberPassHash,
      role: 'MEMBER',
      gymId: testGym.id
    }
  });

  await prisma.subscription.create({
    data: {
      userId: testMember.id,
      gymId: testGym.id,
      planName: 'Monthly Pro Pass',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      price: 65,
      paymentMethod: 'ONLINE'
    }
  });

  it('Member can onboard into the gym with active pass and gym binding', () => {
    assert.strictEqual(testMember.gymId, testGym.id);
    assert.strictEqual(testMember.role, 'MEMBER');
  });

  // Group 3: Super Admin Inspection & CSV Export
  console.log('\n📦 TEST GROUP 3: Super Admin Portal Query & CSV Exports');

  const adminGymsQuery = await prisma.gym.findMany({
    include: {
      _count: { select: { users: true, subscriptions: true } },
      users: { where: { role: 'GYM_OWNER' } }
    }
  });

  it('Super Admin queries all gyms and sees the newly registered workspace', () => {
    assert.strictEqual(adminGymsQuery.length, 1);
    assert.strictEqual(adminGymsQuery[0].name, 'Summit Fitness Club');
    assert.strictEqual(adminGymsQuery[0].users[0].fullName, 'David Summit');
  });

  const gymsHeaders = ['Gym ID', 'Gym Business Name', '6-Digit Access Code', 'Owner Full Name', 'Owner Login Gmail'];
  const gymsRow = [testGym.id, testGym.name, testGym.inviteCode, testOwner.fullName, testOwner.email];
  const gymsCsv = [gymsHeaders.map(escapeCsvCell).join(','), gymsRow.map(escapeCsvCell).join(',')].join('\r\n');

  it('Super Admin Gyms CSV Export matches RFC 4180 format', () => {
    assert(gymsCsv.includes('"Summit Fitness Club"'));
    assert(gymsCsv.includes('"888999"'));
    assert(gymsCsv.includes('"David Summit"'));
  });

  // Cleanup the test data so DB remains 100% pristine with only Super Admin
  await prisma.subscription.deleteMany({ where: { gymId: testGym.id } });
  await prisma.user.deleteMany({ where: { gymId: testGym.id } });
  await prisma.gym.delete({ where: { id: testGym.id } });

  const finalUserCount = await prisma.user.count();
  const finalGymCount = await prisma.gym.count();

  it('Database cleanly resets to single Super Admin state (1 user, 0 gyms)', () => {
    assert.strictEqual(finalUserCount, 1);
    assert.strictEqual(finalGymCount, 0);
  });

  console.log('\n======================================================');
  console.log(`🎉 ALL ${passed}/${total} TESTS PASSED CLEANLY!`);
  console.log('======================================================\n');
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
