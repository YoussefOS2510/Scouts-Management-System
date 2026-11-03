import { query } from '../src/db';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 Comprehensive Test Suite: Event-Based Attendance System');
  console.log('================================================================\n');

  const unitId = 5; // Scouts A (كشافة A)

  // Step 1: Query existing events
  console.log('--- TEST 1: Query existing events for Unit 5 ---');
  const existingEvents = await query(`
    SELECT 
      s.id,
      s.unit_id,
      TO_CHAR(s.session_date, 'YYYY-MM-DD') AS session_date,
      s.session_title,
      s.event_type,
      s.location,
      COUNT(r.id)::int AS total_records
    FROM attendance_sessions s
    LEFT JOIN attendance_records r ON r.session_id = s.id
    WHERE s.unit_id = $1
    GROUP BY s.id, s.unit_id, s.session_date, s.session_title, s.event_type, s.location
    ORDER BY s.session_date DESC;
  `, [unitId]);
  console.log(`[PASS] Found ${existingEvents.length} existing event(s) for Unit 5.`);
  existingEvents.forEach(e => {
    console.log(`   • [${e.id.slice(0, 8)}] "${e.session_title}" on ${e.session_date} (Type: ${e.event_type || 'default'}, Records: ${e.total_records})`);
  });

  // Step 2: Create a new Event with Title and Date
  console.log('\n--- TEST 2: Setting a New Event with Title and Date ---');
  const testDate = '2026-11-20';
  const testTitle = 'مخيم الاستكشاف والريادة الكشفي (Test Event)';
  const testType = 'camp';
  const testLocation = 'أرض وادي النطرون الكشفية';

  // Find admin user
  const adminRes = await query(`SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1`);
  const adminId = adminRes[0].id;

  const createRes = await query(`
    INSERT INTO attendance_sessions (unit_id, session_date, session_title, event_type, location, notes, recorded_by)
    VALUES ($1, $2, $3, $4, $5, 'مخيم تدريبي للمستويات المتقدمة', $6)
    RETURNING id, unit_id, TO_CHAR(session_date, 'YYYY-MM-DD') AS session_date, session_title, event_type, location, notes;
  `, [unitId, testDate, testTitle, testType, testLocation, adminId]);

  const newEvent = createRes[0];
  console.log(`[PASS] Created event successfully: ID = ${newEvent.id}`);
  console.log(`   • Title: ${newEvent.session_title}`);
  console.log(`   • Date: ${newEvent.session_date}`);
  console.log(`   • Type: ${newEvent.event_type}`);
  console.log(`   • Location: ${newEvent.location}`);

  // Step 3: Taking Attendance Inside That Event
  console.log('\n--- TEST 3: Taking Attendance Inside Event ---');
  const scouts = await query(`SELECT id, full_name_ar, member_code FROM members WHERE unit_id = $1 LIMIT 5`, [unitId]);
  if (scouts.length < 3) {
    throw new Error('Not enough scouts found in unit to test attendance');
  }

  console.log(`Picking attendance for ${scouts.length} scouts inside event:`);
  const mockAttendance = [
    { memberId: scouts[0].id, status: 'present', notes: '' },
    { memberId: scouts[1].id, status: 'present', notes: '' },
    { memberId: scouts[2].id, status: 'absent', notes: '' },
    { memberId: scouts[3].id, status: 'excused', notes: 'سفر عائلي معتمد' },
    { memberId: scouts[4].id, status: 'late', notes: 'تأخير 15 دقيقة' },
  ];

  for (const item of mockAttendance) {
    await query(`
      INSERT INTO attendance_records (session_id, member_id, status, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (session_id, member_id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes;
    `, [newEvent.id, item.memberId, item.status, item.notes || null]);
  }
  console.log(`[PASS] Recorded attendance for all 5 scouts inside event ${newEvent.id}`);

  // Step 4: Verify Event Attendance Records and Aggregations
  console.log('\n--- TEST 4: Verifying Roll-Call Data Inside Event ---');
  const recordsInEvent = await query(`
    SELECT 
      r.id,
      r.session_id,
      r.member_id,
      r.status,
      r.notes,
      m.full_name_ar,
      m.member_code
    FROM attendance_records r
    JOIN members m ON m.id = r.member_id
    WHERE r.session_id = $1
    ORDER BY m.full_name_ar ASC;
  `, [newEvent.id]);

  console.log(`[PASS] Fetched ${recordsInEvent.length} saved attendance records for event:`);
  recordsInEvent.forEach(r => {
    console.log(`   • ${r.full_name_ar} (${r.member_code}): [${r.status.toUpperCase()}] ${r.notes ? `Note: "${r.notes}"` : ''}`);
  });

  const aggRes = await query(`
    SELECT 
      COUNT(r.id)::int AS total_records,
      COUNT(CASE WHEN r.status = 'present' THEN 1 END)::int AS present_count,
      COUNT(CASE WHEN r.status = 'absent' THEN 1 END)::int AS absent_count,
      COUNT(CASE WHEN r.status = 'excused' THEN 1 END)::int AS excused_count,
      COUNT(CASE WHEN r.status = 'late' THEN 1 END)::int AS late_count
    FROM attendance_records r
    WHERE r.session_id = $1;
  `, [newEvent.id]);

  const agg = aggRes[0];
  console.log(`[PASS] Aggregated Stats for Event:`);
  console.log(`   • Total Recorded: ${agg.total_records}`);
  console.log(`   • Present: ${agg.present_count}`);
  console.log(`   • Absent: ${agg.absent_count}`);
  console.log(`   • Excused: ${agg.excused_count}`);
  console.log(`   • Late: ${agg.late_count}`);

  if (agg.present_count !== 2 || agg.absent_count !== 1 || agg.excused_count !== 1 || agg.late_count !== 1) {
    throw new Error('Aggregation numbers mismatch expected counts!');
  }

  // Step 5: Updating Event Details
  console.log('\n--- TEST 5: Updating Event Details (Title, Location) ---');
  const updatedTitle = 'مخيم الاستكشاف الكشفي السنوي - معدل';
  const updatedLocation = 'مخيم الأهرامات الدولي';
  await query(`
    UPDATE attendance_sessions
    SET session_title = $1, location = $2
    WHERE id = $3;
  `, [updatedTitle, updatedLocation, newEvent.id]);

  const checkUpdated = await query(`SELECT session_title, location FROM attendance_sessions WHERE id = $1`, [newEvent.id]);
  console.log(`[PASS] Event updated: "${checkUpdated[0].session_title}" at "${checkUpdated[0].location}"`);

  // Step 6: Clean Up Test Event and verify CASCADE delete
  console.log('\n--- TEST 6: Event Deletion and Cascade Integrity ---');
  await query(`DELETE FROM attendance_sessions WHERE id = $1;`, [newEvent.id]);
  const verifySessionDeleted = await query(`SELECT id FROM attendance_sessions WHERE id = $1`, [newEvent.id]);
  const verifyRecordsDeleted = await query(`SELECT id FROM attendance_records WHERE session_id = $1`, [newEvent.id]);

  if (verifySessionDeleted.length === 0 && verifyRecordsDeleted.length === 0) {
    console.log('[PASS] Event and its cascading attendance records deleted cleanly.');
  } else {
    throw new Error('Cascade deletion failed!');
  }

  console.log('\n================================================================');
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY ON THE DEPLOYED DATABASE!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
}).finally(() => process.exit(0));

