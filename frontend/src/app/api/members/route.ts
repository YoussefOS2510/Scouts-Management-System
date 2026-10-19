import { NextRequest, NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

export async function GET() {
  try {
    const [members, patrols] = await Promise.all([
      query(`
        SELECT 
          m.id,
          m.member_code,
          m.unit_id,
          m.patrol_id,
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
        SELECT id, unit_id, name_ar, name_en 
        FROM patrols 
        ORDER BY unit_id, id
      `),
    ]);

    const formattedMembers = members.map((m: any) => ({
      ...m,
      id: String(m.id),
      unit_id: Number(m.unit_id),
      patrol_id: m.patrol_id !== null && m.patrol_id !== undefined ? Number(m.patrol_id) : null,
      is_active: Boolean(m.is_active),
    }));

    const formattedPatrols = patrols.map((p: any) => ({
      id: Number(p.id),
      unit_id: Number(p.unit_id),
      name_ar: p.name_ar,
      name_en: p.name_en,
    }));

    return NextResponse.json({
      success: true,
      members: formattedMembers,
      patrols: formattedPatrols,
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
    const body = await req.json();
    const {
      full_name_ar,
      full_name_en,
      unit_id,
      patrol_id,
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

    const insertResult = await query(
      `
      INSERT INTO dbo.members (
        member_code,
        pin_hash,
        unit_id,
        patrol_id,
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
    const body = await req.json();
    const { action, memberId, patrolId } = body;

    if (action === 'assign_patrol') {
      if (!memberId) {
        return NextResponse.json({ success: false, error: 'Missing memberId' }, { status: 400 });
      }

      const cleanPatrolId = patrolId !== null && patrolId !== undefined && patrolId !== 'none' ? Number(patrolId) : null;

      await query(
        `
        UPDATE dbo.members
        SET patrol_id = @patrolId, updated_at = SYSUTCDATETIME()
        WHERE id = @memberId;
        `,
        {
          memberId: { type: sql.UniqueIdentifier, value: memberId },
          patrolId: { type: sql.Int, value: cleanPatrolId },
        }
      );

      return NextResponse.json({ success: true, memberId, patrolId: cleanPatrolId });
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
