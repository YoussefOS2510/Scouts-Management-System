import { NextRequest, NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 1. Fetch categories
    const categories = await query(`SELECT id, name FROM equipment_categories ORDER BY id ASC`);

    // 2. Fetch equipment items
    const equipment = await query(`
      SELECT 
        e.id,
        e.category_id,
        e.name,
        e.sku,
        e.total_quantity,
        e.storage_bay,
        e.condition,
        e.created_at,
        c.name AS category_name
      FROM equipment e
      LEFT JOIN equipment_categories c ON c.id = e.category_id
      ORDER BY e.category_id ASC, e.name ASC
    `);

    // 3. If date range supplied, compute reserved quantities
    let bookedQuantities: Record<number, number> = {};
    if (startDate && endDate) {
      const activeBookings = await query(`
        SELECT bi.equipment_id, SUM(bi.quantity) AS reserved_qty
        FROM booking_items bi
        JOIN bookings b ON b.id = bi.booking_id
        WHERE b.status IN ('approved', 'checked_out')
          AND b.start_date <= @endDate
          AND b.end_date >= @startDate
        GROUP BY bi.equipment_id
      `, [
        { name: 'startDate', type: sql.Date, value: startDate },
        { name: 'endDate', type: sql.Date, value: endDate },
      ]);

      for (const row of activeBookings) {
        bookedQuantities[row.equipment_id] = row.reserved_qty;
      }
    }

    const itemsWithAvailability = equipment.map((item: any) => {
      const reserved = bookedQuantities[item.id] || 0;
      return {
        ...item,
        available_quantity: Math.max(0, item.total_quantity - reserved),
        reserved_quantity: reserved,
      };
    });

    return NextResponse.json({
      success: true,
      categories,
      equipment: itemsWithAvailability,
    });
  } catch (error: any) {
    console.error('[API /api/inventory GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, name, sku, totalQuantity, storageBay, condition } = body;

    if (!name || totalQuantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name and totalQuantity are required' },
        { status: 400 }
      );
    }

    const res = await query(`
      INSERT INTO equipment (category_id, name, sku, total_quantity, storage_bay, condition)
      VALUES (@cat, @name, @sku, @qty, @bay, @cond)
      RETURNING id
    `, [
      { name: 'cat', type: sql.Int, value: categoryId || null },
      { name: 'name', type: sql.NVarChar(150), value: name },
      { name: 'sku', type: sql.NVarChar(50), value: sku || `EQ-${Date.now().toString().slice(-4)}` },
      { name: 'qty', type: sql.Int, value: Number(totalQuantity) },
      { name: 'bay', type: sql.NVarChar(100), value: storageBay || 'Bay General' },
      { name: 'cond', type: sql.NVarChar(50), value: condition || 'good' },
    ]);

    return NextResponse.json({
      success: true,
      id: res[0]?.id,
      message: 'Equipment item added successfully to ScoutsDB',
    });
  } catch (error: any) {
    console.error('[API /api/inventory POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add equipment' },
      { status: 500 }
    );
  }
}
