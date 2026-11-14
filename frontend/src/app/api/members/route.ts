import { NextRequest, NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

let roleSchemaEnsured = false;
async function ensureMemberRoleSchema() {
  if (roleSchemaEnsured) return;
  try {
    await query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS patrol_role VARCHAR(100);`);
    await query(`
      CREATE TABLE IF NOT EXISTS unit_custom_roles (
        id SERIAL PRIMARY KEY,
        unit_id INT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
        role_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_id, role_name)
      );
    `);
    roleSchemaEnsured = true;
  } catch (err) {
    console.error('Failed to ensure patrol_role schema:', err);
  }
}

export async function GET() {
  try {
    await ensureMemberRoleSchema();

    const [members, patrols, customRoles] = await Promise.all([
      query(`
        SELECT 
          m.id,
          m.member_code,
          m.unit_id,
          m.patrol_id,
          m.patrol_role,
          m.full_name_ar,
          m.full_name_en,
          TO_CHAR(m.date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
          m.member_phone,
          m.father_phone,
          m.mother_phone,
          m.address_ar,
          m.address_en,
          m.school_or_college,
          m.academic_year,
          m.sunday_school_class,
          m.father_of_confession,
          m.notes,
          m.has_missing_data,
          m.missing_fields,
          m.school_or_college_en,
          m.sunday_school_class_en,
          m.academic_year_en,
          m.is_active,
          u.name_ar AS unit_name_ar,
          u.name_en AS unit_name_en,
          p.name_ar AS patrol_name_ar,
          p.name_en AS patrol_name_en
        FROM members m
        LEFT JOIN units u ON m.unit_id = u.id
        LEFT JOIN patrols p ON m.patrol_id = p.id
        ORDER BY m.created_at DESC
      `),
      query(`
        SELECT id, unit_id, name_ar, name_en, order_index
        FROM patrols 
        ORDER BY unit_id, order_index ASC, id ASC
      `),
      query(`
        SELECT unit_id, role_name
        FROM unit_custom_roles
        ORDER BY unit_id ASC, id ASC
      `),
    ]);

    const formattedMembers = members.map((m: any) => ({
      ...m,
      id: String(m.id),
      unit_id: Number(m.unit_id),
      patrol_id: m.patrol_id !== null && m.patrol_id !== undefined ? Number(m.patrol_id) : null,
      patrol_role: m.patrol_role || null,
      is_active: Boolean(m.is_active),
      has_missing_data: Boolean(m.has_missing_data),
      missing_fields: m.missing_fields || '',
    }));

    const formattedPatrols = patrols.map((p: any) => ({
      id: Number(p.id),
      unit_id: Number(p.unit_id),
      name_ar: p.name_ar,
      name_en: p.name_en,
      order_index: Number(p.order_index ?? 0),
    }));

    const customRolesByUnit: Record<number, string[]> = {};
    for (const row of customRoles) {
      const uid = Number(row.unit_id);
      if (!customRolesByUnit[uid]) customRolesByUnit[uid] = [];
      if (row.role_name && !customRolesByUnit[uid].includes(row.role_name)) {
        customRolesByUnit[uid].push(row.role_name);
      }
    }

    return NextResponse.json({
      success: true,
      members: formattedMembers,
      patrols: formattedPatrols,
      customRolesByUnit,
    });
  } catch (error: any) {
    console.error('Error fetching members from ScoutsDB:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureMemberRoleSchema();

    const body = await req.json();
    const {
      full_name_ar,
      full_name_en,
      unit_id,
      patrol_id,
      patrol_role,
      date_of_birth,
      member_phone,
      father_phone,
      mother_phone,
      address_ar,
      address_en,
      school_or_college,
      academic_year,
      sunday_school_class,
      father_of_confession,
      notes,
    } = body;

    if (!full_name_ar || !unit_id || !father_phone || !address_ar || !academic_year) {
      return NextResponse.json(
        { success: false, error: 'Missing required member fields' },
        { status: 400 }
      );
    }

    // Auto-generate unique member code: SCT-2026-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const memberCode = body.member_code || `SCT-2026-${randomSuffix}`;
    const cleanPatrolRole = patrol_role && String(patrol_role).trim() !== '' && patrol_role !== 'none'
      ? String(patrol_role).trim()
      : null;

    const insertResult = await query(
      `
      INSERT INTO dbo.members (
        member_code,
        pin_hash,
        unit_id,
        patrol_id,
        patrol_role,
        full_name_ar,
        full_name_en,
        date_of_birth,
        member_phone,
        father_phone,
        mother_phone,
        address_ar,
        address_en,
        school_or_college,
        academic_year,
        sunday_school_class,
        father_of_confession,
        notes,
        is_active
      )
      VALUES (
        @member_code,
        '1234',
        @unit_id,
        @patrol_id,
        @patrol_role,
        @full_name_ar,
        @full_name_en,
        @date_of_birth,
        @member_phone,
        @father_phone,
        @mother_phone,
        @address_ar,
        @address_en,
        @school_or_college,
        @academic_year,
        @sunday_school_class,
        @father_of_confession,
        @notes,
        true
      )
      RETURNING 
        id,
        member_code,
        unit_id,
        patrol_id,
        patrol_role,
        full_name_ar,
        full_name_en,
        date_of_birth,
        member_phone,
        father_phone,
        mother_phone,
        address_ar,
        address_en,
        school_or_college,
        academic_year,
        sunday_school_class,
        father_of_confession,
        notes,
        is_active;
      `,
      {
        member_code: { type: sql.NVarChar(50), value: memberCode },
        unit_id: { type: sql.Int, value: Number(unit_id) },
        patrol_id: { type: sql.Int, value: patrol_id && patrol_id !== 'none' ? Number(patrol_id) : null },
        patrol_role: { type: sql.NVarChar(100), value: cleanPatrolRole },
        full_name_ar: { type: sql.NVarChar(255), value: full_name_ar.trim() },
        full_name_en: { type: sql.NVarChar(255), value: (full_name_en || '').trim() || null },
        date_of_birth: { type: sql.Date, value: date_of_birth || '2015-01-01' },
        member_phone: { type: sql.NVarChar(20), value: member_phone || null },
        father_phone: { type: sql.NVarChar(20), value: father_phone.trim() },
        mother_phone: { type: sql.NVarChar(20), value: mother_phone || null },
        address_ar: { type: sql.NVarChar(sql.MAX), value: address_ar.trim() },
        address_en: { type: sql.NVarChar(sql.MAX), value: address_en || null },
        school_or_college: { type: sql.NVarChar(200), value: school_or_college || null },
        academic_year: { type: sql.NVarChar(100), value: academic_year.trim() },
        sunday_school_class: { type: sql.NVarChar(150), value: sunday_school_class || null },
        father_of_confession: { type: sql.NVarChar(150), value: father_of_confession || null },
        notes: { type: sql.NVarChar(sql.MAX), value: notes || null },
      }
    );

    const created = insertResult[0];

    // Optional audit log write
    try {
      await query(
        `
        INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en)
        VALUES (
          (SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1),
          @unit_id,
          'member_created',
          'إضافة عضو كشفي جديد',
          'New Scout Registered',
          CONCAT('تم تسجيل الكشاف ', @name_ar, ' بالمنظومة'),
          CONCAT('Registered scout ', @name_ar, ' in database')
        )
        `,
        {
          unit_id: { type: sql.Int, value: Number(unit_id) },
          name_ar: { type: sql.NVarChar(255), value: full_name_ar },
        }
      );
    } catch {}

    return NextResponse.json({
      success: true,
      member: {
        ...created,
        id: String(created.id),
        unit_id: Number(created.unit_id),
        patrol_id: created.patrol_id ? Number(created.patrol_id) : null,
        patrol_role: created.patrol_role || null,
      },
    });
  } catch (error: any) {
    console.error('Error inserting member to ScoutsDB:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database insert error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureMemberRoleSchema();

    const body = await req.json();
    const { action, memberId, patrolId } = body;

    if (action === 'assign_patrol' || action === 'batch_assign_patrol') {
      const cleanPatrolId = patrolId !== null && patrolId !== undefined && patrolId !== 'none' ? Number(patrolId) : null;
      const ids: string[] = Array.isArray(body.memberIds)
        ? body.memberIds
        : memberId
        ? [memberId]
        : [];

      if (ids.length === 0) {
        return NextResponse.json({ success: false, error: 'Missing memberId or memberIds' }, { status: 400 });
      }

      // Filter valid UUIDs and batch update in a single query
      const validIds = ids.filter((id) => typeof id === 'string' && /^[0-9a-fA-F-]{36}$/.test(id));
      if (validIds.length > 0) {
        const idPlaceholders = validIds.map((id) => `'${id}'`).join(',');
        await query(
          cleanPatrolId === null
            ? `
              UPDATE members
              SET patrol_id = @patrolId, patrol_role = NULL, updated_at = NOW()
              WHERE id IN (${idPlaceholders});
              `
            : `
              UPDATE members
              SET patrol_id = @patrolId, updated_at = NOW()
              WHERE id IN (${idPlaceholders});
              `,
          {
            patrolId: { type: sql.Int, value: cleanPatrolId },
          }
        );
      }

      return NextResponse.json({ success: true, memberIds: ids, patrolId: cleanPatrolId });
    }

    if (action === 'assign_patrol_role') {
      if (!memberId) {
        return NextResponse.json({ success: false, error: 'Missing memberId' }, { status: 400 });
      }
      if (typeof memberId !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(memberId)) {
        return NextResponse.json({ success: false, error: 'Invalid memberId format' }, { status: 400 });
      }

      const rawRole = body.patrolRole;
      const cleanRole =
        rawRole !== null && rawRole !== undefined && String(rawRole).trim() !== '' && rawRole !== 'none'
          ? String(rawRole).trim()
          : null;

      await query(
        `
        UPDATE members
        SET patrol_role = @patrolRole, updated_at = NOW()
        WHERE id = @memberId;
        `,
        {
          memberId: { type: sql.UniqueIdentifier, value: memberId },
          patrolRole: { type: sql.NVarChar(100), value: cleanRole },
        }
      );

      // Persist custom role in unit_custom_roles if it's not one of the 3 basic roles
      if (cleanRole && !['CP', 'CG', '3rd'].includes(cleanRole)) {
        await query(
          `
          INSERT INTO unit_custom_roles (unit_id, role_name)
          SELECT unit_id, @patrolRole FROM members WHERE id = @memberId
          ON CONFLICT (unit_id, role_name) DO NOTHING;
          `,
          {
            memberId: { type: sql.UniqueIdentifier, value: memberId },
            patrolRole: { type: sql.NVarChar(100), value: cleanRole },
          }
        );
      }

      return NextResponse.json({ success: true, memberId, patrolRole: cleanRole });
    }

    if (action === 'add_unit_custom_role') {
      const unitId = Number(body.unitId);
      const roleName = typeof body.roleName === 'string' ? body.roleName.trim() : '';
      if (!unitId || !roleName) {
        return NextResponse.json({ success: false, error: 'Missing unitId or roleName' }, { status: 400 });
      }

      await query(
        `
        INSERT INTO unit_custom_roles (unit_id, role_name)
        VALUES (@unitId, @roleName)
        ON CONFLICT (unit_id, role_name) DO NOTHING;
        `,
        {
          unitId: { type: sql.Int, value: unitId },
          roleName: { type: sql.NVarChar(100), value: roleName },
        }
      );

      return NextResponse.json({ success: true, unitId, roleName });
    }

    if (action === 'remove_unit_custom_role') {
      const unitId = Number(body.unitId);
      const roleName = typeof body.roleName === 'string' ? body.roleName.trim() : '';
      if (!unitId || !roleName) {
        return NextResponse.json({ success: false, error: 'Missing unitId or roleName' }, { status: 400 });
      }

      await query(
        `
        DELETE FROM unit_custom_roles
        WHERE unit_id = @unitId AND role_name = @roleName;
        `,
        {
          unitId: { type: sql.Int, value: unitId },
          roleName: { type: sql.NVarChar(100), value: roleName },
        }
      );

      return NextResponse.json({ success: true, unitId, roleName });
    }

    if (action === 'update_member') {
      if (!memberId) {
        return NextResponse.json({ success: false, error: 'Missing memberId' }, { status: 400 });
      }

      const {
        full_name_ar,
        full_name_en,
        unit_id,
        patrol_id,
        patrol_role,
        date_of_birth,
        member_phone,
        father_phone,
        mother_phone,
        address_ar,
        school_or_college,
        academic_year,
        father_of_confession,
        notes,
      } = body;

      const missingList: string[] = [];
      if (!father_phone && !mother_phone && !member_phone) missingList.push('phone');
      if (!academic_year) missingList.push('grade');
      const hasMissing = missingList.length > 0;
      const missingStr = hasMissing ? missingList.join(',') : null;
      const cleanPatrol = patrol_id !== null && patrol_id !== undefined && patrol_id !== 'none' ? Number(patrol_id) : null;
      const hasPatrolRoleParam = patrol_role !== undefined;
      const cleanPatrolRole =
        hasPatrolRoleParam && patrol_role !== null && String(patrol_role).trim() !== '' && patrol_role !== 'none'
          ? String(patrol_role).trim()
          : null;

      await query(
        `
        UPDATE members
        SET
          full_name_ar = COALESCE(@full_name_ar, full_name_ar),
          full_name_en = @full_name_en,
          unit_id = COALESCE(@unit_id, unit_id),
          patrol_id = @patrol_id,
          patrol_role = CASE WHEN @update_patrol_role = 1 THEN @patrol_role ELSE patrol_role END,
          date_of_birth = COALESCE(@date_of_birth, date_of_birth),
          member_phone = @member_phone,
          father_phone = @father_phone,
          mother_phone = @mother_phone,
          address_ar = COALESCE(@address_ar, address_ar),
          school_or_college = @school_or_college,
          academic_year = @academic_year,
          father_of_confession = @father_of_confession,
          notes = @notes,
          has_missing_data = @has_missing_data,
          missing_fields = @missing_fields,
          updated_at = NOW()
        WHERE id = @memberId;
        `,
        {
          memberId: { type: sql.UniqueIdentifier, value: memberId },
          full_name_ar: { type: sql.NVarChar, value: full_name_ar || null },
          full_name_en: { type: sql.NVarChar, value: full_name_en || null },
          unit_id: { type: sql.Int, value: unit_id ? Number(unit_id) : null },
          patrol_id: { type: sql.Int, value: cleanPatrol },
          update_patrol_role: { type: sql.Bit, value: hasPatrolRoleParam ? 1 : 0 },
          patrol_role: { type: sql.NVarChar(100), value: cleanPatrolRole },
          date_of_birth: { type: sql.Date, value: date_of_birth || null },
          member_phone: { type: sql.NVarChar, value: member_phone || null },
          father_phone: { type: sql.NVarChar, value: father_phone || null },
          mother_phone: { type: sql.NVarChar, value: mother_phone || null },
          address_ar: { type: sql.NVarChar, value: address_ar || null },
          school_or_college: { type: sql.NVarChar, value: school_or_college || null },
          academic_year: { type: sql.NVarChar, value: academic_year || null },
          father_of_confession: { type: sql.NVarChar, value: father_of_confession || null },
          notes: { type: sql.NVarChar, value: notes || null },
          has_missing_data: { type: sql.Bit, value: hasMissing ? 1 : 0 },
          missing_fields: { type: sql.NVarChar, value: missingStr },
        }
      );

      return NextResponse.json({
        success: true,
        memberId,
        has_missing_data: hasMissing,
        missing_fields: missingStr,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating member in ScoutsDB:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database update error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    let memberId: string | null = null;

    // Support both URL search param (?id=...) and JSON body ({ memberId: ... })
    const { searchParams } = new URL(req.url);
    const paramId = searchParams.get('id') || searchParams.get('memberId');

    if (paramId) {
      memberId = paramId;
    } else {
      try {
        const body = await req.json();
        memberId = body.memberId || body.id;
      } catch {}
    }

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: 'Missing memberId to delete' },
        { status: 400 }
      );
    }

    // 1. Fetch member details first for audit logging
    const existing = await query(
      `SELECT id, member_code, full_name_ar, unit_id FROM members WHERE id = @memberId`,
      { memberId: { type: sql.UniqueIdentifier, value: memberId } }
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    const member = existing[0];

    // 2. Cascading deletion of related records
    // Remove attendance records
    await query(
      `DELETE FROM attendance_records WHERE member_id = @memberId`,
      { memberId: { type: sql.UniqueIdentifier, value: memberId } }
    );

    // Remove unit progression history
    await query(
      `DELETE FROM member_unit_history WHERE member_id = @memberId`,
      { memberId: { type: sql.UniqueIdentifier, value: memberId } }
    );

    // Remove member record
    await query(
      `DELETE FROM members WHERE id = @memberId`,
      { memberId: { type: sql.UniqueIdentifier, value: memberId } }
    );

    // 3. Optional audit log write
    try {
      await query(
        `
        INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en)
        VALUES (
          (SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1),
          @unit_id,
          'member_deleted',
          'حذف عضو كشفي',
          'Scout Member Deleted',
          CONCAT('تم حذف الكشاف ', @name_ar, ' [', @code, '] نهائياً من المنظومة'),
          CONCAT('Permanently deleted scout ', @name_ar, ' [', @code, '] from system')
        )
        `,
        {
          unit_id: { type: sql.Int, value: Number(member.unit_id) },
          name_ar: { type: sql.NVarChar(255), value: member.full_name_ar },
          code: { type: sql.NVarChar(50), value: member.member_code },
        }
      );
    } catch {}

    return NextResponse.json({
      success: true,
      memberId,
      message: `Member ${member.full_name_ar} successfully deleted`,
    });
  } catch (error: any) {
    console.error('Error deleting member from ScoutsDB:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database delete error' },
      { status: 500 }
    );
  }
}
