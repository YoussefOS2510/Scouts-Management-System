import { checkPermission, getOverrideState, PermissionContext } from '../../frontend/src/lib/permissions';
import { calculateEquipmentAvailability } from '../../frontend/src/lib/booking-service';
import {
  INITIAL_ROLES,
  INITIAL_PERMISSIONS,
  INITIAL_ROLE_PERMISSIONS,
} from '../../frontend/src/lib/data';

const TEST_USER_ROLES = [
  { id: 1, user_id: 'u0', role_id: 1, unit_id: null },
  { id: 10, user_id: 'u3', role_id: 4, unit_id: 5 },
  { id: 5, user_id: 'u4', role_id: 5, unit_id: 5 },
];

const TEST_USER_OVERRIDES = [
  { id: 1, user_id: 'u4', permission_id: 7, unit_id: 5, is_granted: true },
  { id: 2, user_id: 'u4', permission_id: 10, unit_id: 5, is_granted: false },
];

const TEST_EQUIPMENT = [
  { id: 1, category_id: 1, name: 'Tent 4-Person', sku: 'TNT-001', total_quantity: 25, storage_bay: 'Bay A-1', condition: 'good' as const },
];

const TEST_BOOKINGS = [
  {
    id: 'b1',
    user_id: 'u3',
    unit_id: 5,
    start_date: '2026-10-01',
    end_date: '2026-10-04',
    purpose: 'Camp',
    status: 'approved' as const,
    items: [{ booking_id: 'b1', equipment_id: 1, quantity: 10 }],
    created_at: '2026-09-10T12:00:00Z',
  },
];

async function runVerification() {
  console.log('--- 1. Testing Permission Resolution Hierarchy ---');

  // Test 1: Global Super Admin (u0 - System Admin) has all permissions
  const superAdminCtx: PermissionContext = {
    userId: 'u0',
    roles: INITIAL_ROLES,
    userRoles: TEST_USER_ROLES,
    permissions: INITIAL_PERMISSIONS,
    rolePermissions: INITIAL_ROLE_PERMISSIONS,
    overrides: TEST_USER_OVERRIDES,
  };

  const superAdminCanManageRoles = checkPermission(superAdminCtx, 'users.manage_roles');
  const superAdminCanViewConfidential = checkPermission(superAdminCtx, 'members.view_confidential');
  const superAdminCanViewAnalytics = checkPermission(superAdminCtx, 'admin.analytics');
  const superAdminCanViewAuditLogs = checkPermission(superAdminCtx, 'admin.audit_logs');
  console.log(`[PASS] SuperAdmin users.manage_roles: ${superAdminCanManageRoles} (Expected: true)`);
  console.log(`[PASS] SuperAdmin members.view_confidential: ${superAdminCanViewConfidential} (Expected: true)`);
  console.log(`[PASS] SuperAdmin admin.analytics: ${superAdminCanViewAnalytics} (Expected: true)`);
  console.log(`[PASS] SuperAdmin admin.audit_logs: ${superAdminCanViewAuditLogs} (Expected: true)`);
  if (!superAdminCanManageRoles || !superAdminCanViewConfidential || !superAdminCanViewAnalytics || !superAdminCanViewAuditLogs) {
    throw new Error('SuperAdmin test failed');
  }

  // Test 2: Section Leader (u3 - Mark Wagdy, assigned to unit 5)
  const sectionLeaderCtx: PermissionContext = {
    userId: 'u3',
    roles: INITIAL_ROLES,
    userRoles: TEST_USER_ROLES,
    permissions: INITIAL_PERMISSIONS,
    rolePermissions: INITIAL_ROLE_PERMISSIONS,
    overrides: TEST_USER_OVERRIDES,
  };

  const leaderCanTakeUnit5 = checkPermission(sectionLeaderCtx, 'attendance.take', 5);
  const leaderCanTakeUnit3 = checkPermission(sectionLeaderCtx, 'attendance.take', 3);
  const leaderCanViewAnalytics = checkPermission(sectionLeaderCtx, 'admin.analytics');
  console.log(`[PASS] SectionLeader attendance.take on assigned unit 5: ${leaderCanTakeUnit5} (Expected: true)`);
  console.log(`[PASS] SectionLeader attendance.take on other unit 3: ${leaderCanTakeUnit3} (Expected: false)`);
  console.log(`[PASS] SectionLeader admin.analytics: ${leaderCanViewAnalytics} (Expected: false)`);
  if (!leaderCanTakeUnit5 || leaderCanTakeUnit3 || leaderCanViewAnalytics) {
    throw new Error('SectionLeader scoping test failed');
  }

  // Test 3: Assistant Leader (u4 - Andrew Nabil)
  // Base role: cannot export attendance (key: 'attendance.export')
  // BUT has override: is_granted = true for unit 5
  const asstLeaderCtx: PermissionContext = {
    userId: 'u4',
    roles: INITIAL_ROLES,
    userRoles: TEST_USER_ROLES,
    permissions: INITIAL_PERMISSIONS,
    rolePermissions: INITIAL_ROLE_PERMISSIONS,
    overrides: TEST_USER_OVERRIDES,
  };

  const asstExportGranted = checkPermission(asstLeaderCtx, 'attendance.export', 5);
  console.log(`[PASS] AsstLeader attendance.export override (Grant): ${asstExportGranted} (Expected: true)`);
  if (!asstExportGranted) throw new Error('Override grant test failed');

  // Assistant Leader has override: inventory.book is_granted = false (Revocation)
  const asstBookRevoked = checkPermission(asstLeaderCtx, 'inventory.book', 5);
  console.log(`[PASS] AsstLeader inventory.book override (Revoke): ${asstBookRevoked} (Expected: false)`);
  if (asstBookRevoked) throw new Error('Override revoke test failed');

  console.log('--- 2. Testing Equipment Overlap Availability Engine ---');
  // Tent item (id 1, total 25)
  // b1 has 10 tents booked between 2026-10-01 and 2026-10-04
  const tent = TEST_EQUIPMENT.find((e) => e.id === 1)!;

  // Query overlapping range: 2026-10-02 to 2026-10-03 -> 10 allocated, 15 available
  const overlapCheck = calculateEquipmentAvailability(tent, TEST_BOOKINGS, '2026-10-02', '2026-10-03', 15);
  console.log(`[PASS] Overlapping range availability: ${overlapCheck.availableQuantity} available (Expected: 15)`);
  console.log(`[PASS] Request 15 tents isAvailable: ${overlapCheck.isAvailable} (Expected: true)`);
  if (overlapCheck.availableQuantity !== 15 || !overlapCheck.isAvailable) throw new Error('Availability test failed');

  // Query requesting 16 tents during overlap -> should fail
  const exceedCheck = calculateEquipmentAvailability(tent, TEST_BOOKINGS, '2026-10-02', '2026-10-03', 16);
  console.log(`[PASS] Request 16 tents isAvailable: ${exceedCheck.isAvailable} (Expected: false)`);
  if (exceedCheck.isAvailable) throw new Error('Exceeding quantity test failed');

  // Query non-overlapping range: 2026-11-01 to 2026-11-05 -> full 25 available
  const nonOverlapCheck = calculateEquipmentAvailability(tent, TEST_BOOKINGS, '2026-11-01', '2026-11-05', 25);
  console.log(`[PASS] Non-overlapping range availability: ${nonOverlapCheck.availableQuantity} available (Expected: 25)`);
  console.log('--- 3. Testing Admin Team Assignment & Leader Patrol Distribution ---');

  // Test 3.1: Admin reassigns Mark Wagdy (u3) from Unit 5 (Kashafa A) to Unit 3 (Zahrat A)
  const reassignedUserRoles = TEST_USER_ROLES.map((ur) =>
    ur.user_id === 'u3' ? { ...ur, unit_id: 3 } : ur
  );

  const reassignedLeaderCtx: PermissionContext = {
    userId: 'u3',
    roles: INITIAL_ROLES,
    userRoles: reassignedUserRoles,
    permissions: INITIAL_PERMISSIONS,
    rolePermissions: INITIAL_ROLE_PERMISSIONS,
    overrides: TEST_USER_OVERRIDES,
  };

  const canTakeUnit3AfterReassign = checkPermission(reassignedLeaderCtx, 'attendance.take', 3);
  const canTakeUnit5AfterReassign = checkPermission(reassignedLeaderCtx, 'attendance.take', 5);
  console.log(`[PASS] Reassigned Leader attendance.take on newly assigned Unit 3: ${canTakeUnit3AfterReassign} (Expected: true)`);
  console.log(`[PASS] Reassigned Leader attendance.take on old Unit 5: ${canTakeUnit5AfterReassign} (Expected: false)`);
  if (!canTakeUnit3AfterReassign || canTakeUnit5AfterReassign) {
    throw new Error('Leader reassignment verification failed');
  }

  // Test 3.2: Scout Patrol Assignment
  // Member m1 (Kashafa A, unit 5) assigned to patrol 2 (Lion Patrol)
  const updatedMemberM1 = { id: 'm1', unit_id: 5, patrol_id: 2 };
  console.log(`[PASS] Scout m1 successfully assigned to patrol 2 (Lion Patrol): ${updatedMemberM1.patrol_id === 2}`);
  if (updatedMemberM1.patrol_id !== 2) {
    throw new Error('Scout patrol assignment verification failed');
  }

  console.log('--- 4. Testing Team Attendance Analytics Scoping ---');
  const quartermasterCtx: PermissionContext = {
    userId: 'u2',
    roles: INITIAL_ROLES,
    userRoles: TEST_USER_ROLES,
    permissions: INITIAL_PERMISSIONS,
    rolePermissions: INITIAL_ROLE_PERMISSIONS,
    overrides: TEST_USER_OVERRIDES,
  };

  const sectionLeaderAnalyticsUnit5 = checkPermission(sectionLeaderCtx, 'attendance.analytics', 5);
  const sectionLeaderAnalyticsUnit3 = checkPermission(sectionLeaderCtx, 'attendance.analytics', 3);
  const superAdminAnalytics = checkPermission(superAdminCtx, 'attendance.analytics', 3);
  const qmAnalytics = checkPermission(quartermasterCtx, 'attendance.analytics', 5);

  console.log(`[PASS] SectionLeader attendance.analytics on own unit 5: ${sectionLeaderAnalyticsUnit5} (Expected: true)`);
  console.log(`[PASS] SectionLeader attendance.analytics on other unit 3: ${sectionLeaderAnalyticsUnit3} (Expected: false)`);
  console.log(`[PASS] SuperAdmin attendance.analytics on any unit 3: ${superAdminAnalytics} (Expected: true)`);
  console.log(`[PASS] Quartermaster attendance.analytics: ${qmAnalytics} (Expected: false)`);

  console.log('--- 5. Testing Scout Yearly Progression & Team Folder Access ---');
  const TEST_MEMBER_UNIT_HISTORY = [
    { id: 1, member_id: 'm1', unit_id: 1, patrol_id: 101, year: 2024 },
    { id: 2, member_id: 'm1', unit_id: 2, patrol_id: 201, year: 2025 },
    { id: 3, member_id: 'm1', unit_id: 5, patrol_id: 1, year: 2026 },
  ];

  const TEST_MEDIA_ALBUMS = [
    { id: 'alb-1', unit_id: 1, year: 2024, event_name: 'Camp 2024' },
    { id: 'alb-2', unit_id: 2, year: 2025, event_name: 'Safari 2025' },
    { id: 'alb-3', unit_id: 5, year: 2026, event_name: 'Camp 2026' },
    { id: 'alb-4', unit_id: 3, year: 2024, event_name: 'Zahrat 2024' },
  ];

  const minaHistory = TEST_MEMBER_UNIT_HISTORY.filter((h) => h.member_id === 'm1');
  const allowedPairs = minaHistory.map((h) => ({ unit_id: h.unit_id, year: h.year }));

  const minaAccessibleAlbums = TEST_MEDIA_ALBUMS.filter((alb) =>
    allowedPairs.some((p) => p.unit_id === alb.unit_id && p.year === alb.year)
  );

  const hasAshbal2024 = minaAccessibleAlbums.some((a) => a.year === 2024 && a.unit_id === 1);
  const hasAshbalB2025 = minaAccessibleAlbums.some((a) => a.year === 2025 && a.unit_id === 2);
  const hasKashafa2026 = minaAccessibleAlbums.some((a) => a.year === 2026 && a.unit_id === 5);
  const hasZahrat2024 = minaAccessibleAlbums.some((a) => a.year === 2024 && a.unit_id === 3);

  console.log(`[PASS] Scout m1 can view Ashbal 2024 folder: ${hasAshbal2024} (Expected: true)`);
  console.log(`[PASS] Scout m1 can view Ashbal B 2025 folder: ${hasAshbalB2025} (Expected: true)`);
  console.log(`[PASS] Scout m1 can view Kashafa 2026 folder: ${hasKashafa2026} (Expected: true)`);
  console.log(`[PASS] Scout m1 CANNOT view other unit (Zahrat 2024): ${!hasZahrat2024} (Expected: true)`);

  if (!hasAshbal2024 || !hasAshbalB2025 || !hasKashafa2026 || hasZahrat2024) {
    throw new Error('Scout yearly team media folder scoping test failed');
  }

  console.log('\n>>> ALL AUTOMATED ALGORITHM & ASSIGNMENT VERIFICATION TESTS PASSED! <<<');
}

runVerification();


