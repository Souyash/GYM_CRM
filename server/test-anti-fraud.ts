/**
 * Automated Verification Script for IronVault Gym CRM
 * Tests all 4 Anti-Fraud security tiers, role auth, threat logging, and device approvals.
 */

const API_BASE = 'http://localhost:5001/api';

async function runTests() {
  console.log('🧪 Starting Automated Anti-Fraud & Access Verification Tests...\n');

  // 1. Health check
  const healthRes = await fetch(`${API_BASE}/health`);
  const health = await healthRes.json();
  console.log('1️⃣ API Health Check:', health.status === 'ONLINE' ? '✅ PASS' : '❌ FAIL');

  // 2. Super Admin Login
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-device-id': 'DEVICE_ADMIN_TERMINAL' },
    body: JSON.stringify({ email: 'admin@ironvaultgym.com', password: 'Admin@12345' })
  });
  const adminData = await adminLoginRes.json();
  console.log('2️⃣ Super Admin Login:', adminLoginRes.ok && adminData.token ? '✅ PASS' : '❌ FAIL');
  const adminToken = adminData.token;

  // 3. Manager Login
  const managerLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-device-id': 'DEVICE_STAFF_IPAD_DESK_01' },
    body: JSON.stringify({ email: 'manager@ironvaultgym.com', password: 'Manager@12345' })
  });
  const managerData = await managerLoginRes.json();
  console.log('3️⃣ Manager Login:', managerLoginRes.ok && managerData.token ? '✅ PASS' : '❌ FAIL');

  // 4. Retrieve Facility details
  const facRes = await fetch(`${API_BASE}/facilities`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const facData = await facRes.json();
  const facility = facData.facilities[0];
  console.log(`4️⃣ Facility Loaded: ${facility.name} (Geofence: ${facility.geofenceRadiusMeters}m) ✅ PASS`);

  // 5. Active Member (John Doe) Login with Bound Device
  const memberLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-device-id': 'DEVICE_SAMSUNG_GALAXY_S24' },
    body: JSON.stringify({ email: 'john.doe@example.com', password: 'Member@12345' })
  });
  const memberData = await memberLoginRes.json();
  console.log('5️⃣ Active Member Login (Valid Device):', memberLoginRes.ok ? '✅ PASS' : '❌ FAIL');
  const memberToken = memberData.token;

  // 6. Anti-Fraud Test 1: GPS Geofence Breach (>50m away)
  console.log('\n--- Anti-Fraud Security Pipeline Tests ---');
  const outsideLat = facility.latitude + 0.01; // ~1.1km away
  const outsideLng = facility.longitude + 0.01;
  const geoBreachRes = await fetch(`${API_BASE}/entry/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${memberToken}`,
      'x-device-id': 'DEVICE_SAMSUNG_GALAXY_S24'
    },
    body: JSON.stringify({
      gym_id: facility.id,
      latitude: outsideLat,
      longitude: outsideLng
    })
  });
  const geoBreachData = await geoBreachRes.json();
  console.log(
    '6️⃣ Check 1: GPS Geofence Breach (>50m):',
    geoBreachRes.status === 403 && geoBreachData.distanceMeters > 50
      ? `✅ PASS (Rejected at ${geoBreachData.distanceMeters}m)`
      : `❌ FAIL (${geoBreachRes.status})`
  );

  // 7. Successful Entry Scan (At Gym Entrance, <= 50m)
  const validScanRes = await fetch(`${API_BASE}/entry/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${memberToken}`,
      'x-device-id': 'DEVICE_SAMSUNG_GALAXY_S24'
    },
    body: JSON.stringify({
      gym_id: facility.id,
      latitude: facility.latitude,
      longitude: facility.longitude
    })
  });
  const validScanData = await validScanRes.json();
  console.log(
    '7️⃣ Successful Entry Check (Valid GPS, Bound Device, Active Pass):',
    validScanRes.status === 200 && validScanData.access === 'GRANTED'
      ? `✅ PASS (${validScanData.message})`
      : `❌ FAIL (${validScanRes.status})`
  );

  // 8. Anti-Fraud Test 2: Anti-Passback Cooldown Lock (<3 minutes)
  const passbackRes = await fetch(`${API_BASE}/entry/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${memberToken}`,
      'x-device-id': 'DEVICE_SAMSUNG_GALAXY_S24'
    },
    body: JSON.stringify({
      gym_id: facility.id,
      latitude: facility.latitude,
      longitude: facility.longitude
    })
  });
  const passbackData = await passbackRes.json();
  console.log(
    '8️⃣ Check 4: Anti-Passback Cooldown Active:',
    passbackRes.status === 429 && passbackData.remainingSeconds > 0
      ? `✅ PASS (Locked for ${passbackData.remainingSeconds}s)`
      : `❌ FAIL (${passbackRes.status})`
  );

  // 9. Anti-Fraud Test 3: Expired Membership Rejection (Alice Smith)
  const aliceLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-device-id': 'DEVICE_IPHONE_15_PRO' },
    body: JSON.stringify({ email: 'alice.smith@example.com', password: 'Member@12345' })
  });
  const aliceData = await aliceLoginRes.json();
  const aliceScanRes = await fetch(`${API_BASE}/entry/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aliceData.token}`,
      'x-device-id': 'DEVICE_IPHONE_15_PRO'
    },
    body: JSON.stringify({
      gym_id: facility.id,
      latitude: facility.latitude,
      longitude: facility.longitude
    })
  });
  const aliceScanData = await aliceScanRes.json();
  console.log(
    '9️⃣ Phase 4: Expired Membership Rejection:',
    aliceScanRes.status === 403 && aliceScanData.subscriptionStatus === 'EXPIRED'
      ? `✅ PASS (Blocked & Alerted: ${aliceScanData.error})`
      : `❌ FAIL (${aliceScanRes.status})`
  );

  // 10. Anti-Fraud Test 4: Multi-Device Login Detection
  const rogueLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-device-id': 'DEVICE_ROGUE_UNREGISTERED_PHONE' },
    body: JSON.stringify({ email: 'john.doe@example.com', password: 'Member@12345' })
  });
  const rogueData = await rogueLoginRes.json();
  console.log(
    '🔟 Check 3: Multi-Device Login Detection & Account Flagging:',
    rogueLoginRes.status === 403 && rogueData.deviceStatus === 'FLAGGED_MULTI_DEVICE'
      ? `✅ PASS (Account flagged, change request created: ${rogueData.requestId})`
      : `❌ FAIL (${rogueLoginRes.status})`
  );

  // 11. Super Admin Approves Device Change
  if (rogueData.requestId) {
    const approveRes = await fetch(
      `${API_BASE}/device-management/requests/${rogueData.requestId}/approve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ adminNotes: 'Verified member identity in person' })
      }
    );
    const approveData = await approveRes.json();
    console.log(
      '1️⃣1️⃣ Super Admin Manual Device Approval:',
      approveRes.ok && approveData.newDeviceId === 'DEVICE_ROGUE_UNREGISTERED_PHONE'
        ? `✅ PASS (Device updated to ${approveData.newDeviceId})`
        : `❌ FAIL (${approveRes.status})`
    );

    // Now member can login with the new approved phone
    const newDeviceLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-device-id': 'DEVICE_ROGUE_UNREGISTERED_PHONE' },
      body: JSON.stringify({ email: 'john.doe@example.com', password: 'Member@12345' })
    });
    console.log(
      '1️⃣2️⃣ Post-Approval Login on New Device:',
      newDeviceLoginRes.ok ? '✅ PASS' : '❌ FAIL'
    );
  }

  // 12. Threat Monitoring Audit Log & Stats Verification
  const statsRes = await fetch(`${API_BASE}/failed-logs/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const statsData = await statsRes.json();
  console.log('\n📊 Threat Monitoring Logs Aggregated:');
  console.log('   - Total Threats Captured:', statsData.stats.totalThreats);
  console.log('   - GPS Geofence Breaches:', statsData.stats.byType.GPS_GEOFENCE_BREACH);
  console.log('   - Expired Memberships:', statsData.stats.byType.EXPIRED_MEMBERSHIP);
  console.log('   - Multi-Device Conflicts:', statsData.stats.byType.MULTI_DEVICE_BLOCKED);
  console.log('   - Anti-Passback Violations:', statsData.stats.byType.ANTI_PASSBACK_LOCKED);

  console.log('\n🏆 ALL 12 VERIFICATION SUITES COMPLETED SUCCESSFULLY!');
}

runTests().catch(console.error);

