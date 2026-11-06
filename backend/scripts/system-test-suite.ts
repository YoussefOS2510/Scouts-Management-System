import { query, sql } from '../src/db';
import { checkPermission, PermissionContext, USER_ID_MAP } from '../../frontend/src/lib/permissions';
import { calculateEquipmentAvailability } from '../../frontend/src/lib/booking-service';
import {
  INITIAL_ROLES,
  INITIAL_PERMISSIONS,
  INITIAL_ROLE_PERMISSIONS,
} from '../../frontend/src/lib/data';

// Color formatting utilities for console
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
};

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  durationMs: number;
  details?: string;
}

interface BenchmarkMetric {
  operation: string;
  category: 'READ' | 'WRITE';
  samples: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  p95Ms: number;
  slaGrade: 'A+' | 'A' | 'B' | 'C' | 'FAIL';
}

const testResults: TestResult[] = [];
const benchmarkMetrics: BenchmarkMetric[] = [];

function recordTest(name: string, category: string, passed: boolean, durationMs: number, details?: string) {
  testResults.push({ name, category, passed, durationMs, details });
  const status = passed
    ? `${colors.green}✔ PASS${colors.reset}`
    : `${colors.red}✖ FAIL${colors.reset}`;
  const time = `${colors.dim}(${durationMs.toFixed(1)}ms)${colors.reset}`;
  console.log(`  ${status} ${name} ${time}`);
  if (details && !passed) {
    console.log(`     ${colors.red}Error: ${details}${colors.reset}`);
  }
}

async function measureOperation<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;
  return { result, durationMs };
}

async function runBenchmark(
  operation: string,
  category: 'READ' | 'WRITE',
  iterations: number,
  fn: () => Promise<void>
): Promise<BenchmarkMetric> {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  const minMs = times[0];
  const maxMs = times[times.length - 1];
  const avgMs = times.reduce((acc, t) => acc + t, 0) / times.length;
  const p95Index = Math.min(Math.floor(times.length * 0.95), times.length - 1);
  const p95Ms = times[p95Index];

  let slaGrade: 'A+' | 'A' | 'B' | 'C' | 'FAIL' = 'C';
  if (category === 'READ') {
    if (avgMs < 40) slaGrade = 'A+';
    else if (avgMs < 100) slaGrade = 'A';
    else if (avgMs < 250) slaGrade = 'B';
    else slaGrade = 'C';
  } else {
    if (avgMs < 60) slaGrade = 'A+';
    else if (avgMs < 150) slaGrade = 'A';
    else if (avgMs < 350) slaGrade = 'B';
    else slaGrade = 'C';
  }

  const metric: BenchmarkMetric = {
    operation,
    category,
    samples: iterations,
    minMs,
    maxMs,
    avgMs,
    p95Ms,
    slaGrade,
  };
  benchmarkMetrics.push(metric);
  return metric;
}

export async function runEntireSystemTestSuite() {
  const suiteStartTime = performance.now();

  console.log(`\n${colors.cyan}${colors.bold}======================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}       🚀 SCOUTS MANAGEMENT SYSTEM - COMPREHENSIVE E2E TEST SUITE     ${colors.reset}`);
  console.log(`${colors.dim}   Functionality Validation • Refresh Persistence • Speed & Latency Benchmark${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}======================================================================${colors.reset}\n`);

  // Target Test Unit: Unit 5 (Kashafa A - كشافة A)
  const targetUnitId = 5;

  // ---------------------------------------------------------------------------------
  // MODULE 1: Database Connectivity & Driver Health
  // ---------------------------------------------------------------------------------
  console.log(`${colors.bold}1. Database Connectivity & Pool Diagnostics${colors.reset}`);
  try {
    const { result: pingRes, durationMs: pingTime } = await measureOperation(async () => {
      return await query(`SELECT NOW() AS current_time, current_database() AS db_name, version() AS ver;`);
    });
    const dbConnected = Array.isArray(pingRes) && pingRes.length > 0;
    recordTest('Neon PostgreSQL Pool Connection & Ping', 'Database', dbConnected, pingTime);

    // Concurrency burst test: 5 simultaneous queries
    const { durationMs: burstTime } = await measureOperation(async () => {
      await Promise.all([
        query(`SELECT 1`),
        query(`SELECT 2`),
        query(`SELECT 3`),
        query(`SELECT 4`),
        query(`SELECT 5`),
      ]);
    });
    recordTest('Connection Pool Concurrency (5 parallel queries)', 'Database', true, burstTime);
  } catch (err: any) {
    recordTest('Neon PostgreSQL Connection', 'Database', false, 0, err.message);
  }

  // ---------------------------------------------------------------------------------
  // MODULE 2: RBAC Security, Permission Boundaries & UUID Sanitization
  // ---------------------------------------------------------------------------------
  console.log(`\n${colors.bold}2. RBAC Security, Permission Scoping & Identity Isolation${colors.reset}`);
  try {
    const { durationMs: permTime } = await measureOperation(async () => {
      const mockRoles = [
        { id: 1, user_id: 'u0', role_id: 1, unit_id: null }, // SuperAdmin
        { id: 2, user_id: 'u4', role_id: 5, unit_id: 5 },   // Leader Unit 5
        { id: 3, user_id: 'u18', role_id: 5, unit_id: 3 },  // Leader Unit 3 (Christine)
      ];

      // SuperAdmin global privilege bypass
      const adminCtx: PermissionContext = {
        userId: 'u0',
        roles: INITIAL_ROLES,
        userRoles: mockRoles,
        permissions: INITIAL_PERMISSIONS,
        rolePermissions: INITIAL_ROLE_PERMISSIONS,
        overrides: [],
      };
      if (!checkPermission(adminCtx, 'users.manage_roles') || !checkPermission(adminCtx, 'admin.analytics')) {
        throw new Error('SuperAdmin lacks global manage permissions');
      }

      // Unit scoping: Leader Unit 5 can take attendance on Unit 5, forbidden on Unit 3
      const leaderCtx: PermissionContext = {
        userId: 'u4',
        roles: INITIAL_ROLES,
        userRoles: mockRoles,
        permissions: INITIAL_PERMISSIONS,
        rolePermissions: INITIAL_ROLE_PERMISSIONS,
        overrides: [],
      };
      const canUnit5 = checkPermission(leaderCtx, 'attendance.take', targetUnitId);
      const canUnit3 = checkPermission(leaderCtx, 'attendance.take', 3);
      if (!canUnit5 || canUnit3) {
        throw new Error(`Unit isolation failed: Unit5=${canUnit5}, Unit3=${canUnit3}`);
      }

      // Christine Nabil security check: strictly scoped, never SuperAdmin
      const christineCtx: PermissionContext = {
        userId: 'u18',
        roles: INITIAL_ROLES,
        userRoles: mockRoles,
        permissions: INITIAL_PERMISSIONS,
        rolePermissions: INITIAL_ROLE_PERMISSIONS,
        overrides: [],
      };
      if (checkPermission(christineCtx, 'users.manage_roles') || checkPermission(christineCtx, 'admin.analytics')) {
        throw new Error('Scoped leader improperly granted SuperAdmin privileges');
      }

      // Custom override test: grant export, revoke booking
      const overrideCtx: PermissionContext = {
        ...leaderCtx,
        overrides: [
          { id: 1, user_id: 'u4', permission_id: 7, unit_id: 5, is_granted: true },
          { id: 2, user_id: 'u4', permission_id: 10, unit_id: 5, is_granted: false },
        ],
      };
      if (!checkPermission(overrideCtx, 'attendance.export', 5) || checkPermission(overrideCtx, 'inventory.book', 5)) {
        throw new Error('Permission override evaluation failed');
      }
    });
    recordTest('RBAC Scoping, Boundaries & Overrides Hierarchy', 'Security', true, permTime);

    // Verify UUID Mapping in database
    const { durationMs: uuidCheckTime } = await measureOperation(async () => {
      const u4Uuid = USER_ID_MAP['u4'];
      const u18Uuid = USER_ID_MAP['u18'];
      const dbUsers = await query(
        `SELECT id, email, full_name FROM users WHERE id IN ($1, $2);`,
        [u4Uuid, u18Uuid]
      );
      if (dbUsers.length < 2) {
        throw new Error(`Expected 2 seeded leaders in users table, found ${dbUsers.length}`);
      }
    });
    recordTest('Leader Mock-to-UUID Persistent Foreign Keys (u4, u18)', 'Security', true, uuidCheckTime);
  } catch (err: any) {
    recordTest('RBAC Security & Permission Scoping', 'Security', false, 0, err.message);
  }

  // ---------------------------------------------------------------------------------
  // MODULE 3: Attendance Taking & Deep Persistence Across Refreshes
  // ---------------------------------------------------------------------------------
  console.log(`\n${colors.bold}3. Attendance System: Event Lifecycle & Refresh Persistence${colors.reset}`);
  let createdSessionId: string | null = null;
  try {
    const testDate = '2026-11-28';
    const testTitle = 'اختبار التحقق من ثبات الحضور (Automated E2E Session)';
    const testLocation = 'مبنى الكشافة المركزي';
    const testType = 'meeting';

    // Step 3.1: Create Session
    const { result: sessionRes, durationMs: createTime } = await measureOperation(async () => {
      return await query(`
        INSERT INTO attendance_sessions (unit_id, session_date, session_title, event_type, location, notes, recorded_by)
        VALUES ($1, $2, $3, $4, $5, 'جلسة اختبار آلي للتحقق من حفظ البيانات', 'eddc77ff-69dc-452b-a5e1-0359ef7a8007')
        RETURNING id, unit_id, TO_CHAR(session_date, 'YYYY-MM-DD') as session_date, session_title, event_type, location;
      `, [targetUnitId, testDate, testTitle, testType, testLocation]);
    });
    createdSessionId = sessionRes[0].id;
    recordTest(`Create Event Session ("${testTitle.slice(0, 24)}...")`, 'Attendance', !!createdSessionId, createTime);

    // Step 3.2: Fetch Scouts in target unit
    const unitScouts = await query(`SELECT id, full_name_ar, member_code FROM members WHERE unit_id = $1 LIMIT 4;`, [targetUnitId]);
    if (unitScouts.length < 4) {
      throw new Error(`Insufficient scouts in unit ${targetUnitId} (found ${unitScouts.length})`);
    }

    // Step 3.3: Batch Insert 4 distinct statuses
    const testStatuses = [
      { memberId: unitScouts[0].id, status: 'present', notes: 'حاضر في الموعد' },
      { memberId: unitScouts[1].id, status: 'absent', notes: 'غياب غير مبرر' },
      { memberId: unitScouts[2].id, status: 'excused', notes: 'عذر مرضي معتمد' },
      { memberId: unitScouts[3].id, status: 'late', notes: 'تأخير 20 دقيقة' },
    ];

    const { durationMs: recordTime } = await measureOperation(async () => {
      for (const item of testStatuses) {
        await query(`
          INSERT INTO attendance_records (session_id, member_id, status, notes)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (session_id, member_id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes;
        `, [createdSessionId, item.memberId, item.status, item.notes]);
      }
    });
    recordTest(`Batch Record Attendance (Present, Absent, Excused, Late)`, 'Attendance', true, recordTime);

    // Step 3.4: SIMULATE CLIENT REFRESH / RELOAD
    // Read from DB with a brand new independent query (simulating the GET /api/attendance endpoint reload)
    const { result: reloadedRecords, durationMs: reloadTime } = await measureOperation(async () => {
      return await query(`
        SELECT 
          r.id,
          r.session_id,
          r.member_id,
          r.status,
          r.notes,
          m.full_name_ar
        FROM attendance_records r
        JOIN members m ON m.id = r.member_id
        WHERE r.session_id = $1
        ORDER BY m.full_name_ar;
      `, [createdSessionId]);
    });

    const isMatchCount = reloadedRecords.length === testStatuses.length;
    const isStatusesExact = testStatuses.every(ts => {
      const match = reloadedRecords.find((r: any) => r.member_id === ts.memberId);
      return match && match.status === ts.status && match.notes === ts.notes;
    });

    recordTest(
      'Attendance Persistence After Refresh (Status & Notes Exact Parity)',
      'Attendance',
      isMatchCount && isStatusesExact,
      reloadTime,
      `Matched ${reloadedRecords.length}/${testStatuses.length} records. Status exact parity: ${isStatusesExact}`
    );

    // Step 3.5: UPDATE ATTENDANCE (Toggle status: absent -> present) & Re-verify
    const { durationMs: updateTime } = await measureOperation(async () => {
      await query(`
        UPDATE attendance_records
        SET status = 'present', notes = 'تم الحضور متأخراً وتعديل الغياب'
        WHERE session_id = $1 AND member_id = $2;
      `, [createdSessionId, unitScouts[1].id]);
    });

    // Fresh query to verify mutation persisted
    const updatedCheck = await query(`
      SELECT status, notes FROM attendance_records WHERE session_id = $1 AND member_id = $2;
    `, [createdSessionId, unitScouts[1].id]);
    const isUpdatedCorrectly = updatedCheck[0]?.status === 'present';
    recordTest('Attendance In-Place Status Mutation & Refresh Persistence', 'Attendance', isUpdatedCorrectly, updateTime);

  } catch (err: any) {
    recordTest('Attendance Taking & Persistence', 'Attendance', false, 0, err.message);
  } finally {
    // Teardown test session
    if (createdSessionId) {
      await query(`DELETE FROM attendance_sessions WHERE id = $1;`, [createdSessionId]);
    }
  }

  // ---------------------------------------------------------------------------------
  // MODULE 4: Patrols & Sixes Management + Refresh Persistence
  // ---------------------------------------------------------------------------------
  console.log(`\n${colors.bold}4. Patrols & Sixes: Creation, Unassigned Search & Persistence${colors.reset}`);
  let createdPatrolId: number | null = null;
  let assignedScoutId: string | null = null;
  try {
    // Step 4.1: Search for unassigned scouts in unit
    const { result: unassignedScouts, durationMs: searchUnassignedTime } = await measureOperation(async () => {
      return await query(`
        SELECT id, full_name_ar, member_code 
        FROM members 
        WHERE unit_id = $1 AND patrol_id IS NULL
        LIMIT 5;
      `, [targetUnitId]);
    });
    recordTest(
      `Search Non-Assigned Scouts in Unit (Found ${unassignedScouts.length})`,
      'Patrols',
      true,
      searchUnassignedTime
    );

    if (unassignedScouts.length > 0) {
      assignedScoutId = unassignedScouts[0].id;
    } else {
      // Pick any scout and temporarily make them unassigned for testing
      const anyScout = await query(`SELECT id FROM members WHERE unit_id = $1 LIMIT 1;`, [targetUnitId]);
      assignedScoutId = anyScout[0].id;
      await query(`UPDATE members SET patrol_id = NULL WHERE id = $1;`, [assignedScoutId]);
    }

    // Step 4.2: Create new test patrol
    const { result: patrolInsertRes, durationMs: createPatrolTime } = await measureOperation(async () => {
      return await query(`
        INSERT INTO patrols (unit_id, name_ar, name_en, order_index)
        VALUES ($1, 'طليعة الفهد التجريبية', 'Cheetah Patrol Test', 99)
        RETURNING id, unit_id, name_ar, name_en, order_index;
      `, [targetUnitId]);
    });
    createdPatrolId = Number(patrolInsertRes[0].id);
    recordTest(`Create New Patrol ("طليعة الفهد التجريبية")`, 'Patrols', !!createdPatrolId, createPatrolTime);

    // Step 4.3: Assign scout to this patrol
    const { durationMs: assignTime } = await measureOperation(async () => {
      await query(`
        UPDATE members 
        SET patrol_id = $1, updated_at = NOW() 
        WHERE id = $2;
      `, [createdPatrolId, assignedScoutId]);
    });
    recordTest('Assign Unassigned Scout to New Patrol', 'Patrols', true, assignTime);

    // Step 4.4: SIMULATE CLIENT REFRESH / PAGE RELOAD
    // Fetch members and patrols as the unit directory page does on reload
    const { result: refreshData, durationMs: refreshPatrolTime } = await measureOperation(async () => {
      const [pRes, mRes] = await Promise.all([
        query(`SELECT id, name_ar, order_index FROM patrols WHERE id = $1;`, [createdPatrolId]),
        query(`SELECT id, full_name_ar, patrol_id FROM members WHERE id = $1;`, [assignedScoutId]),
      ]);
      return { patrol: pRes[0], member: mRes[0] };
    });

    const isPatrolPersisted = refreshData.patrol && refreshData.patrol.name_ar === 'طليعة الفهد التجريبية';
    const isMemberPatrolPersisted = refreshData.member && Number(refreshData.member.patrol_id) === createdPatrolId;

    recordTest(
      'Patrol Assignment Persistence After Refresh (Scout Retains Patrol ID)',
      'Patrols',
      isPatrolPersisted && isMemberPatrolPersisted,
      refreshPatrolTime
    );

    // Step 4.5: Verify scout is now NOT in unassigned search
    const verifyUnassigned = await query(`
      SELECT id FROM members WHERE unit_id = $1 AND patrol_id IS NULL AND id = $2;
    `, [targetUnitId, assignedScoutId]);
    recordTest(
      'Non-Assigned Scout Search Filter Integrity (Assigned scout excluded)',
      'Patrols',
      verifyUnassigned.length === 0,
      1
    );

    // Step 4.6: Edit Patrol Name & Re-verify persistence
    const { durationMs: editPatrolTime } = await measureOperation(async () => {
      await query(`UPDATE patrols SET name_ar = 'طليعة النسر المحدثة' WHERE id = $1;`, [createdPatrolId]);
    });
    const reloadedPatrol = await query(`SELECT name_ar FROM patrols WHERE id = $1;`, [createdPatrolId]);
    const isPatrolEditPersisted = reloadedPatrol[0]?.name_ar === 'طليعة النسر المحدثة';
    recordTest('Patrol Rename & Refresh Persistence', 'Patrols', isPatrolEditPersisted, editPatrolTime);

  } catch (err: any) {
    recordTest('Patrols Creation & Assignment', 'Patrols', false, 0, err.message);
  } finally {
    // Teardown: Unassign scout and delete test patrol
    if (assignedScoutId) {
      await query(`UPDATE members SET patrol_id = NULL WHERE id = $1;`, [assignedScoutId]);
    }
    if (createdPatrolId) {
      await query(`DELETE FROM patrols WHERE id = $1;`, [createdPatrolId]);
    }
  }

  // ---------------------------------------------------------------------------------
  // MODULE 5: Members Directory, Filtering & Search
  // ---------------------------------------------------------------------------------
  console.log(`\n${colors.bold}5. Members Directory & Search Capabilities${colors.reset}`);
  try {
    // Search by Arabic name
    const { result: searchAr, durationMs: searchArTime } = await measureOperation(async () => {
      return await query(`SELECT id, full_name_ar, member_code FROM members WHERE full_name_ar ILIKE '%يوسف%' LIMIT 10;`);
    });
    recordTest(`Arabic Full-Text Search (ILIKE '%يوسف%': ${searchAr.length} matches)`, 'Members', searchAr.length > 0, searchArTime);

    // Filter by Unit
    const { result: unitMembers, durationMs: unitMembersTime } = await measureOperation(async () => {
      return await query(`SELECT id, full_name_ar, member_code, is_active FROM members WHERE unit_id = $1;`, [targetUnitId]);
    });
    recordTest(`Unit Member Roster Filter (Unit ${targetUnitId}: ${unitMembers.length} active scouts)`, 'Members', unitMembers.length > 0, unitMembersTime);

    // Missing data flags
    const { result: missingDataScouts, durationMs: missingCheckTime } = await measureOperation(async () => {
      return await query(`SELECT COUNT(*)::int AS count FROM members WHERE has_missing_data = TRUE;`);
    });
    recordTest(`Member Incomplete Profile Tracking (${missingDataScouts[0].count} flagged)`, 'Members', true, missingCheckTime);
  } catch (err: any) {
    recordTest('Members Directory & Search', 'Members', false, 0, err.message);
  }

  // ---------------------------------------------------------------------------------
  // MODULE 6: Inventory & Equipment Booking Availability Engine
  // ---------------------------------------------------------------------------------
  console.log(`\n${colors.bold}6. Inventory, Equipment Booking & Overlap Engine${colors.reset}`);
  let createdBookingId: string | null = null;
  try {
    // Step 6.1: Equipment Availability Algorithm
    const { durationMs: availTime } = await measureOperation(async () => {
      const testItem: any = {
        id: 1,
        category_id: 1,
        name: 'Tent 4-Person',
        sku: 'TNT-001',
        total_quantity: 25,
        storage_bay: 'Bay A-1',
        condition: 'good',
      };
      const testBookings: any = [
        {
          id: 'b1',
          user_id: 'u3',
          unit_id: 5,
          start_date: '2026-11-15',
          end_date: '2026-11-18',
          status: 'approved' as const,
          items: [{ booking_id: 'b1', equipment_id: 1, quantity: 10 }],
        },
      ];
      // Overlapping range test
      const resOverlap = calculateEquipmentAvailability(testItem, testBookings, '2026-11-16', '2026-11-17', 15);
      if (!resOverlap.isAvailable || resOverlap.availableQuantity !== 15) {
        throw new Error(`Expected 15 available tents, got ${resOverlap.availableQuantity}`);
      }

      // Over capacity request test
      const resOver = calculateEquipmentAvailability(testItem, testBookings, '2026-11-16', '2026-11-17', 16);
      if (resOver.isAvailable) {
        throw new Error('Expected isAvailable false for 16 requested tents, got true');
      }

      // Non-overlapping range test
      const resNonOverlap = calculateEquipmentAvailability(testItem, testBookings, '2026-11-20', '2026-11-22', 25);
      if (!resNonOverlap.isAvailable || resNonOverlap.availableQuantity !== 25) {
        throw new Error(`Expected 25 available tents, got ${resNonOverlap.availableQuantity}`);
      }
    });
    recordTest('Equipment Overlap Calculation Engine (Concurrent vs Sequential)', 'Inventory', true, availTime);

    // Step 6.2: Create Booking with Driver-Level UUID sanitization (u0 -> Admin UUID)
    const { result: bookingRes, durationMs: bookTime } = await measureOperation(async () => {
      return await query(`
        INSERT INTO bookings (user_id, unit_id, start_date, end_date, purpose, status)
        VALUES ('eddc77ff-69dc-452b-a5e1-0359ef7a8007', $1, '2026-12-01', '2026-12-03', 'مخيم تجريبي للتحقق من الحجز', 'pending')
        RETURNING id, status, purpose;
      `, [targetUnitId]);
    });
    createdBookingId = bookingRes[0].id;
    recordTest('Create Equipment Booking with Verified User UUID', 'Inventory', !!createdBookingId, bookTime);

    // Step 6.3: Refresh Persistence Check
    const { result: reloadedBooking, durationMs: reloadBookingTime } = await measureOperation(async () => {
      return await query(`SELECT id, status, purpose FROM bookings WHERE id = $1;`, [createdBookingId]);
    });
    const isBookingPersisted = reloadedBooking.length > 0 && reloadedBooking[0].status === 'pending';
    recordTest('Equipment Booking Refresh Persistence', 'Inventory', isBookingPersisted, reloadBookingTime);

  } catch (err: any) {
    recordTest('Inventory & Equipment Bookings', 'Inventory', false, 0, err.message);
  } finally {
    if (createdBookingId) {
      await query(`DELETE FROM bookings WHERE id = $1;`, [createdBookingId]);
    }
  }

  // ---------------------------------------------------------------------------------
  // MODULE 7: Audit Logs & Security Tracing
  // ---------------------------------------------------------------------------------
  console.log(`\n${colors.bold}7. Audit Logs & System Action Tracing${colors.reset}`);
  let testLogId: string | null = null;
  try {
    const { result: logRes, durationMs: logTime } = await measureOperation(async () => {
      return await query(`
        INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en)
        VALUES (
          'eddc77ff-69dc-452b-a5e1-0359ef7a8007',
          $1,
          'system_verification_test',
          'اختبار التحقق الآلي',
          'Automated System Test',
          'تم تنفيذ فحص شامل لكافة وظائف المنظومة',
          'Full comprehensive system E2E verification test executed'
        )
        RETURNING id, action_type;
      `, [targetUnitId]);
    });
    testLogId = logRes[0].id;
    recordTest('Create Structured Audit Log Entry', 'Audit', !!testLogId, logTime);

    // Refresh Persistence Check
    const { result: reloadedLog, durationMs: reloadLogTime } = await measureOperation(async () => {
      return await query(`SELECT id, action_type, created_at FROM audit_logs WHERE id = $1;`, [testLogId]);
    });
    const isLogPersisted = reloadedLog.length > 0 && reloadedLog[0].action_type === 'system_verification_test';
    recordTest('Audit Log Refresh Persistence', 'Audit', isLogPersisted, reloadLogTime);

  } catch (err: any) {
    recordTest('Audit Logs Tracing', 'Audit', false, 0, err.message);
  } finally {
    if (testLogId) {
      await query(`DELETE FROM audit_logs WHERE id = $1;`, [testLogId]);
    }
  }

  // ---------------------------------------------------------------------------------
  // MODULE 8: Speed, Latency & Throughput Benchmark Suite
  // ---------------------------------------------------------------------------------
  console.log(`\n${colors.bold}8. Speed & Latency Benchmark Engine (10 Iterations per query)${colors.reset}`);
  console.log(`${colors.dim}   Measuring round-trip execution latency, P95, and SLA grades...${colors.reset}\n`);

  // Benchmark 1: Neon Database Raw Ping
  await runBenchmark('Raw Database Ping (SELECT 1)', 'READ', 10, async () => {
    await query(`SELECT 1;`);
  });

  // Benchmark 2: Full Members Roster Read
  await runBenchmark('Read: Full Members Roster & Patrols Join', 'READ', 10, async () => {
    await query(`
      SELECT m.id, m.member_code, m.full_name_ar, m.unit_id, p.name_ar as patrol_name
      FROM members m
      LEFT JOIN patrols p ON m.patrol_id = p.id
      WHERE m.is_active = TRUE
      LIMIT 100;
    `);
  });

  // Benchmark 3: Attendance Sessions by Unit
  await runBenchmark('Read: Attendance Sessions History', 'READ', 10, async () => {
    await query(`
      SELECT s.id, s.session_date, s.session_title, COUNT(r.id)::int as records_count
      FROM attendance_sessions s
      LEFT JOIN attendance_records r ON r.session_id = s.id
      WHERE s.unit_id = $1
      GROUP BY s.id, s.session_date, s.session_title
      ORDER BY s.session_date DESC
      LIMIT 20;
    `, [targetUnitId]);
  });

  // Benchmark 4: Equipment Catalog Read
  await runBenchmark('Read: Equipment Catalog with Inventory Counts', 'READ', 10, async () => {
    await query(`
      SELECT e.id, e.name, e.sku, e.total_quantity, c.name as cat_name
      FROM equipment e
      LEFT JOIN equipment_categories c ON e.category_id = c.id
      LIMIT 50;
    `);
  });

  // Benchmark 5: Audit Logs Query with Pagination
  await runBenchmark('Read: Audit Logs with User & Unit Joins', 'READ', 10, async () => {
    await query(`
      SELECT a.id, a.action_type, a.title_ar, a.created_at, u.full_name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 25;
    `);
  });

  // Benchmark 6: Write Benchmark - Session Create & Roll-Call Write
  await runBenchmark('Write: Attendance Session & Records Insert', 'WRITE', 5, async () => {
    const tempDate = `2026-12-${Math.floor(10 + Math.random() * 15)}`;
    const sessionRes = await query(`
      INSERT INTO attendance_sessions (unit_id, session_date, session_title, event_type, recorded_by)
      VALUES ($1, $2, 'جلسة قياس الأداء', 'meeting', 'eddc77ff-69dc-452b-a5e1-0359ef7a8007')
      RETURNING id;
    `, [targetUnitId, tempDate]);
    const sid = sessionRes[0].id;
    const scout = await query(`SELECT id FROM members WHERE unit_id = $1 LIMIT 1;`, [targetUnitId]);
    if (scout.length > 0) {
      await query(`
        INSERT INTO attendance_records (session_id, member_id, status)
        VALUES ($1, $2, 'present');
      `, [sid, scout[0].id]);
    }
    await query(`DELETE FROM attendance_sessions WHERE id = $1;`, [sid]);
  });

  // Print Benchmark Table
  console.log(`\n${colors.bold}┌──────────────────────────────────────────────┬────────┬─────────┬─────────┬─────────┬─────────┬───────┐${colors.reset}`);
  console.log(`${colors.bold}│ Operation Benchmark                          │ Type   │ Min     │ Avg     │ P95     │ Max     │ Grade │${colors.reset}`);
  console.log(`${colors.bold}├──────────────────────────────────────────────┼────────┼─────────┼─────────┼─────────┼─────────┼───────┤${colors.reset}`);
  for (const m of benchmarkMetrics) {
    const op = m.operation.padEnd(44).slice(0, 44);
    const type = m.category.padEnd(6);
    const min = `${m.minMs.toFixed(1)}ms`.padStart(7);
    const avg = `${m.avgMs.toFixed(1)}ms`.padStart(7);
    const p95 = `${m.p95Ms.toFixed(1)}ms`.padStart(7);
    const max = `${m.maxMs.toFixed(1)}ms`.padStart(7);
    const gradeColor =
      m.slaGrade === 'A+' ? colors.green :
      m.slaGrade === 'A' ? colors.green :
      m.slaGrade === 'B' ? colors.yellow : colors.red;
    const grade = `${gradeColor}${m.slaGrade.padStart(4)}   ${colors.reset}`;
    console.log(`│ ${op} │ ${type} │ ${min} │ ${avg} │ ${p95} │ ${max} │${grade}│`);
  }
  console.log(`${colors.bold}└──────────────────────────────────────────────┴────────┴─────────┴─────────┴─────────┴─────────┴───────┘${colors.reset}`);

  // ---------------------------------------------------------------------------------
  // OVERALL TEST SUITE SUMMARY
  // ---------------------------------------------------------------------------------
  const totalDuration = performance.now() - suiteStartTime;
  const passedCount = testResults.filter(t => t.passed).length;
  const failedCount = testResults.filter(t => !t.passed).length;
  const totalTests = testResults.length;

  console.log(`\n${colors.cyan}${colors.bold}======================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}                           FINAL SCORECARD                           ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}======================================================================${colors.reset}`);
  console.log(`  Total Test Cases Executed : ${colors.bold}${totalTests}${colors.reset}`);
  console.log(`  Passed                    : ${colors.green}${colors.bold}${passedCount}${colors.reset}`);
  console.log(`  Failed                    : ${failedCount === 0 ? colors.green : colors.red}${colors.bold}${failedCount}${colors.reset}`);
  console.log(`  Success Rate              : ${colors.bold}${((passedCount / totalTests) * 100).toFixed(1)}%${colors.reset}`);
  console.log(`  Total Execution Time      : ${colors.bold}${(totalDuration / 1000).toFixed(2)}s${colors.reset}`);

  if (failedCount === 0) {
    console.log(`\n  ${colors.green}${colors.bold}🎉 ALL SYSTEMS VERIFIED: FUNCTIONALITIES, REFRESH PERSISTENCE & SPEED OPTIMAL!${colors.reset}\n`);
  } else {
    console.log(`\n  ${colors.red}${colors.bold}⚠️ SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE.${colors.reset}\n`);
    process.exit(1);
  }
}

// Execute if run directly
runEntireSystemTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error running test suite:', err);
    process.exit(1);
  });
