import { NextRequest, NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unitId = searchParams.get('unitId');
    const actionType = searchParams.get('actionType');
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);

    let logsSql = `
      SELECT
        a.id,
        a.user_id,
        a.unit_id,
        a.action_type,
        a.title_ar,
        a.title_en,
        a.description_ar,
        a.description_en,
        a.metadata,
        CONVERT(NVARCHAR(30), a.created_at, 127) AS timestamp,
        u.name_ar AS unit_name_ar,
        u.name_en AS unit_name_en,
        usr.full_name AS user_name,
        usr.email AS user_email
      FROM audit_logs a
      LEFT JOIN units u ON u.id = a.unit_id
      LEFT JOIN users usr ON usr.id = a.user_id
      WHERE 1=1
    `;

    const params: { name: string; type: any; value: any }[] = [
      { name: 'limit', type: sql.Int, value: limit }
    ];

    if (userId) {
      logsSql += ` AND a.user_id = @userId`;
      params.push({ name: 'userId', type: sql.UniqueIdentifier, value: userId });
    }
    if (unitId && !isNaN(Number(unitId))) {
      logsSql += ` AND a.unit_id = @unitId`;
      params.push({ name: 'unitId', type: sql.Int, value: Number(unitId) });
    }
    if (actionType && actionType !== 'all') {
      logsSql += ` AND a.action_type = @actionType`;
      params.push({ name: 'actionType', type: sql.NVarChar(50), value: actionType });
    }

    logsSql += ` ORDER BY a.created_at DESC LIMIT @limit`;
    const logs = await query(logsSql, params);

    const parsedLogs = logs.map((l: any) => {
      let meta = null;
      if (l.metadata) {
        try {
          meta = JSON.parse(l.metadata);
        } catch {}
      }
      return {
        ...l,
        metadata: meta,
      };
    });

    return NextResponse.json({
      success: true,
      logs: parsedLogs,
    });
  } catch (error: any) {
    console.error('[API /api/audit-logs GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, unitId, actionType, titleAr, titleEn, descriptionAr, descriptionEn, metadata } = body;

    if (!actionType || !titleAr || !descriptionAr) {
      return NextResponse.json(
        { success: false, error: 'actionType, titleAr, and descriptionAr are required' },
        { status: 400 }
      );
    }

    // Resolve user ID
    let targetUserId = userId;
    if (!targetUserId) {
      const adminRes = await query(`SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1`);
      targetUserId = adminRes[0]?.id;
    }

    const metaStr = metadata ? JSON.stringify(metadata) : null;

    const res = await query(`
      INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en, metadata)
      VALUES (@uid, @unitId, @actType, @titleAr, @titleEn, @descAr, @descEn, @meta)
      RETURNING id, created_at
    `, [
      { name: 'uid', type: sql.UniqueIdentifier, value: targetUserId },
      { name: 'unitId', type: sql.Int, value: unitId ? Number(unitId) : null },
      { name: 'actType', type: sql.NVarChar(50), value: actionType },
      { name: 'titleAr', type: sql.NVarChar(200), value: titleAr },
      { name: 'titleEn', type: sql.NVarChar(200), value: titleEn || titleAr },
      { name: 'descAr', type: sql.NVarChar(sql.MAX), value: descriptionAr },
      { name: 'descEn', type: sql.NVarChar(sql.MAX), value: descriptionEn || descriptionAr },
      { name: 'meta', type: sql.NVarChar(sql.MAX), value: metaStr },
    ]);

    return NextResponse.json({
      success: true,
      id: res[0]?.id,
      timestamp: res[0]?.created_at,
    });
  } catch (error: any) {
    console.error('[API /api/audit-logs POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to insert audit log' },
      { status: 500 }
    );
  }
}
