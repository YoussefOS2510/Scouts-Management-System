import { NextRequest, NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unitIdParam = searchParams.get('unitId');

    let sessionsSql = `
      SELECT 
        s.id,
        s.unit_id,
        TO_CHAR(s.session_date, 'YYYY-MM-DD') AS session_date,
        s.session_title,
        s.recorded_by,
        s.created_at,
        u.name_ar AS unit_name_ar,
        u.name_en AS unit_name_en,
        usr.full_name AS recorded_by_name
      FROM attendance_sessions s
      JOIN units u ON u.id = s.unit_id
      LEFT JOIN users usr ON usr.id = s.recorded_by
    `;

    const params: { name: string; type: any; value: any }[] = [];
    if (unitIdParam && !isNaN(Number(unitIdParam))) {
      sessionsSql += ` WHERE s.unit_id = @unitId`;
      params.push({ name: 'unitId', type: sql.Int, value: Number(unitIdParam) });
    }

    sessionsSql += ` ORDER BY s.session_date DESC`;
    const sessions = await query(sessionsSql, params);

    // Fetch records for these sessions if sessions exist
    let records: any[] = [];
    if (sessions.length > 0) {
      const sessionIds = sessions.map((s: any) => `'${s.id}'`).join(',');
      records = await query(`
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
        WHERE r.session_id IN (${sessionIds})
      `);
    }

    return NextResponse.json({
      success: true,
      sessions,
      records,
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
    const { unitId, sessionDate, sessionTitle, recordedBy, records } = body;

    if (!unitId || !sessionDate) {
      return NextResponse.json(
        { success: false, error: 'unitId and sessionDate are required' },
        { status: 400 }
      );
    }

    // Resolve recorded_by leader ID (default to system admin if not provided)
    let leaderId = recordedBy;
    if (!leaderId) {
      const adminRes = await query(`SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1`);
      leaderId = adminRes[0]?.id;
    }

    // Check if session already exists for this unit and date
    const existing = await query(
      `SELECT id FROM attendance_sessions WHERE unit_id = @unitId AND session_date = @sessionDate`,
      [
        { name: 'unitId', type: sql.Int, value: Number(unitId) },
        { name: 'sessionDate', type: sql.Date, value: sessionDate },
      ]
    );

    let sessionId: string;
    if (existing.length > 0) {
      sessionId = existing[0].id;
      // Update session title
      await query(
        `UPDATE attendance_sessions SET session_title = @title WHERE id = @id`,
        [
          { name: 'title', type: sql.NVarChar(150), value: sessionTitle || 'اجتماع كشفي أسبوعي' },
          { name: 'id', type: sql.UniqueIdentifier, value: sessionId },
        ]
      );
    } else {
      // Insert new session header
      const insertRes = await query(
        `
        INSERT INTO attendance_sessions (unit_id, session_date, session_title, recorded_by)
        VALUES (@unitId, @sessionDate, @title, @recordedBy)
        RETURNING id
        `,
        [
          { name: 'unitId', type: sql.Int, value: Number(unitId) },
          { name: 'sessionDate', type: sql.Date, value: sessionDate },
          { name: 'title', type: sql.NVarChar(150), value: sessionTitle || 'اجتماع كشفي أسبوعي' },
          { name: 'recordedBy', type: sql.UniqueIdentifier, value: leaderId },
        ]
      );
      sessionId = insertRes[0].id;
    }

    // Save individual member records
    if (Array.isArray(records) && records.length > 0) {
      for (const rec of records) {
        if (!rec.memberId || !rec.status) continue;
        await query(
          `
          INSERT INTO attendance_records (session_id, member_id, status, notes)
          VALUES (@sessionId, @memberId, @status, @notes)
          ON CONFLICT (session_id, member_id)
          DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes
          `,
          [
            { name: 'sessionId', type: sql.UniqueIdentifier, value: sessionId },
            { name: 'memberId', type: sql.UniqueIdentifier, value: rec.memberId },
            { name: 'status', type: sql.NVarChar(20), value: rec.status },
            { name: 'notes', type: sql.NVarChar(255), value: rec.notes || null },
          ]
        );
      }
    }

    // Log action to dbo.audit_logs
    try {
      const unitInfo = await query(`SELECT name_ar, name_en FROM units WHERE id = @uid`, [
        { name: 'uid', type: sql.Int, value: Number(unitId) }
      ]);
      const uName = unitInfo[0]?.name_ar || `وحدة ${unitId}`;
      const recCount = records ? records.length : 0;

      await query(
        `
        INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en, metadata)
        VALUES (@uid, @unitId, 'attendance_saved', @titleAr, @titleEn, @descAr, @descEn, @meta)
        `,
        [
          { name: 'uid', type: sql.UniqueIdentifier, value: leaderId },
          { name: 'unitId', type: sql.Int, value: Number(unitId) },
          { name: 'titleAr', type: sql.NVarChar(200), value: `تسجيل حضور وانصراف (${uName})` },
          { name: 'titleEn', type: sql.NVarChar(200), value: `Attendance Saved (${unitInfo[0]?.name_en || ''})` },
          { name: 'descAr', type: sql.NVarChar(sql.MAX), value: `تم حفظ كشف الحضور لتاريخ ${sessionDate} بنجاح (${recCount} عضو)` },
          { name: 'descEn', type: sql.NVarChar(sql.MAX), value: `Saved attendance roster for ${sessionDate} (${recCount} members)` },
          { name: 'meta', type: sql.NVarChar(sql.MAX), value: JSON.stringify({ session_id: sessionId, session_date: sessionDate, count: recCount }) },
        ]
      );
    } catch (auditErr) {
      console.warn('[Attendance Audit Log Warning]:', auditErr);
    }

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Attendance saved successfully to ScoutsDB',
    });
  } catch (error: any) {
    console.error('[API /api/attendance POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save attendance' },
      { status: 500 }
    );
  }
}
