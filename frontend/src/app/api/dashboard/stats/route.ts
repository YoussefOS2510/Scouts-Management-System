import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const memRes = await query(`SELECT COUNT(*) AS total FROM members WHERE is_active = 1`);
    const eqRes = await query(`SELECT ISNULL(SUM(total_quantity), 0) AS total FROM equipment`);
    const sessRes = await query(`SELECT COUNT(*) AS total FROM attendance_sessions`);
    const bookRes = await query(`SELECT COUNT(*) AS total FROM bookings`);

    return NextResponse.json({
      success: true,
      stats: {
        totalMembers: memRes[0]?.total || 0,
        totalEquipment: eqRes[0]?.total || 0,
        totalSessions: sessRes[0]?.total || 0,
        totalBookings: bookRes[0]?.total || 0,
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
