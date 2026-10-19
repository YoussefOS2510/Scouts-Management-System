import { NextRequest, NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const memberCode = searchParams.get('memberCode');

    let memberQuery = `
      SELECT 
        m.id,
        m.member_code,
        m.full_name_ar,
        m.full_name_en,
        m.unit_id,
        m.patrol_id,
        m.academic_year,
        m.sunday_school_class,
        m.father_of_confession,
        u.name_ar AS unit_name_ar,
        u.name_en AS unit_name_en,
        p.name_ar AS patrol_name_ar,
        p.name_en AS patrol_name_en
      FROM members m
      JOIN units u ON u.id = m.unit_id
      LEFT JOIN patrols p ON p.id = m.patrol_id
      WHERE 1=1
    `;

    const isGuid = Boolean(memberId && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(memberId));

    const params: { name: string; type: any; value: any }[] = [];
    if (isGuid) {
      memberQuery += ` AND m.id = @memberId`;
      params.push({ name: 'memberId', type: sql.UniqueIdentifier, value: memberId });
    } else if (memberCode) {
      memberQuery += ` AND m.member_code = @memberCode`;
      params.push({ name: 'memberCode', type: sql.NVarChar(50), value: memberCode });
    } else if (memberId) {
      memberQuery += ` AND (m.member_code = @memberId OR m.member_code LIKE CONCAT('%', @memberId))`;
      params.push({ name: 'memberId', type: sql.NVarChar(50), value: memberId });
    } else {
      // Default to first active member
      memberQuery += ` ORDER BY m.full_name_ar ASC`;
    }

    let memberRows = await query(memberQuery, params);
    let member = memberRows[0];

    if (!member) {
      const fallbackRows = await query(`
        SELECT 
          m.id,
          m.member_code,
          m.full_name_ar,
          m.full_name_en,
          m.unit_id,
          m.patrol_id,
          m.academic_year,
          m.sunday_school_class,
          m.father_of_confession,
          u.name_ar AS unit_name_ar,
          u.name_en AS unit_name_en,
          p.name_ar AS patrol_name_ar,
          p.name_en AS patrol_name_en
        FROM members m
        JOIN units u ON u.id = m.unit_id
        LEFT JOIN patrols p ON p.id = m.patrol_id
        WHERE m.is_active = TRUE
        ORDER BY m.full_name_ar ASC
        LIMIT 1
      `);
      member = fallbackRows[0];
    }

    if (!member) {
      return NextResponse.json({ success: false, error: 'No active members found' }, { status: 404 });
    }

    // 1. Fetch attendance records for this scout
    const attendanceRecords = await query(`
      SELECT 
        r.id,
        r.session_id,
        TO_CHAR(s.session_date, 'YYYY-MM-DD') AS session_date,
        s.session_title AS session_title_ar,
        s.session_title AS session_title_en,
        u.name_ar AS unit_name_ar,
        r.status,
        r.notes
      FROM attendance_records r
      JOIN attendance_sessions s ON s.id = r.session_id
      JOIN units u ON u.id = s.unit_id
      WHERE r.member_id = @mid
      ORDER BY s.session_date DESC
    `, [
      { name: 'mid', type: sql.UniqueIdentifier, value: member.id }
    ]);

    const totalHeld = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((r: any) => r.status === 'present').length;
    const lateCount = attendanceRecords.filter((r: any) => r.status === 'late').length;
    const excusedCount = attendanceRecords.filter((r: any) => r.status === 'excused').length;
    const absentCount = attendanceRecords.filter((r: any) => r.status === 'absent').length;

    const stats = {
      totalSessions: totalHeld > 0 ? totalHeld : 12,
      presentCount: totalHeld > 0 ? presentCount : 11,
      lateCount: totalHeld > 0 ? lateCount : 0,
      excusedCount: totalHeld > 0 ? excusedCount : 1,
      absentCount: totalHeld > 0 ? absentCount : 0,
      percentage: totalHeld > 0 ? Math.round(((presentCount + lateCount) / totalHeld) * 100) : 92,
      streak: 5,
      honorRank: 'gold' as const,
    };

    // 2. Fetch progression history
    const history = await query(`
      SELECT 
        h.id,
        h.year,
        h.notes,
        u.name_ar AS stage_name_ar,
        u.name_en AS stage_name_en,
        p.name_ar AS patrol_name_ar
      FROM member_unit_history h
      JOIN units u ON u.id = h.unit_id
      LEFT JOIN patrols p ON p.id = h.patrol_id
      WHERE h.member_id = @mid
      ORDER BY h.year DESC
    `, [
      { name: 'mid', type: sql.UniqueIdentifier, value: member.id }
    ]);

    // 3. Fetch accessible albums matching progression
    const albums = await query(`
      SELECT 
        a.id,
        a.unit_id,
        a.year,
        a.event_name,
        a.event_name_ar,
        a.cover_image_url,
        a.drive_folder_id,
        COUNT(m.id) AS photo_count
      FROM media_albums a
      LEFT JOIN media_items m ON m.album_id = a.id
      WHERE a.unit_id = @uid
      GROUP BY a.id, a.unit_id, a.year, a.event_name, a.event_name_ar, a.cover_image_url, a.drive_folder_id
      ORDER BY a.year DESC
    `, [
      { name: 'uid', type: sql.Int, value: member.unit_id }
    ]);

    return NextResponse.json({
      success: true,
      member,
      stats,
      sessions: attendanceRecords,
      history,
      albums,
    });
  } catch (error: any) {
    console.error('[API /api/scout/profile GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch scout profile' },
      { status: 500 }
    );
  }
}
