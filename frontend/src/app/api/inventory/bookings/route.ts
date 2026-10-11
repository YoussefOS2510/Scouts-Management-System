import { NextRequest, NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');

    let bookingsSql = `
      SELECT 
        b.id,
        b.user_id,
        b.unit_id,
        CONVERT(NVARCHAR(10), b.start_date, 120) AS start_date,
        CONVERT(NVARCHAR(10), b.end_date, 120) AS end_date,
        b.purpose,
        b.status,
        b.approved_by,
        b.created_at,
        u.name_ar AS unit_name_ar,
        u.name_en AS unit_name_en,
        usr.full_name AS requester_name,
        appr.full_name AS approver_name
      FROM bookings b
      LEFT JOIN units u ON u.id = b.unit_id
      LEFT JOIN users usr ON usr.id = b.user_id
      LEFT JOIN users appr ON appr.id = b.approved_by
    `;

    const params: { name: string; type: any; value: any }[] = [];
    if (unitId && !isNaN(Number(unitId))) {
      bookingsSql += ` WHERE b.unit_id = @unitId`;
      params.push({ name: 'unitId', type: sql.Int, value: Number(unitId) });
    }

    bookingsSql += ` ORDER BY b.created_at DESC`;
    const bookings = await query(bookingsSql, params);

    // Fetch booking items
    let allItems: any[] = [];
    if (bookings.length > 0) {
      const bIds = bookings.map((b: any) => `'${b.id}'`).join(',');
      allItems = await query(`
        SELECT 
          bi.id,
          bi.booking_id,
          bi.equipment_id,
          bi.quantity,
          bi.returned_quantity,
          e.name AS equipment_name,
          e.sku AS equipment_sku
        FROM booking_items bi
        JOIN equipment e ON e.id = bi.equipment_id
        WHERE bi.booking_id IN (${bIds})
      `);
    }

    const formatted = bookings.map((b: any) => ({
      ...b,
      items: allItems
        .filter((item: any) => item.booking_id === b.id)
        .map((item: any) => ({
          booking_id: item.booking_id,
          equipment_id: item.equipment_id,
          quantity: item.quantity,
          returned_quantity: item.returned_quantity,
          equipment_name: item.equipment_name,
          equipment_sku: item.equipment_sku,
        })),
    }));

    return NextResponse.json({
      success: true,
      bookings: formatted,
    });
  } catch (error: any) {
    console.error('[API /api/inventory/bookings GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, unitId, startDate, endDate, purpose, items } = body;

    if (!startDate || !endDate || !purpose || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Start date, end date, purpose, and at least 1 item are required' },
        { status: 400 }
      );
    }

    // Resolve user ID
    let requesterId = userId;
    if (!requesterId) {
      const adminRes = await query(`SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1`);
      requesterId = adminRes[0]?.id;
    }

    // 1. Insert booking
    const insertBooking = await query(`
      INSERT INTO bookings (user_id, unit_id, start_date, end_date, purpose, status)
      VALUES (@uid, @unitId, @start, @end, @purpose, 'pending')
      RETURNING id
    `, [
      { name: 'uid', type: sql.UniqueIdentifier, value: requesterId },
      { name: 'unitId', type: sql.Int, value: unitId ? Number(unitId) : null },
      { name: 'start', type: sql.Date, value: startDate },
      { name: 'end', type: sql.Date, value: endDate },
      { name: 'purpose', type: sql.NVarChar(255), value: purpose },
    ]);

    const bookingId = insertBooking[0]?.id;

    // 2. Insert booking items
    for (const item of items) {
      await query(`
        INSERT INTO booking_items (booking_id, equipment_id, quantity)
        VALUES (@bid, @eid, @qty)
      `, [
        { name: 'bid', type: sql.UniqueIdentifier, value: bookingId },
        { name: 'eid', type: sql.Int, value: Number(item.equipmentId || item.equipment_id) },
        { name: 'qty', type: sql.Int, value: Number(item.quantity || item.qty) },
      ]);
    }

    // 3. Log to audit_logs
    try {
      await query(`
        INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en, metadata)
        VALUES (@uid, @unitId, 'booking_created', @titleAr, @titleEn, @descAr, @descEn, @meta)
      `, [
        { name: 'uid', type: sql.UniqueIdentifier, value: requesterId },
        { name: 'unitId', type: sql.Int, value: unitId ? Number(unitId) : null },
        { name: 'titleAr', type: sql.NVarChar(200), value: 'طلب حجز مهمات عهدة' },
        { name: 'titleEn', type: sql.NVarChar(200), value: 'Equipment Booking Request' },
        { name: 'descAr', type: sql.NVarChar(sql.MAX), value: `تم تقديم طلب استعارة ${items.length} أصناف عهدة (${purpose})` },
        { name: 'descEn', type: sql.NVarChar(sql.MAX), value: `Submitted request for ${items.length} gear items (${purpose})` },
        { name: 'meta', type: sql.NVarChar(sql.MAX), value: JSON.stringify({ booking_id: bookingId, items_count: items.length }) },
      ]);
    } catch (e) {
      console.warn('[Audit Log Warning]:', e);
    }

    return NextResponse.json({
      success: true,
      bookingId,
      message: 'Booking created successfully in ScoutsDB',
    });
  } catch (error: any) {
    console.error('[API /api/inventory/bookings POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, status, approverId } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, error: 'bookingId and status are required' },
        { status: 400 }
      );
    }

    let apprId = approverId;
    if (!apprId && status === 'approved') {
      const qm = await query(`SELECT id FROM users WHERE email = 'ihab.fawzy@scouts.org' OR email = 'admin@scouts.org' LIMIT 1`);
      apprId = qm[0]?.id;
    }

    await query(`
      UPDATE bookings
      SET status = @status,
          approved_by = COALESCE(@apprId, approved_by)
      WHERE id = @bid
    `, [
      { name: 'status', type: sql.NVarChar(30), value: status },
      { name: 'apprId', type: sql.UniqueIdentifier, value: apprId || null },
      { name: 'bid', type: sql.UniqueIdentifier, value: bookingId },
    ]);

    // Log action to audit_logs
    try {
      await query(`
        INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en, metadata)
        VALUES (@uid, NULL, @actType, @titleAr, @titleEn, @descAr, @descEn, @meta)
      `, [
        { name: 'uid', type: sql.UniqueIdentifier, value: apprId },
        { name: 'actType', type: sql.NVarChar(50), value: `booking_${status}` },
        { name: 'titleAr', type: sql.NVarChar(200), value: `تحديث حالة طلب العهدة (${status})` },
        { name: 'titleEn', type: sql.NVarChar(200), value: `Booking Status Updated (${status})` },
        { name: 'descAr', type: sql.NVarChar(sql.MAX), value: `تم تعديل حالة الحجز إلى ${status}` },
        { name: 'descEn', type: sql.NVarChar(sql.MAX), value: `Booking status changed to ${status}` },
        { name: 'meta', type: sql.NVarChar(sql.MAX), value: JSON.stringify({ booking_id: bookingId, status }) },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Booking updated to ${status} in ScoutsDB`,
    });
  } catch (error: any) {
    console.error('[API /api/inventory/bookings PUT] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update booking' },
      { status: 500 }
    );
  }
}
