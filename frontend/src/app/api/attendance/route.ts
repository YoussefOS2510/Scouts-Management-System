import { NextRequest, NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const isUUID = (val: any): boolean =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unitIdParam = searchParams.get('unitId');
    const sessionIdParam = searchParams.get('sessionId');

    let targetUnitId = unitIdParam && !isNaN(Number(unitIdParam)) ? Number(unitIdParam) : null;
    let targetSessionId = sessionIdParam && isUUID(sessionIdParam) ? sessionIdParam : null;

    // If sessionId was provided without a valid unitId, look up unit from the session
    if (targetSessionId && !targetUnitId) {
      const sessRow = await query(
        `SELECT unit_id FROM attendance_sessions WHERE id = @sid LIMIT 1`,
        [{ name: 'sid', type: sql.UniqueIdentifier, value: targetSessionId }]
      );
      if (sessRow.length > 0) {
        targetUnitId = sessRow[0].unit_id;
      }
    }

    let sessionsSql = `
      SELECT 
        s.id,
        s.unit_id,
        TO_CHAR(s.session_date, 'YYYY-MM-DD') AS session_date,
        s.session_title,
        s.event_type,
        s.location,
        s.notes,
        s.recorded_by,
        s.created_at,
        u.name_ar AS unit_name_ar,
        u.name_en AS unit_name_en,
        usr.full_name AS recorded_by_name,
        COUNT(r.id)::int AS total_records,
        COUNT(CASE WHEN r.status = 'present' THEN 1 END)::int AS present_count,
        COUNT(CASE WHEN r.status = 'absent' THEN 1 END)::int AS absent_count,
        COUNT(CASE WHEN r.status = 'excused' THEN 1 END)::int AS excused_count,
        COUNT(CASE WHEN r.status = 'late' THEN 1 END)::int AS late_count
      FROM attendance_sessions s
      JOIN units u ON u.id = s.unit_id
      LEFT JOIN users usr ON usr.id = s.recorded_by
      LEFT JOIN attendance_records r ON r.session_id = s.id
    `;

    const whereClauses: string[] = [];
    const params: { name: string; type: any; value: any }[] = [];

    if (targetUnitId) {
      whereClauses.push(`s.unit_id = @unitId`);
      params.push({ name: 'unitId', type: sql.Int, value: targetUnitId });
    }

    if (whereClauses.length > 0) {
      sessionsSql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    sessionsSql += `
      GROUP BY 
        s.id, s.unit_id, s.session_date, s.session_title, s.event_type, 
        s.location, s.notes, s.recorded_by, s.created_at, 
        u.name_ar, u.name_en, usr.full_name
      ORDER BY s.session_date DESC, s.created_at DESC
    `;

    const sessions = await query(sessionsSql, params);

    // Determine which session's attendance records to load
    if (!targetSessionId && sessions.length > 0) {
      targetSessionId = sessions[0].id;
    }

    let records: any[] = [];
    if (targetSessionId) {
      records = await query(
        `
        SELECT 
          r.id,
          r.session_id,
          r.member_id,
          r.status,
          r.notes,
          m.full_name_ar,
          m.full_name_en,
          m.member_code,
          m.patrol_id
        FROM attendance_records r
        JOIN members m ON m.id = r.member_id
        WHERE r.session_id = @targetSessionId
        ORDER BY m.full_name_ar ASC
        `,
        [{ name: 'targetSessionId', type: sql.UniqueIdentifier, value: targetSessionId }]
      );
    }

    return NextResponse.json({
      success: true,
      sessions,
      records,
      activeSessionId: targetSessionId || null,
      unitId: targetUnitId || null,
    });
  } catch (error: any) {
    console.error('[API /api/attendance GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch attendance data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      sessionId,
      unitId,
      sessionDate,
      sessionTitle,
      eventType = 'meeting',
      location,
      notes,
      recordedBy,
      records,
    } = body;

    // Resolve leader ID safely as a valid UUID
    let leaderId = isUUID(recordedBy) ? recordedBy : null;
    if (!leaderId) {
      const adminRes = await query(`SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1`);
      leaderId = adminRes[0]?.id || 'eddc77ff-69dc-452b-a5e1-0359ef7a8007';
    }

    // ACTION 1: CREATE NEW EVENT
    if (action === 'create_event') {
      if (!unitId || !sessionDate || !sessionTitle?.trim()) {
        return NextResponse.json(
          { success: false, error: 'unitId, sessionDate, and sessionTitle are required' },
          { status: 400 }
        );
      }

      // Check if duplicate event exists for this unit, date, and title
      const existing = await query(
        `SELECT id FROM attendance_sessions WHERE unit_id = @unitId AND session_date = @sessionDate AND session_title = @title`,
        [
          { name: 'unitId', type: sql.Int, value: Number(unitId) },
          { name: 'sessionDate', type: sql.Date, value: sessionDate },
          { name: 'title', type: sql.NVarChar(150), value: sessionTitle.trim() },
        ]
      );

      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, error: 'An event with this name already exists for this unit on this date.' },
          { status: 409 }
        );
      }

      const insertRes = await query(
        `
        INSERT INTO attendance_sessions (unit_id, session_date, session_title, event_type, location, notes, recorded_by)
        VALUES (@unitId, @sessionDate, @title, @eventType, @location, @notes, @recordedBy)
        RETURNING id, unit_id, TO_CHAR(session_date, 'YYYY-MM-DD') AS session_date, session_title, event_type, location, notes, recorded_by, created_at
        `,
        [
          { name: 'unitId', type: sql.Int, value: Number(unitId) },
          { name: 'sessionDate', type: sql.Date, value: sessionDate },
          { name: 'title', type: sql.NVarChar(150), value: sessionTitle.trim() },
          { name: 'eventType', type: sql.NVarChar(50), value: eventType || 'meeting' },
          { name: 'location', type: sql.NVarChar(150), value: location?.trim() || null },
          { name: 'notes', type: sql.Text, value: notes?.trim() || null },
          { name: 'recordedBy', type: sql.UniqueIdentifier, value: leaderId },
        ]
      );

      const newSession = insertRes[0];

      // Audit log
      try {
        const unitInfo = await query(`SELECT name_ar, name_en FROM units WHERE id = @uid`, [
          { name: 'uid', type: sql.Int, value: Number(unitId) },
        ]);
        const uName = unitInfo[0]?.name_ar || `وحدة ${unitId}`;
        await query(
          `
          INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en, metadata)
          VALUES (@uid, @unitId, 'event_created', @titleAr, @titleEn, @descAr, @descEn, @meta)
          `,
          [
            { name: 'uid', type: sql.UniqueIdentifier, value: leaderId },
            { name: 'unitId', type: sql.Int, value: Number(unitId) },
            { name: 'titleAr', type: sql.NVarChar(200), value: `تحديد فعالية جديدة (${sessionTitle.trim()})` },
            { name: 'titleEn', type: sql.NVarChar(200), value: `Event Created (${sessionTitle.trim()})` },
            { name: 'descAr', type: sql.NVarChar(sql.MAX), value: `تم إنشاء فعالية "${sessionTitle.trim()}" بتاريخ ${sessionDate} لوحدة ${uName}` },
            { name: 'descEn', type: sql.NVarChar(sql.MAX), value: `Created event "${sessionTitle.trim()}" on ${sessionDate} for unit ${unitInfo[0]?.name_en || uName}` },
            { name: 'meta', type: sql.NVarChar(sql.MAX), value: JSON.stringify({ session_id: newSession.id, session_date: sessionDate, title: sessionTitle.trim() }) },
          ]
        );
      } catch (auditErr) {
        console.warn('[Attendance Audit Log Warning]:', auditErr);
      }

      return NextResponse.json({
        success: true,
        session: newSession,
        message: 'Event created successfully',
      });
    }

    // ACTION 2: SAVE ATTENDANCE RECORDS (DEFAULT)
    let targetSessionId = sessionId;

    if (!targetSessionId) {
      if (!unitId || !sessionDate) {
        return NextResponse.json(
          { success: false, error: 'unitId and sessionDate are required when sessionId is not provided' },
          { status: 400 }
        );
      }

      // Check if session exists by unitId, sessionDate, and title
      const title = sessionTitle?.trim() || 'اجتماع كشفي أسبوعي';
      const existing = await query(
        `SELECT id FROM attendance_sessions WHERE unit_id = @unitId AND session_date = @sessionDate AND session_title = @title`,
        [
          { name: 'unitId', type: sql.Int, value: Number(unitId) },
          { name: 'sessionDate', type: sql.Date, value: sessionDate },
          { name: 'title', type: sql.NVarChar(150), value: title },
        ]
      );

      if (existing.length > 0) {
        targetSessionId = existing[0].id;
      } else {
        const insertRes = await query(
          `
          INSERT INTO attendance_sessions (unit_id, session_date, session_title, event_type, location, recorded_by)
          VALUES (@unitId, @sessionDate, @title, @eventType, @location, @recordedBy)
          RETURNING id
          `,
          [
            { name: 'unitId', type: sql.Int, value: Number(unitId) },
            { name: 'sessionDate', type: sql.Date, value: sessionDate },
            { name: 'title', type: sql.NVarChar(150), value: title },
            { name: 'eventType', type: sql.NVarChar(50), value: eventType || 'meeting' },
            { name: 'location', type: sql.NVarChar(150), value: location?.trim() || null },
            { name: 'recordedBy', type: sql.UniqueIdentifier, value: leaderId },
          ]
        );
        targetSessionId = insertRes[0].id;
      }
    } else {
      // If sessionId was provided, optionally update title/date/location if passed
      if (sessionTitle || sessionDate || location) {
        await query(
          `
          UPDATE attendance_sessions 
          SET 
            session_title = COALESCE(@title, session_title),
            session_date = COALESCE(@sessionDate, session_date),
            location = COALESCE(@location, location),
            event_type = COALESCE(@eventType, event_type)
          WHERE id = @id
          `,
          [
            { name: 'id', type: sql.UniqueIdentifier, value: targetSessionId },
            { name: 'title', type: sql.NVarChar(150), value: sessionTitle ? sessionTitle.trim() : null },
            { name: 'sessionDate', type: sql.Date, value: sessionDate || null },
            { name: 'location', type: sql.NVarChar(150), value: location ? location.trim() : null },
            { name: 'eventType', type: sql.NVarChar(50), value: eventType || null },
          ]
        );
      }
    }

    // Save individual member records in high-performance batch
    if (Array.isArray(records)) {
      const validRecords = records.filter(
        (rec: any) =>
          rec &&
          rec.memberId &&
          isUUID(rec.memberId) &&
          rec.status &&
          ['present', 'absent', 'excused', 'late'].includes(rec.status)
      );

      if (validRecords.length > 0) {
        // Multi-row batch upsert in a single network round-trip
        const valuesSql: string[] = [];
        const params: any[] = [
          { name: 'targetSessionId', type: sql.UniqueIdentifier, value: targetSessionId },
        ];

        validRecords.forEach((rec: any, idx: number) => {
          const mParam = `m_${idx}`;
          const sParam = `s_${idx}`;
          const nParam = `n_${idx}`;
          valuesSql.push(`(@targetSessionId, @${mParam}, @${sParam}, @${nParam})`);
          params.push(
            { name: mParam, type: sql.UniqueIdentifier, value: rec.memberId },
            { name: sParam, type: sql.NVarChar(20), value: rec.status },
            { name: nParam, type: sql.NVarChar(255), value: rec.notes || null }
          );
        });

        await query(
          `
          INSERT INTO attendance_records (session_id, member_id, status, notes)
          VALUES ${valuesSql.join(', ')}
          ON CONFLICT (session_id, member_id)
          DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes
          `,
          params
        );

        // Sync removal: delete records for this session that are not in validRecords
        const idList = validRecords.map((r: any) => `'${r.memberId}'`).join(',');
        await query(
          `DELETE FROM attendance_records WHERE session_id = @sid AND member_id NOT IN (${idList})`,
          [{ name: 'sid', type: sql.UniqueIdentifier, value: targetSessionId }]
        );
      } else {
        await query(
          `DELETE FROM attendance_records WHERE session_id = @sid`,
          [{ name: 'sid', type: sql.UniqueIdentifier, value: targetSessionId }]
        );
      }
    }

    // Audit log
    try {
      const sessInfo = await query(
        `SELECT s.session_title, TO_CHAR(s.session_date, 'YYYY-MM-DD') AS session_date, s.unit_id, u.name_ar, u.name_en
         FROM attendance_sessions s
         JOIN units u ON u.id = s.unit_id
         WHERE s.id = @id`,
        [{ name: 'id', type: sql.UniqueIdentifier, value: targetSessionId }]
      );
      const s = sessInfo[0];
      const recCount = records ? records.length : 0;
      const sTitle = s?.session_title || sessionTitle || 'فعالية';
      const sDate = s?.session_date || sessionDate;
      const sUnitId = s?.unit_id || unitId;

      await query(
        `
        INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en, metadata)
        VALUES (@uid, @unitId, 'attendance_saved', @titleAr, @titleEn, @descAr, @descEn, @meta)
        `,
        [
          { name: 'uid', type: sql.UniqueIdentifier, value: leaderId },
          { name: 'unitId', type: sql.Int, value: Number(sUnitId) },
          { name: 'titleAr', type: sql.NVarChar(200), value: `تسجيل حضور: ${sTitle} (${s?.name_ar || ''})` },
          { name: 'titleEn', type: sql.NVarChar(200), value: `Attendance Saved: ${sTitle} (${s?.name_en || ''})` },
          { name: 'descAr', type: sql.NVarChar(sql.MAX), value: `تم حفظ كشف الحضور لفعالية "${sTitle}" بتاريخ ${sDate} بنجاح (${recCount} عضو)` },
          { name: 'descEn', type: sql.NVarChar(sql.MAX), value: `Saved attendance for event "${sTitle}" on ${sDate} (${recCount} members)` },
          { name: 'meta', type: sql.NVarChar(sql.MAX), value: JSON.stringify({ session_id: targetSessionId, session_date: sDate, title: sTitle, count: recCount }) },
        ]
      );
    } catch (auditErr) {
      console.warn('[Attendance Audit Log Warning]:', auditErr);
    }

    return NextResponse.json({
      success: true,
      sessionId: targetSessionId,
      message: 'Attendance saved successfully',
    });
  } catch (error: any) {
    console.error('[API /api/attendance POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save attendance' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, sessionTitle, sessionDate, eventType, location, notes } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId is required for update' },
        { status: 400 }
      );
    }

    await query(
      `
      UPDATE attendance_sessions
      SET
        session_title = COALESCE(@title, session_title),
        session_date = COALESCE(@sessionDate, session_date),
        event_type = COALESCE(@eventType, event_type),
        location = COALESCE(@location, location),
        notes = COALESCE(@notes, notes)
      WHERE id = @id
      `,
      [
        { name: 'id', type: sql.UniqueIdentifier, value: sessionId },
        { name: 'title', type: sql.NVarChar(150), value: sessionTitle ? sessionTitle.trim() : null },
        { name: 'sessionDate', type: sql.Date, value: sessionDate || null },
        { name: 'eventType', type: sql.NVarChar(50), value: eventType || null },
        { name: 'location', type: sql.NVarChar(150), value: location ? location.trim() : null },
        { name: 'notes', type: sql.Text, value: notes ? notes.trim() : null },
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
    });
  } catch (error: any) {
    console.error('[API /api/attendance PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionIdParam = searchParams.get('sessionId');

    if (!sessionIdParam) {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Get event details before deletion for audit log
    const sess = await query(
      `SELECT s.id, s.session_title, TO_CHAR(s.session_date, 'YYYY-MM-DD') AS session_date, s.unit_id, u.name_ar 
       FROM attendance_sessions s 
       JOIN units u ON u.id = s.unit_id 
       WHERE s.id = @id`,
      [{ name: 'id', type: sql.UniqueIdentifier, value: sessionIdParam }]
    );

    if (sess.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventData = sess[0];

    // Delete attendance session (records cascade delete)
    await query(`DELETE FROM attendance_sessions WHERE id = @id`, [
      { name: 'id', type: sql.UniqueIdentifier, value: sessionIdParam },
    ]);

    // Audit log
    try {
      await query(
        `
        INSERT INTO audit_logs (unit_id, action_type, title_ar, title_en, description_ar, description_en, metadata)
        VALUES (@unitId, 'event_deleted', @titleAr, @titleEn, @descAr, @descEn, @meta)
        `,
        [
          { name: 'unitId', type: sql.Int, value: Number(eventData.unit_id) },
          { name: 'titleAr', type: sql.NVarChar(200), value: `حذف فعالية (${eventData.session_title})` },
          { name: 'titleEn', type: sql.NVarChar(200), value: `Event Deleted (${eventData.session_title})` },
          { name: 'descAr', type: sql.NVarChar(sql.MAX), value: `تم حذف فعالية "${eventData.session_title}" وسجلات حضورها لوحدة ${eventData.name_ar}` },
          { name: 'descEn', type: sql.NVarChar(sql.MAX), value: `Deleted event "${eventData.session_title}" and its attendance records` },
          { name: 'meta', type: sql.NVarChar(sql.MAX), value: JSON.stringify({ session_id: sessionIdParam, title: eventData.session_title }) },
        ]
      );
    } catch (auditErr) {
      console.warn('[Attendance Audit Log Warning]:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Event and attendance records deleted successfully',
    });
  } catch (error: any) {
    console.error('[API /api/attendance DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete event' },
      { status: 500 }
    );
  }
}
