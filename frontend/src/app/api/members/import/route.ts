import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { members } = body;

    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No member records provided' },
        { status: 400 }
      );
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const m of members) {
      const code = (m.member_code || '').trim() || `SCT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const nameAr = (m.full_name_ar || '').trim();
      if (!nameAr) continue; // Skip completely empty rows

      const nameEn = (m.full_name_en || '').trim() || null;
      const unitId = m.unit_id ? Number(m.unit_id) : 5; // Default Kashafa A (5) if not recognized
      const dob = m.date_of_birth && String(m.date_of_birth).trim() !== '' ? String(m.date_of_birth).trim() : null;
      const memberPhone = (m.member_phone || '').trim() || null;
      const fatherPhone = (m.father_phone || '').trim() || null;
      const motherPhone = (m.mother_phone || '').trim() || null;
      const addressAr = (m.address_ar || '').trim() || null;
      const addressEn = (m.address_en || '').trim() || null;
      const school = (m.school_or_college || '').trim() || null;
      const schoolEn = (m.school_or_college_en || '').trim() || null;
      const academicYear = (m.academic_year || '').trim() || null;
      const academicYearEn = (m.academic_year_en || '').trim() || null;
      const sundaySchool = (m.sunday_school_class || '').trim() || null;
      const sundaySchoolEn = (m.sunday_school_class_en || '').trim() || null;
      const confessionFather = (m.father_of_confession || '').trim() || null;
      const notes = (m.notes || '').trim() || null;
      const hasMissing = Boolean(m.has_missing_data);
      const missingFields =
        typeof m.missing_fields === 'string'
          ? m.missing_fields
          : Array.isArray(m.missing_fields)
          ? m.missing_fields.join(', ')
          : '';

      const res = await query(
        `
        INSERT INTO members (
          member_code,
          pin_hash,
          unit_id,
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
          is_active,
          updated_at
        )
        VALUES (
          @code,
          '1234',
          @unitId,
          @nameAr,
          @nameEn,
          @dob,
          @memberPhone,
          @fatherPhone,
          @motherPhone,
          @addressAr,
          @addressEn,
          @school,
          @schoolEn,
          @academicYear,
          @academicYearEn,
          @sundaySchool,
          @sundaySchoolEn,
          @confessionFather,
          @notes,
          @hasMissing,
          @missingFields,
          true,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (member_code) DO UPDATE SET
          unit_id = EXCLUDED.unit_id,
          full_name_ar = EXCLUDED.full_name_ar,
          full_name_en = COALESCE(EXCLUDED.full_name_en, members.full_name_en),
          date_of_birth = COALESCE(EXCLUDED.date_of_birth, members.date_of_birth),
          member_phone = COALESCE(EXCLUDED.member_phone, members.member_phone),
          father_phone = COALESCE(EXCLUDED.father_phone, members.father_phone),
          mother_phone = COALESCE(EXCLUDED.mother_phone, members.mother_phone),
          address_ar = COALESCE(EXCLUDED.address_ar, members.address_ar),
          address_en = COALESCE(EXCLUDED.address_en, members.address_en),
          school_or_college = COALESCE(EXCLUDED.school_or_college, members.school_or_college),
          school_or_college_en = COALESCE(EXCLUDED.school_or_college_en, members.school_or_college_en),
          academic_year = COALESCE(EXCLUDED.academic_year, members.academic_year),
          academic_year_en = COALESCE(EXCLUDED.academic_year_en, members.academic_year_en),
          sunday_school_class = COALESCE(EXCLUDED.sunday_school_class, members.sunday_school_class),
          sunday_school_class_en = COALESCE(EXCLUDED.sunday_school_class_en, members.sunday_school_class_en),
          father_of_confession = COALESCE(EXCLUDED.father_of_confession, members.father_of_confession),
          notes = COALESCE(EXCLUDED.notes, members.notes),
          has_missing_data = EXCLUDED.has_missing_data,
          missing_fields = EXCLUDED.missing_fields,
          updated_at = CURRENT_TIMESTAMP
        RETURNING (xmax = 0) AS is_inserted;
        `,
        {
          code,
          unitId,
          nameAr,
          nameEn,
          dob,
          memberPhone,
          fatherPhone,
          motherPhone,
          addressAr,
          addressEn,
          school,
          schoolEn,
          academicYear,
          academicYearEn,
          sundaySchool,
          sundaySchoolEn,
          confessionFather,
          notes,
          hasMissing,
          missingFields,
        }
      );

      if (res && res[0]) {
        if (res[0].is_inserted) insertedCount++;
        else updatedCount++;
      } else {
        insertedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${insertedCount + updatedCount} scouts (${insertedCount} new, ${updatedCount} updated)`,
      insertedCount,
      updatedCount,
    });
  } catch (error: any) {
    console.error('Error importing members from Excel:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Import error' },
      { status: 500 }
    );
  }
}
