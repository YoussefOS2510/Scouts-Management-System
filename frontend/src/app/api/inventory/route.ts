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
      RETURNING id, category_id, name, sku, total_quantity, storage_bay, condition
    `, [
      { name: 'cat', type: sql.Int, value: categoryId ? Number(categoryId) : null },
      { name: 'name', type: sql.NVarChar(150), value: name.trim() },
      { name: 'sku', type: sql.NVarChar(50), value: sku ? sku.trim() : `EQ-${Date.now().toString().slice(-4)}` },
      { name: 'qty', type: sql.Int, value: Number(totalQuantity) },
      { name: 'bay', type: sql.NVarChar(100), value: storageBay ? storageBay.trim() : 'المخزن العام' },
      { name: 'cond', type: sql.NVarChar(50), value: condition || 'good' },
    ]);

    const createdItem = res[0];

    // Log to audit_logs
    try {
      await query(`
        INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en)
        VALUES (
          (SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1),
          NULL,
          'equipment_created',
          'إضافة مهمة عهدة جديدة',
          'New Equipment Added',
          CONCAT('تم تسجيل مهمة العهدة (', @name, ') برصيد إجمالي ', @qty, ' قطعة'),
          CONCAT('Registered new gear item (', @name, ') with total stock ', @qty)
        )
      `, [
        { name: 'name', type: sql.NVarChar(150), value: name.trim() },
        { name: 'qty', type: sql.Int, value: Number(totalQuantity) },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      equipment: createdItem,
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, categoryId, name, sku, totalQuantity, storageBay, condition } = body;

    if (!id || !name || totalQuantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'id, name, and totalQuantity are required' },
        { status: 400 }
      );
    }

    const res = await query(`
      UPDATE equipment
      SET category_id = @cat,
          name = @name,
          sku = @sku,
          total_quantity = @qty,
          storage_bay = @bay,
          condition = @cond
      WHERE id = @id
      RETURNING id, category_id, name, sku, total_quantity, storage_bay, condition
    `, [
      { name: 'id', type: sql.Int, value: Number(id) },
      { name: 'cat', type: sql.Int, value: categoryId ? Number(categoryId) : null },
      { name: 'name', type: sql.NVarChar(150), value: name.trim() },
      { name: 'sku', type: sql.NVarChar(50), value: sku ? sku.trim() : `EQ-${id}` },
      { name: 'qty', type: sql.Int, value: Number(totalQuantity) },
      { name: 'bay', type: sql.NVarChar(100), value: storageBay ? storageBay.trim() : 'المخزن العام' },
      { name: 'cond', type: sql.NVarChar(50), value: condition || 'good' },
    ]);

    if (res.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Equipment item not found' },
        { status: 404 }
      );
    }

    // Log to audit_logs
    try {
      await query(`
        INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en)
        VALUES (
          (SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1),
          NULL,
          'equipment_updated',
          'تعديل بيانات صنف عهدة',
          'Equipment Updated',
          CONCAT('تم تعديل مهمة العهدة (', @name, ') وتحديث بياناتها والرصيد'),
          CONCAT('Updated gear item (', @name, ')')
        )
      `, [
        { name: 'name', type: sql.NVarChar(150), value: name.trim() },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      equipment: res[0],
      message: 'Equipment item updated successfully in ScoutsDB',
    });
  } catch (error: any) {
    console.error('[API /api/inventory PUT] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update equipment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    let id: number | null = null;
    const { searchParams } = new URL(request.url);
    const paramId = searchParams.get('id');

    if (paramId) {
      id = Number(paramId);
    } else {
      try {
        const body = await request.json();
        id = Number(body.id);
      } catch {}
    }

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Valid equipment id is required' },
        { status: 400 }
      );
    }

    // 1. Get equipment details for audit log
    const existing = await query(`SELECT id, name, sku FROM equipment WHERE id = @id`, [
      { name: 'id', type: sql.Int, value: id },
    ]);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Equipment item not found' },
        { status: 404 }
      );
    }

    const equip = existing[0];

    // 2. Cascading deletion of booking_items referencing this equipment
    await query(`DELETE FROM booking_items WHERE equipment_id = @id`, [
      { name: 'id', type: sql.Int, value: id },
    ]);

    // 3. Delete the equipment item
    await query(`DELETE FROM equipment WHERE id = @id`, [
      { name: 'id', type: sql.Int, value: id },
    ]);

    // 4. Log to audit_logs
    try {
      await query(`
        INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en)
        VALUES (
          (SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1),
          NULL,
          'equipment_deleted',
          'حذف صنف من العهدة',
          'Equipment Deleted',
          CONCAT('تم حذف مهمة العهدة (', @name, ') [', @sku, '] نهائياً من المنظومة'),
          CONCAT('Permanently deleted gear item (', @name, ') [', @sku, '] from inventory')
        )
      `, [
        { name: 'name', type: sql.NVarChar(150), value: equip.name },
        { name: 'sku', type: sql.NVarChar(50), value: equip.sku },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      id,
      message: `Equipment item ${equip.name} successfully deleted from ScoutsDB`,
    });
  } catch (error: any) {
    console.error('[API /api/inventory DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete equipment' },
      { status: 500 }
    );
  }
}
