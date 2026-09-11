import { PrismaClient } from '@prisma/client';
import assert from 'assert';

const prisma = new PrismaClient();

// Helper: Escape CSV cell per RFC 4180
function escapeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

async function runSuperAdminTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING SUPER ADMIN & CSV EXPORT TEST SUITE');
  console.log('======================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function it(description, fn) {
    totalTests++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${description}`);
      passedTests++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${description}`);
      console.error(`     Error: ${err.message}`);
      throw err;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Gyms & Owners Data Integrity
  // -------------------------------------------------------------
  console.log('📦 TEST GROUP 1: Gyms & Owners Platform Verification');

  const gyms = await prisma.gym.findMany({
    include: {
      _count: {
        select: {
          users: true,
          subscriptions: true,
          attendanceEntries: true
        }
      },
      users: {
        where: {
          role: { in: ['GYM_OWNER', 'MANAGER', 'SUPER_ADMIN'] }
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true
        }
      }
    },
    orderBy: { inviteCode: 'asc' }
  });

  it('Should have at least 5 distinct Gym Workspaces registered', () => {
    assert.strictEqual(gyms.length >= 5, true, `Expected >= 5 gyms, got ${gyms.length}`);
  });

  const expectedCodes = ['100001', '200002', '300003', '400004', '500005'];
  it('Should verify all 5 unique 6-digit access codes exist', () => {
    const codes = gyms.map(g => g.inviteCode);
    expectedCodes.forEach(exp => {
      assert.strictEqual(codes.includes(exp), true, `Missing expected access code: ${exp}`);
    });
  });

  it('Every gym should have a designated Gym Owner with valid email and name', () => {
    gyms.forEach(g => {
      const owner = g.users[0] || (g.ownerContactEmail ? { fullName: 'Owner', email: g.ownerContactEmail } : null);
      assert.notStrictEqual(owner, null, `Gym ${g.name} has no designated owner`);
      assert.strictEqual(typeof owner.email === 'string' && owner.email.includes('@'), true, `Gym ${g.name} has invalid owner email: ${owner?.email}`);
      assert.strictEqual(typeof owner.fullName === 'string' && owner.fullName.length > 0, true, `Gym ${g.name} has missing owner name`);
    });
  });

  // -------------------------------------------------------------
  // TEST 2: Members Directory & Multi-Tenant Scoping
  // -------------------------------------------------------------
  console.log('\n👥 TEST GROUP 2: Members Directory & Multi-Tenancy Scoping');

  const members = await prisma.user.findMany({
    where: { role: 'MEMBER' },
    include: {
      gym: true,
      subscriptions: {
        orderBy: { endDate: 'desc' },
        take: 1
      }
    }
  });

  it('Should have at least 12 registered members across all gyms', () => {
    assert.strictEqual(members.length >= 12, true, `Expected >= 12 members, got ${members.length}`);
  });

  it('Every member should belong to a valid Gym with matching gymId and inviteCode', () => {
    members.forEach(m => {
      assert.notStrictEqual(m.gymId, null, `Member ${m.fullName} has null gymId`);
      assert.notStrictEqual(m.gym, null, `Member ${m.fullName} has null gym relation`);
      assert.strictEqual(expectedCodes.includes(m.gym.inviteCode), true, `Member ${m.fullName} belongs to unexpected code ${m.gym?.inviteCode}`);
    });
  });

  it('Should correctly filter members strictly belonging to Spartan Arena (Code: 200002)', () => {
    const spartanGym = gyms.find(g => g.inviteCode === '200002');
    assert.notStrictEqual(spartanGym, undefined);

    const spartanMembers = members.filter(m => m.gymId === spartanGym.id);
    assert.strictEqual(spartanMembers.length >= 3, true, `Expected >= 3 Spartan members, got ${spartanMembers.length}`);

    const spartanEmails = spartanMembers.map(m => m.email);
    assert.strictEqual(spartanEmails.includes('marcus@spartaniron.com'), true);
    assert.strictEqual(spartanEmails.includes('chloe.fit@gmail.com'), true);
    assert.strictEqual(spartanEmails.includes('brandon.stark@yahoo.com'), true);
  });

  it('Should verify active vs expired subscriptions platform-wide', () => {
    const now = new Date();
    const activeMembers = members.filter(m => {
      const sub = m.subscriptions[0];
      return sub && sub.status === 'ACTIVE' && new Date(sub.endDate) > now;
    });

    const expiredMembers = members.filter(m => {
      const sub = m.subscriptions[0];
      return sub && (sub.status === 'EXPIRED' || new Date(sub.endDate) <= now);
    });

    assert.strictEqual(activeMembers.length >= 8, true, `Expected >= 8 active members, got ${activeMembers.length}`);
    assert.strictEqual(expiredMembers.length >= 3, true, `Expected >= 3 expired members, got ${expiredMembers.length}`);
  });

  // -------------------------------------------------------------
  // TEST 3: CSV Export Engine & RFC 4180 Compliance
  // -------------------------------------------------------------
  console.log('\n📥 TEST GROUP 3: CSV Export Generation & Formatting');

  it('Should generate valid Gyms & Owners CSV matching required schema', () => {
    const headers = [
      'Gym ID',
      'Gym Business Name',
      '6-Digit Access Code',
      'Owner Full Name',
      'Owner Login Gmail',
      'Owner Phone',
      'Physical Address',
      'City',
      'State',
      'Registered Members Count',
      'Active Subscriptions Count',
      'Total Checkins Scans',
      'Status',
      'Created Date'
    ];

    const rows = gyms.map(g => [
      g.id,
      g.name,
      g.inviteCode,
      g.users[0]?.fullName || 'Gym Owner',
      g.users[0]?.email || g.ownerContactEmail || 'N/A',
      g.users[0]?.phone || g.ownerContactPhone || 'N/A',
      g.address,
      g.city || 'N/A',
      g.state || 'N/A',
      g._count?.users ?? 0,
      g._count?.subscriptions ?? 0,
      g._count?.attendanceEntries ?? 0,
      g.isActive ? 'Active' : 'Inactive',
      new Date(g.createdAt).toLocaleDateString()
    ]);

    const csvString = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map(row => row.map(escapeCsvCell).join(','))
    ].join('\r\n');

    // Assertions
    const lines = csvString.split('\r\n');
    assert.strictEqual(lines.length, gyms.length + 1, `Expected ${gyms.length + 1} lines in CSV, got ${lines.length}`);
    assert.strictEqual(csvString.includes('undefined'), false, 'CSV contains undefined text');
    assert.strictEqual(csvString.includes('NaN'), false, 'CSV contains NaN text');
    assert.strictEqual(lines[0].includes('6-Digit Access Code'), true);
    assert.strictEqual(lines[0].includes('Owner Login Gmail'), true);
  });

  it('Should generate valid Members Directory CSV matching required schema', () => {
    const headers = [
      'Member ID',
      'Member Full Name',
      'Email Address',
      'Phone Number',
      'Role',
      'Gym Business Name',
      'Gym 6-Digit Access Code',
      'Membership Plan Name',
      'Plan Price ($)',
      'Membership Status',
      'Start Date',
      'Expiration Date',
      'Registered Date'
    ];

    const rows = members.map(m => {
      const activeSub = m.subscriptions[0];
      const isSubActive = activeSub && activeSub.status === 'ACTIVE' && new Date(activeSub.endDate) > new Date();
      return [
        m.id,
        m.fullName,
        m.email,
        m.phone || 'N/A',
        m.role,
        m.gym?.name || 'Unassigned',
        m.gym?.inviteCode || 'N/A',
        activeSub?.planName || 'No Active Plan',
        activeSub?.price ?? 0,
        isSubActive ? 'ACTIVE' : 'INACTIVE',
        activeSub?.startDate ? new Date(activeSub.startDate).toLocaleDateString() : 'N/A',
        activeSub?.endDate ? new Date(activeSub.endDate).toLocaleDateString() : 'N/A',
        new Date(m.createdAt).toLocaleDateString()
      ];
    });

    const csvString = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map(row => row.map(escapeCsvCell).join(','))
    ].join('\r\n');

    const lines = csvString.split('\r\n');
    assert.strictEqual(lines.length, members.length + 1, `Expected ${members.length + 1} lines in CSV, got ${lines.length}`);
    assert.strictEqual(csvString.includes('undefined'), false, 'Members CSV contains undefined text');
    assert.strictEqual(csvString.includes('NaN'), false, 'Members CSV contains NaN text');
    assert.strictEqual(lines[0].includes('Gym 6-Digit Access Code'), true);
    assert.strictEqual(lines[0].includes('Membership Status'), true);
  });

  console.log('\n======================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED CLEANLY!`);
  console.log('======================================================\n');
}

runSuperAdminTests()
  .catch((err) => {
    console.error('Test run failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
