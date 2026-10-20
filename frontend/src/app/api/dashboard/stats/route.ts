import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const memRes = await query(`SELECT COUNT(*) AS total FROM members WHERE is_active = TRUE`);
    const userRes = await query(`SELECT COUNT(*) AS total FROM users WHERE is_active = TRUE`);
    const eqRes = await query(`SELECT COALESCE(SUM(total_quantity), 0) AS total FROM equipment`);
    const sessRes = await query(`SELECT COUNT(*) AS total FROM attendance_sessions`);
    const bookRes = await query(`SELECT COUNT(*) AS total FROM bookings`);
    const unitRes = await query(`SELECT COUNT(*) AS total FROM units`);
    const unitMemberCountsRes = await query<{ unit_id: number; count: string }>(
      `SELECT unit_id, COUNT(*) AS count FROM members WHERE is_active = TRUE GROUP BY unit_id`
    );

    const unitMemberCounts: Record<number, number> = {};
    for (const row of unitMemberCountsRes) {
      unitMemberCounts[row.unit_id] = Number(row.count) || 0;
    }

    const totalMembers = Number(memRes[0]?.total || 0);
    const totalUsers = Number(userRes[0]?.total || 0);
    const totalEquipment = Number(eqRes[0]?.total || 0);
    const totalSessions = Number(sessRes[0]?.total || 0);
    const totalBookings = Number(bookRes[0]?.total || 0);
    const totalUnits = Number(unitRes[0]?.total || 12);

    return NextResponse.json({
      success: true,
      stats: {
        totalMembers,
        totalUsers,
        totalRegistered: totalMembers + totalUsers,
        totalEquipment,
        totalSessions,
        totalBookings,
        totalUnits,
        unitMemberCounts,
      },
    });
  } catch (error: any) {
    console.error('[API /api/dashboard/stats GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
