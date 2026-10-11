import { NextRequest, NextResponse } from 'next/server';
import { checkLeaderPermission } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId, permissionKey, unitId } = await req.json();

    if (!userId || !permissionKey) {
      return NextResponse.json(
        { success: false, error: 'userId and permissionKey are required' },
        { status: 400 }
      );
    }

    const isGranted = await checkLeaderPermission(
      userId,
      permissionKey,
      unitId !== null && unitId !== undefined ? Number(unitId) : null
    );

    return NextResponse.json({
      success: true,
      userId,
      permissionKey,
      unitId: unitId ?? null,
      is_granted: isGranted,
    });
  } catch (error: any) {
    console.error('Error executing fn_check_leader_permission:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database permission check error' },
      { status: 500 }
    );
  }
}
