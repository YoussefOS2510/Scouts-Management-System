import { NextRequest, NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get('unitId');

    let patrols;
    if (unitId) {
      patrols = await query(
        `SELECT id, unit_id, name_ar, name_en, order_index
         FROM patrols
         WHERE unit_id = @unit_id
         ORDER BY order_index ASC, id ASC`,
        { unit_id: { type: sql.Int, value: Number(unitId) } }
      );
    } else {
      patrols = await query(
        `SELECT id, unit_id, name_ar, name_en, order_index
         FROM patrols
         ORDER BY unit_id, order_index ASC, id ASC`
      );
    }

    const formatted = patrols.map((p: any) => ({
      id: Number(p.id),
      unit_id: Number(p.unit_id),
      name_ar: p.name_ar,
      name_en: p.name_en,
      order_index: Number(p.order_index ?? 0),
    }));

    return NextResponse.json({ success: true, patrols: formatted });
  } catch (error: any) {
    console.error('Error fetching patrols:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database fetch error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { unit_id, name_ar, name_en } = body;

    if (!unit_id || !name_ar?.trim()) {
      return NextResponse.json(
        { success: false, error: 'unit_id and name_ar are required' },
        { status: 400 }
      );
    }

    // Determine next order_index in this unit
    const orderRes = await query(
      `SELECT COALESCE(MAX(order_index), -1) + 1 AS next_order FROM patrols WHERE unit_id = @unit_id`,
      { unit_id: { type: sql.Int, value: Number(unit_id) } }
    );
    const nextOrder = Number(orderRes[0]?.next_order ?? 0);

    const inserted = await query(
      `INSERT INTO patrols (unit_id, name_ar, name_en, order_index)
       VALUES (@unit_id, @name_ar, @name_en, @order_index)
       RETURNING id, unit_id, name_ar, name_en, order_index`,
      {
        unit_id: { type: sql.Int, value: Number(unit_id) },
        name_ar: { type: sql.NVarChar(100), value: name_ar.trim() },
        name_en: { type: sql.NVarChar(100), value: name_en?.trim() || null },
        order_index: { type: sql.Int, value: nextOrder },
      }
    );

    const newPatrol = {
      id: Number(inserted[0].id),
      unit_id: Number(inserted[0].unit_id),
      name_ar: inserted[0].name_ar,
      name_en: inserted[0].name_en,
      order_index: Number(inserted[0].order_index),
    };

    // Audit log
    try {
      await query(
        `INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en)
         VALUES (
           (SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1),
           @unit_id,
           'patrol_created',
           'إضافة طليعة جديدة',
           'New Patrol Created',
           CONCAT('تم إنشاء طليعة جديدة: ', @name_ar),
           CONCAT('Created new patrol: ', @name_ar)
         )`,
        {
          unit_id: { type: sql.Int, value: Number(unit_id) },
          name_ar: { type: sql.NVarChar(100), value: newPatrol.name_ar },
        }
      );
    } catch {}

    return NextResponse.json({ success: true, patrol: newPatrol });
  } catch (error: any) {
    console.error('Error creating patrol:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database insert error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'reorder') {
      const { unit_id, ordered_ids } = body;
      if (!unit_id || !Array.isArray(ordered_ids)) {
        return NextResponse.json(
          { success: false, error: 'unit_id and ordered_ids array are required for reordering' },
          { status: 400 }
        );
      }

      if (ordered_ids.length > 0) {
        const cases = ordered_ids
          .map((id: any, index: number) => `WHEN id = ${Number(id)} THEN ${index}`)
          .join(' ');
        const idList = ordered_ids.map((id: any) => Number(id)).join(',');

        await query(
          `UPDATE patrols 
           SET order_index = CASE ${cases} END 
           WHERE id IN (${idList}) AND unit_id = @unit_id`,
          { unit_id: { type: sql.Int, value: Number(unit_id) } }
        );
      }

      try {
        await query(
          `INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en)
           VALUES (
             (SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1),
             @unit_id,
             'patrol_reordered',
             'إعادة ترتيب الطلائع',
             'Patrols Reordered',
             'تم تحديث ترتيب ظهور طلائع الوحدة',
             'Updated display order of patrols'
           )`,
          { unit_id: { type: sql.Int, value: Number(unit_id) } }
        );
      } catch {}

      return NextResponse.json({ success: true, ordered_ids });
    }

    // Default PUT: update patrol name
    const { id, name_ar, name_en } = body;
    if (!id || !name_ar?.trim()) {
      return NextResponse.json(
        { success: false, error: 'id and name_ar are required' },
        { status: 400 }
      );
    }

    const updated = await query(
      `UPDATE patrols
       SET name_ar = @name_ar, name_en = @name_en
       WHERE id = @id
       RETURNING id, unit_id, name_ar, name_en, order_index`,
      {
        id: { type: sql.Int, value: Number(id) },
        name_ar: { type: sql.NVarChar(100), value: name_ar.trim() },
        name_en: { type: sql.NVarChar(100), value: name_en?.trim() || null },
      }
    );

    if (updated.length === 0) {
      return NextResponse.json({ success: false, error: 'Patrol not found' }, { status: 404 });
    }

    const patrol = {
      id: Number(updated[0].id),
      unit_id: Number(updated[0].unit_id),
      name_ar: updated[0].name_ar,
      name_en: updated[0].name_en,
      order_index: Number(updated[0].order_index),
    };

    try {
      await query(
        `INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en)
         VALUES (
           (SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1),
           @unit_id,
           'patrol_updated',
           'تعديل بيانات الطليعة',
           'Patrol Updated',
           CONCAT('تم تعديل اسم الطليعة إلى: ', @name_ar),
           CONCAT('Updated patrol name to: ', @name_ar)
         )`,
        {
          unit_id: { type: sql.Int, value: patrol.unit_id },
          name_ar: { type: sql.NVarChar(100), value: patrol.name_ar },
        }
      );
    } catch {}

    return NextResponse.json({ success: true, patrol });
  } catch (error: any) {
    console.error('Error updating patrol:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database update error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let patrolId = searchParams.get('id');

    if (!patrolId) {
      try {
        const body = await req.json();
        patrolId = body.id;
      } catch {}
    }

    if (!patrolId) {
      return NextResponse.json({ success: false, error: 'patrol id is required' }, { status: 400 });
    }

    const existing = await query(
      `SELECT id, unit_id, name_ar, name_en FROM patrols WHERE id = @id`,
      { id: { type: sql.Int, value: Number(patrolId) } }
    );

    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: 'Patrol not found' }, { status: 404 });
    }

    const p = existing[0];

    // Unassign members from this patrol
    await query(
      `UPDATE members SET patrol_id = NULL WHERE patrol_id = @id`,
      { id: { type: sql.Int, value: Number(patrolId) } }
    );

    // Delete patrol
    await query(
      `DELETE FROM patrols WHERE id = @id`,
      { id: { type: sql.Int, value: Number(patrolId) } }
    );

    // Audit log
    try {
      await query(
        `INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en)
         VALUES (
           (SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1),
           @unit_id,
           'patrol_deleted',
           'حذف طليعة',
           'Patrol Deleted',
           CONCAT('تم حذف طليعة: ', @name_ar),
           CONCAT('Deleted patrol: ', @name_ar)
         )`,
        {
          unit_id: { type: sql.Int, value: Number(p.unit_id) },
          name_ar: { type: sql.NVarChar(100), value: p.name_ar },
        }
      );
    } catch {}

    return NextResponse.json({ success: true, id: Number(patrolId) });
  } catch (error: any) {
    console.error('Error deleting patrol:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database delete error' },
      { status: 500 }
    );
  }
}

