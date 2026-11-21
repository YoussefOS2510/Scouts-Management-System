import { NextRequest, NextResponse } from 'next/server';
import { query, sql } from '@/lib/db';

const MEMBER_RETURNING_COLUMNS = `
  id,
  member_code,
  unit_id,
  patrol_id,
  patrol_role,
  full_name_ar,
  full_name_en,
  TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
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
  has_missing_data,
  missing_fields,
  school_or_college_en,
  sunday_school_class_en,
  academic_year_en,
  is_active
`;

function toNullIfBlank(val: any): string | null {
  if (val === null || val === undefined) return null;
  const trimmed = String(val).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatMemberRow(m: any) {
  return {
    ...m,
    id: String(m.id),
    unit_id: Number(m.unit_id),
    patrol_id: m.patrol_id !== null && m.patrol_id !== undefined ? Number(m.patrol_id) : null,
    patrol_role: m.patrol_role || null,
    school_or_college_en: m.school_or_college_en || null,
    sunday_school_class_en: m.sunday_school_class_en || null,
    academic_year_en: m.academic_year_en || null,
    is_active: Boolean(m.is_active),
    has_missing_data: Boolean(m.has_missing_data),
    missing_fields: m.missing_fields || '',
  };
}

function computeMissingMemberFields(
  fields: {
    fatherPhone: string | null;
    motherPhone?: string | null;
    memberPhone?: string | null;
    addressAr: string | null;
    academicYear: string | null;
    schoolOrCollege: string | null;
    fatherOfConfession: string | null;
  },
  includeAltPhones: boolean
): { hasMissingData: boolean; missingFields: string } {
  const missing: string[] = [];
  const hasPhone = includeAltPhones
    ? Boolean(fields.fatherPhone || fields.motherPhone || fields.memberPhone)
    : Boolean(fields.fatherPhone);
  if (!hasPhone) missing.push('تليفون الاب');
  if (!fields.addressAr) missing.push('العنوان');
  if (!fields.academicYear) missing.push('السنة الدراسية');
  if (!fields.schoolOrCollege) missing.push('المدرسة / الكلية');
  if (!fields.fatherOfConfession) missing.push('اب الاعتراف');
  return {
    hasMissingData: missing.length > 0,
    missingFields: missing.join(', '),
  };
}

export async function GET() {
  try {
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

    const formattedMembers = members.map(formatMemberRow);

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
      school_or_college_en,
      academic_year,
      academic_year_en,
      sunday_school_class,
      sunday_school_class_en,
      father_of_confession,
      notes,
    } = body;

    const cleanNameAr = typeof full_name_ar === 'string' ? full_name_ar.trim() : '';
    const cleanUnitId = Number(unit_id);

    if (!cleanNameAr || !cleanUnitId || isNaN(cleanUnitId) || cleanUnitId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required member fields (full_name_ar, unit_id)' },
        { status: 400 }
      );
    }

    const cleanNameEn = toNullIfBlank(full_name_en);
    const cleanDob = toNullIfBlank(date_of_birth);
    const cleanMemberPhone = toNullIfBlank(member_phone);
    const cleanFatherPhone = toNullIfBlank(father_phone);
    const cleanMotherPhone = toNullIfBlank(mother_phone);
    const cleanAddressAr = toNullIfBlank(address_ar);
    const cleanAddressEn = toNullIfBlank(address_en);
    const cleanSchool = toNullIfBlank(school_or_college);
    const cleanSchoolEn = toNullIfBlank(school_or_college_en);
    const cleanAcademicYear = toNullIfBlank(academic_year);
    const cleanAcademicYearEn = toNullIfBlank(academic_year_en);
    const cleanSundaySchool = toNullIfBlank(sunday_school_class);
    const cleanSundaySchoolEn = toNullIfBlank(sunday_school_class_en);
    const cleanConfession = toNullIfBlank(father_of_confession);
    const cleanNotes = toNullIfBlank(notes);
    const cleanPin = toNullIfBlank(body.pin) || '1234';
    let cleanPatrolId =
      patrol_id !== null &&
      patrol_id !== undefined &&
      patrol_id !== 'none' &&
      patrol_id !== '' &&
      !isNaN(Number(patrol_id))
        ? Number(patrol_id)
        : null;
    if (cleanPatrolId !== null) {
      const validPatrolRows = await query(
        `SELECT id FROM patrols WHERE id = @patrol_id AND unit_id = @unit_id LIMIT 1;`,
        {
          patrol_id: { type: sql.Int, value: cleanPatrolId },
          unit_id: { type: sql.Int, value: cleanUnitId },
        }
      );
      if (validPatrolRows.length === 0) {
        cleanPatrolId = null;
      }
    }
    const cleanPatrolRole =
      patrol_role && String(patrol_role).trim() !== '' && patrol_role !== 'none'
        ? String(patrol_role).trim()
        : null;

    const computedMissing = computeMissingMemberFields(
      {
        fatherPhone: cleanFatherPhone,
        addressAr: cleanAddressAr,
        academicYear: cleanAcademicYear,
        schoolOrCollege: cleanSchool,
        fatherOfConfession: cleanConfession,
      },
      false
    );
    const hasMissingData =
      typeof body.has_missing_data === 'boolean'
        ? body.has_missing_data
        : computedMissing.hasMissingData;
    const missingFieldsStr =
      body.missing_fields !== undefined && body.missing_fields !== null
        ? Array.isArray(body.missing_fields)
          ? body.missing_fields.join(', ')
          : String(body.missing_fields)
        : computedMissing.missingFields;

    // Auto-generate unique member code: SCT-2026-XXXX (ensure no collision)
    let memberCode =
      toNullIfBlank(body.member_code) ||
      `SCT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const existingCodeRows = await query(
      `SELECT 1 FROM members WHERE member_code = @member_code LIMIT 1;`,
      { member_code: { type: sql.NVarChar(50), value: memberCode } }
    );
    if (existingCodeRows.length > 0) {
      memberCode = `${memberCode}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const insertResult = await query(
      `
      INSERT INTO members (
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
        school_or_college_en,
        academic_year,
        academic_year_en,
        sunday_school_class,
        sunday_school_class_en,
        father_of_confession,
        notes,
        has_missing_data,
        missing_fields,
        is_active
      )
      VALUES (
        @member_code,
        @pin_hash,
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
        @school_or_college_en,
        @academic_year,
        @academic_year_en,
        @sunday_school_class,
        @sunday_school_class_en,
        @father_of_confession,
        @notes,
        @has_missing_data,
        @missing_fields,
        true
      )
      RETURNING ${MEMBER_RETURNING_COLUMNS};
      `,
      {
        member_code: { type: sql.NVarChar(50), value: memberCode },
        pin_hash: { type: sql.NVarChar(255), value: cleanPin },
        unit_id: { type: sql.Int, value: cleanUnitId },
        patrol_id: { type: sql.Int, value: cleanPatrolId },
        patrol_role: { type: sql.NVarChar(100), value: cleanPatrolRole },
        full_name_ar: { type: sql.NVarChar(255), value: cleanNameAr },
        full_name_en: { type: sql.NVarChar(255), value: cleanNameEn },
        date_of_birth: { type: sql.Date, value: cleanDob },
        member_phone: { type: sql.NVarChar(20), value: cleanMemberPhone },
        father_phone: { type: sql.NVarChar(20), value: cleanFatherPhone },
        mother_phone: { type: sql.NVarChar(20), value: cleanMotherPhone },
        address_ar: { type: sql.NVarChar(sql.MAX), value: cleanAddressAr },
        address_en: { type: sql.NVarChar(sql.MAX), value: cleanAddressEn },
        school_or_college: { type: sql.NVarChar(200), value: cleanSchool },
        school_or_college_en: { type: sql.NVarChar(200), value: cleanSchoolEn },
        academic_year: { type: sql.NVarChar(100), value: cleanAcademicYear },
        academic_year_en: { type: sql.NVarChar(100), value: cleanAcademicYearEn },
        sunday_school_class: { type: sql.NVarChar(150), value: cleanSundaySchool },
        sunday_school_class_en: { type: sql.NVarChar(150), value: cleanSundaySchoolEn },
        father_of_confession: { type: sql.NVarChar(150), value: cleanConfession },
        notes: { type: sql.NVarChar(sql.MAX), value: cleanNotes },
        has_missing_data: { type: sql.Bit, value: hasMissingData },
        missing_fields: { type: sql.NVarChar(sql.MAX), value: missingFieldsStr || null },
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
          unit_id: { type: sql.Int, value: cleanUnitId },
          name_ar: { type: sql.NVarChar(255), value: cleanNameAr },
        }
      );
    } catch {}

    return NextResponse.json({
      success: true,
      member: formatMemberRow(created),
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
        address_en,
        school_or_college,
        school_or_college_en,
        academic_year,
        academic_year_en,
        sunday_school_class,
        sunday_school_class_en,
        father_of_confession,
        notes,
        has_missing_data,
        missing_fields,
      } = body;

      const cleanFatherPhone = toNullIfBlank(father_phone);
      const cleanMotherPhone = toNullIfBlank(mother_phone);
      const cleanMemberPhone = toNullIfBlank(member_phone);
      const cleanAddressAr = toNullIfBlank(address_ar);
      const cleanAcademicYear = toNullIfBlank(academic_year);
      const cleanSchool = toNullIfBlank(school_or_college);
      const cleanConfession = toNullIfBlank(father_of_confession);

      const computedMissing = computeMissingMemberFields(
        {
          fatherPhone: cleanFatherPhone,
          motherPhone: cleanMotherPhone,
          memberPhone: cleanMemberPhone,
          addressAr: cleanAddressAr,
          academicYear: cleanAcademicYear,
          schoolOrCollege: cleanSchool,
          fatherOfConfession: cleanConfession,
        },
        true
      );

      const hasMissing =
        typeof has_missing_data === 'boolean' ? has_missing_data : computedMissing.hasMissingData;
      const missingStr =
        missing_fields !== undefined && missing_fields !== null
          ? (Array.isArray(missing_fields) ? missing_fields.join(', ') : String(missing_fields)).trim() || null
          : hasMissing
          ? computedMissing.missingFields
          : null;

      const hasPatrolIdParam = patrol_id !== undefined;
      const cleanPatrol =
        hasPatrolIdParam && patrol_id !== null && patrol_id !== 'none' && patrol_id !== ''
          ? Number(patrol_id)
          : null;
      const hasPatrolRoleParam = patrol_role !== undefined;
      const cleanPatrolRole =
        hasPatrolRoleParam && patrol_role !== null && String(patrol_role).trim() !== '' && patrol_role !== 'none'
          ? String(patrol_role).trim()
          : null;

      const updateResult = await query(
        `
        UPDATE members
        SET
          full_name_ar = COALESCE(@full_name_ar, full_name_ar),
          full_name_en = @full_name_en,
          unit_id = COALESCE(@unit_id, unit_id),
          patrol_id = CASE WHEN @update_patrol_id = 1 THEN @patrol_id ELSE patrol_id END,
          patrol_role = CASE WHEN @update_patrol_role = 1 THEN @patrol_role ELSE patrol_role END,
          date_of_birth = @date_of_birth,
          member_phone = @member_phone,
          father_phone = @father_phone,
          mother_phone = @mother_phone,
          address_ar = @address_ar,
          address_en = CASE WHEN @update_address_en = 1 THEN @address_en ELSE address_en END,
          school_or_college = @school_or_college,
          school_or_college_en = CASE WHEN @update_school_or_college_en = 1 THEN @school_or_college_en ELSE school_or_college_en END,
          academic_year = @academic_year,
          academic_year_en = CASE WHEN @update_academic_year_en = 1 THEN @academic_year_en ELSE academic_year_en END,
          sunday_school_class = CASE WHEN @update_sunday_school_class = 1 THEN @sunday_school_class ELSE sunday_school_class END,
          sunday_school_class_en = CASE WHEN @update_sunday_school_class_en = 1 THEN @sunday_school_class_en ELSE sunday_school_class_en END,
          father_of_confession = @father_of_confession,
          notes = @notes,
          has_missing_data = @has_missing_data,
          missing_fields = @missing_fields,
          updated_at = NOW()
        WHERE id = @memberId
        RETURNING ${MEMBER_RETURNING_COLUMNS};
        `,
        {
          memberId: { type: sql.UniqueIdentifier, value: memberId },
          full_name_ar: { type: sql.NVarChar, value: toNullIfBlank(full_name_ar) },
          full_name_en: { type: sql.NVarChar, value: toNullIfBlank(full_name_en) },
          unit_id: { type: sql.Int, value: unit_id ? Number(unit_id) : null },
          update_patrol_id: { type: sql.Int, value: hasPatrolIdParam ? 1 : 0 },
          patrol_id: { type: sql.Int, value: cleanPatrol },
          update_patrol_role: { type: sql.Int, value: hasPatrolRoleParam ? 1 : 0 },
          patrol_role: { type: sql.NVarChar(100), value: cleanPatrolRole },
          date_of_birth: { type: sql.Date, value: toNullIfBlank(date_of_birth) },
          member_phone: { type: sql.NVarChar, value: cleanMemberPhone },
          father_phone: { type: sql.NVarChar, value: cleanFatherPhone },
          mother_phone: { type: sql.NVarChar, value: cleanMotherPhone },
          address_ar: { type: sql.NVarChar, value: cleanAddressAr },
          update_address_en: { type: sql.Int, value: address_en !== undefined ? 1 : 0 },
          address_en: { type: sql.NVarChar(sql.MAX), value: toNullIfBlank(address_en) },
          school_or_college: { type: sql.NVarChar, value: cleanSchool },
          update_school_or_college_en: { type: sql.Int, value: school_or_college_en !== undefined ? 1 : 0 },
          school_or_college_en: { type: sql.NVarChar(200), value: toNullIfBlank(school_or_college_en) },
          academic_year: { type: sql.NVarChar, value: cleanAcademicYear },
          update_academic_year_en: { type: sql.Int, value: academic_year_en !== undefined ? 1 : 0 },
          academic_year_en: { type: sql.NVarChar(100), value: toNullIfBlank(academic_year_en) },
          update_sunday_school_class: { type: sql.Int, value: sunday_school_class !== undefined ? 1 : 0 },
          sunday_school_class: { type: sql.NVarChar(150), value: toNullIfBlank(sunday_school_class) },
          update_sunday_school_class_en: { type: sql.Int, value: sunday_school_class_en !== undefined ? 1 : 0 },
          sunday_school_class_en: { type: sql.NVarChar(150), value: toNullIfBlank(sunday_school_class_en) },
          father_of_confession: { type: sql.NVarChar, value: cleanConfession },
          notes: { type: sql.NVarChar, value: toNullIfBlank(notes) },
          has_missing_data: { type: sql.Bit, value: hasMissing },
          missing_fields: { type: sql.NVarChar, value: missingStr },
        }
      );

      if (updateResult.length === 0) {
        return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
      }

      const updatedMember = formatMemberRow(updateResult[0]);

      return NextResponse.json({
        success: true,
        memberId,
        has_missing_data: updatedMember.has_missing_data,
        missing_fields: updatedMember.missing_fields,
        member: updatedMember,
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
