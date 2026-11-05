const { Pool } = require('pg');
const xlsx = require('xlsx');

// Load environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Arabic transliteration map & helper
const NAME_MAP = {
  'مينا': 'Mina', 'كيرلس': 'Kyrollos', 'كيرولس': 'Kyrollos', 'جورج': 'George',
  'بيتر': 'Peter', 'شنودة': 'Shenouda', 'شنوده': 'Shenouda', 'مارك': 'Mark',
  'ماركو': 'Marco', 'فادي': 'Fady', 'مريم': 'Maryam', 'يوسف': 'Youssef',
  'مارينا': 'Marina', 'سارة': 'Sarah', 'اندرو': 'Andrew', 'اندروا': 'Andrew',
  'أندرو': 'Andrew', 'مايكل': 'Michael', 'ديفيد': 'David', 'داود': 'David',
  'داوود': 'David', 'بولا': 'Paula', 'انطونيوس': 'Antonios', 'أنطونيوس': 'Antonios',
  'توماس': 'Thomas', 'فيلوباتير': 'Philopateer', 'مارتن': 'Martin', 'كارين': 'Karen',
  'مارتينا': 'Martina', 'ماريان': 'Marianne', 'جانيت': 'Janet', 'جون': 'John',
  'ابانوب': 'Abanoub', 'أبانوب': 'Abanoub', 'بيشوي': 'Bishoy', 'بيشوى': 'Bishoy',
  'مرقص': 'Markos', 'موريس': 'Maurice', 'رومانى': 'Romany', 'روماني': 'Romany',
  'ستيفن': 'Stephen', 'سام': 'Sam', 'سيمون': 'Simone', 'مونيكا': 'Monica',
  'ساندرا': 'Sandra', 'فيرونيكا': 'Veronica', 'كلارا': 'Clara', 'كريستين': 'Christine',
  'كريستينا': 'Christina', 'ميرنا': 'Myrna', 'ميرا': 'Mira', 'دونا': 'Donna',
  'ليديا': 'Lydia', 'جلوريا': 'Gloria', 'ريتا': 'Rita', 'يوليانا': 'Yuliana',
  'ماري': 'Mary', 'ايلينور': 'Eleanor', 'إيلينور': 'Eleanor', 'باميلا': 'Pamela',
  'بيرلا': 'Perla', 'آدم': 'Adam', 'ادم': 'Adam', 'ميشيل': 'Michel',
  'انتوني': 'Anthony', 'أنطوني': 'Anthony', 'باترك': 'Patrick', 'باتريك': 'Patrick',
  'بربتوا': 'Perpetua', 'جوليا': 'Julia', 'جيسيكا': 'Jessica', 'جويس': 'Joyce',
  'كارول': 'Carol', 'ميرولا': 'Merola', 'ميريام': 'Myriam', 'كاترين': 'Catherine',
  'جولى': 'Julie', 'جولي': 'Julie', 'ماريا': 'Maria', 'ماثيو': 'Matthew',
  'كارولين': 'Caroline', 'فيرجينى': 'Virginie', 'فيرجيني': 'Virginie',
  'إيناس': 'Enas', 'ايناس': 'Enas', 'كريس': 'Chris', 'سيلفيا': 'Sylvia',
  'سلفيا': 'Sylvia', 'كلير': 'Claire', 'كلود': 'Claude', 'ماريز': 'Maryse',
  'ميريت': 'Mirit', 'يوستينا': 'Justina', 'لورا': 'Laura', 'ساندى': 'Sandy',
  'ساندي': 'Sandy', 'جوزيف': 'Joseph',
  'سامر': 'Samir', 'سمير': 'Samir', 'ماجد': 'Maged', 'شريف': 'Sherif',
  'نبيل': 'Nabil', 'أسامة': 'Osama', 'اسامة': 'Osama', 'جرجس': 'Guirguis',
  'ملاك': 'Malak', 'عادل': 'Adel', 'سامح': 'Sameh', 'رامي': 'Ramy', 'رامى': 'Ramy',
  'إيهاب': 'Ihab', 'ايهاب': 'Ihab', 'أشرف': 'Ashraf', 'اشرف': 'Ashraf',
  'مدحت': 'Medhat', 'هاني': 'Hany', 'هانى': 'Hany', 'عماد': 'Emad',
  'شادي': 'Shady', 'شادى': 'Shady', 'باسم': 'Bassem', 'نادر': 'Nader',
  'وجيه': 'Wagih', 'صلاح': 'Salah', 'رأفت': 'Raafat', 'طلعت': 'Talaat',
  'ثروت': 'Sarwat', 'وجدي': 'Wagdy', 'وجدى': 'Wagdy', 'مجدى': 'Magdy',
  'مجدي': 'Magdy', 'محسن': 'Mohsen', 'منير': 'Mounir', 'ماهر': 'Maher',
  'محب': 'Moheb', 'ماريو': 'Mario', 'أرساني': 'Arsani', 'ارساني': 'Arsani',
  'ارسانى': 'Arsani', 'أرسانى': 'Arsani', 'باسل': 'Bassel', 'نجوى': 'Nagwa',
  'فيكتور': 'Victor', 'كميل': 'Kamel', 'كامل': 'Kamel', 'عزيز': 'Aziz',
  'اسحق': 'Isaac', 'إسحق': 'Isaac', 'يعقوب': 'Yacoub', 'إبراهيم': 'Ibrahim',
  'ابراهيم': 'Ibrahim', 'موسى': 'Moussa', 'موسي': 'Moussa', 'بطرس': 'Boutros',
  'بباوي': 'Bebawy', 'عريان': 'Erian', 'حبيب': 'Habib', 'نصحي': 'Noshy',
  'صبحى': 'Sobhy', 'صبحي': 'Sobhy', 'خيرى': 'Khairy', 'خيري': 'Khairy',
  'شفيق': 'Shafik', 'توفيق': 'Tawfik', 'فؤاد': 'Fouad', 'فهيم': 'Fahim',
  'صبري': 'Sabry', 'صبرى': 'Sabry', 'عاطف': 'Atef', 'عصام': 'Essam',
  'طارق': 'Tarek', 'ناجي': 'Nagy', 'ناجى': 'Nagy', 'ناهد': 'Nahed'
};

const ARABIC_CHAR_MAP = {
  'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'aa', 'ء': '', 'ئ': 'e', 'ؤ': 'o',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'g', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
  'ف': 'f', 'ق': 'k', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'ة': 'a', 'و': 'o', 'ي': 'y', 'ى': 'a',
  'ّ': '', 'َ': 'a', 'ُ': 'o', 'ِ': 'e', 'ْ': '', 'ً': 'an', 'ٌ': 'on', 'ٍ': 'en'
};

function transliterateArabicName(arabicName) {
  if (!arabicName || !arabicName.trim()) return '';
  const parts = arabicName.trim().split(/\s+/);
  const englishParts = parts.map((part) => {
    const clean = part.replace(/[^\u0621-\u064A]/g, '');
    if (NAME_MAP[clean]) return NAME_MAP[clean];
    let result = '';
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      result += ARABIC_CHAR_MAP[char] !== undefined ? ARABIC_CHAR_MAP[char] : char;
    }
    if (result.length > 0) {
      return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
    }
    return part;
  });
  return englishParts.join(' ');
}

const ADDRESS_DICTIONARY = [
  [/الرحاب/gi, 'Al Rehab'],
  [/مدينتي/gi, 'Madinaty'],
  [/التجمع الخامس/gi, 'Fifth Settlement'],
  [/التجمع الاول/gi, 'First Settlement'],
  [/التجمع/gi, 'New Cairo'],
  [/مدينة نصر/gi, 'Nasr City'],
  [/مصر الجديدة/gi, 'Heliopolis'],
  [/المعادي/gi, 'Maadi'],
  [/الشروق/gi, 'El Shorouk'],
  [/العبور/gi, 'El Obour'],
  [/القاهرة الجديدة/gi, 'New Cairo'],
  [/القاهرة/gi, 'Cairo'],
  [/الجيزة/gi, 'Giza'],
  [/عمارة\s*(\d+)/gi, 'Bldg $1'],
  [/عمارة/gi, 'Bldg'],
  [/شقة\s*(\d+)/gi, 'Apt $1'],
  [/شقة/gi, 'Apt'],
  [/مجموعة\s*(\d+)/gi, 'Group $1'],
  [/مجموعة/gi, 'Group'],
  [/شارع/gi, 'St.'],
  [/طريق/gi, 'Rd.'],
  [/ميدان/gi, 'Square'],
  [/بوابة\s*(\d+)/gi, 'Gate $1'],
  [/بوابة/gi, 'Gate'],
  [/الدور\s*(\d+)/gi, 'Floor $1'],
  [/الدور الاول/gi, '1st Floor'],
  [/الدور الثاني/gi, '2nd Floor'],
  [/الدور الثالث/gi, '3rd Floor'],
  [/الدور الرابع/gi, '4th Floor'],
  [/الدور الخامس/gi, '5th Floor'],
  [/الدور الارضي/gi, 'Ground Floor'],
  [/فيلا\s*(\d+)/gi, 'Villa $1'],
  [/فيلا/gi, 'Villa'],
  [/حي\s*(\d+)/gi, 'District $1'],
  [/حي/gi, 'District'],
  [/منطقة/gi, 'Area'],
  [/مرحلة/gi, 'Phase'],
];

function translateAddress(addressAr) {
  if (!addressAr || !addressAr.trim()) return '';
  let translated = addressAr.trim();
  for (const [pattern, replacement] of ADDRESS_DICTIONARY) {
    translated = translated.replace(pattern, replacement);
  }
  return translated;
}

const ACADEMIC_YEAR_MAP = {
  'اولى ابتدائي': 'Primary 1', 'أولى ابتدائي': 'Primary 1',
  'تانية ابتدائي': 'Primary 2', 'ثانية ابتدائي': 'Primary 2',
  'تالتة ابتدائي': 'Primary 3', 'ثالثة ابتدائي': 'Primary 3',
  'رابعة ابتدائي': 'Primary 4', 'خامسة ابتدائي': 'Primary 5',
  'ساتة ابتدائي': 'Primary 6', 'سادسة ابتدائي': 'Primary 6',
  'سنة سادسة': 'Grade 6', 'سنة  سادسة': 'Grade 6', 'سادسة': 'Grade 6',
  'سنة خامسة': 'Grade 5', 'خامسة': 'Grade 5',
  'اولى اعدادي': 'Prep 1', 'أولى إعدادي': 'Prep 1', 'اولى اعدادى': 'Prep 1', 'أولى إعدادى': 'Prep 1',
  'تانية اعدادي': 'Prep 2', 'ثانية إعدادي': 'Prep 2', 'تانية اعدادى': 'Prep 2', 'ثانية إعدادى': 'Prep 2',
  'تالتة اعدادي': 'Prep 3', 'ثالثة إعدادي': 'Prep 3', 'تالتة اعدادى': 'Prep 3', 'ثالثة إعدادى': 'Prep 3',
  'اولى ثانوي': 'Secondary 1', 'أولى ثانوي': 'Secondary 1', 'اولى ثانوى': 'Secondary 1', 'أولى ثانوى': 'Secondary 1',
  'تانية ثانوي': 'Secondary 2', 'ثانية ثانوي': 'Secondary 2', 'تانية ثانوى': 'Secondary 2', 'ثانية ثانوى': 'Secondary 2',
  'تالتة ثانوي': 'Secondary 3', 'ثالثة ثانوي': 'Secondary 3', 'تالتة ثانوى': 'Secondary 3', 'ثالثة ثانوى': 'Secondary 3',
  'اولى جامعة': 'University 1', 'أولى جامعة': 'University 1',
  'تانية جامعة': 'University 2', 'ثانية جامعة': 'University 2',
  'تالتة جامعة': 'University 3', 'ثالثة جامعة': 'University 3',
  'رابعة جامعة': 'University 4', 'خامسة جامعة': 'University 5',
  'جامعة': 'University', 'كلية': 'College', 'تخرج': 'Graduated',
  'قادة': 'Leadership'
};

function translateAcademicYear(academicYearAr) {
  if (!academicYearAr || !academicYearAr.trim()) return '';
  const clean = academicYearAr.trim();
  if (ACADEMIC_YEAR_MAP[clean]) return ACADEMIC_YEAR_MAP[clean];
  for (const [key, val] of Object.entries(ACADEMIC_YEAR_MAP)) {
    if (clean.includes(key)) return val;
  }
  return clean;
}

function cleanPhone(val) {
  if (!val) return null;
  let str = String(val).replace(/[\s\-\.]/g, '').trim();
  if (!str || str === '-' || str === '#ERROR!') return null;
  if (str.startsWith('20') && str.length === 12) str = '0' + str.slice(2);
  if (str.length === 10 && (str.startsWith('10') || str.startsWith('11') || str.startsWith('12') || str.startsWith('15'))) {
    str = '0' + str;
  }
  return str;
}

function parseDob(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  if (!str || str === '-' || str === '#ERROR!') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    let p1 = parseInt(m[1], 10);
    let p2 = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    let month, day;
    if (p1 > 12) {
      // p1 is day, p2 is month (e.g. 25/12/2008)
      day = p1;
      month = p2;
    } else if (p2 > 12) {
      // p2 is day, p1 is month (e.g. 12/25/2008)
      month = p1;
      day = p2;
    } else {
      // In Egypt, default format is DD/MM/YYYY
      day = p1;
      month = p2;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return null;
}

const SHEET_UNIT_MAP = {
  'زهرات A ': 3,
  'زهرات B': 4,
  'اشبال A': 1,
  '   أشبال B': 2,
  'مرشدات ا ': 7,
  'مرشدات ب ': 8,
  ' -Fujiكشافة ا ': 5,
  ' Aronaكشافة ب ': 6,
  'رائدات ': 10,
  'متقدم ': 9,
  'جوالة': 11,
  'قادة ': 12
};

async function run() {
  console.log('--- Starting Scout Real Data Import ---');
  
  // 1. Clean existing members
  console.log('Resetting members table...');
  await pool.query('TRUNCATE members CASCADE;');
  console.log('Members table truncated successfully.');

  const filePath = 'C:/Users/11/.gemini/antigravity/brain/126fdaf8-2be9-4331-8f24-7a378cbee602/.user_uploaded/media_1793886847205_23224665.xlsx';
  const wb = xlsx.readFile(filePath);

  let totalInserted = 0;
  let totalWithMissing = 0;
  const unitCounts = {};
  const usedCodes = new Set();

  for (const sheetName of wb.SheetNames) {
    const unitId = SHEET_UNIT_MAP[sheetName];
    if (!unitId) {
      console.warn('Unknown sheet:', sheetName);
      continue;
    }

    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
    if (rows.length < 2) continue;

    console.log(`Processing [${sheetName.trim()}] (Unit ID ${unitId})...`);
    unitCounts[sheetName.trim()] = 0;

    if (sheetName.trim() === 'قادة') {
      // Leaders sheet structure:
      // Col 0: No
      // Col 1: الاسم
      // Col 2: اسم الفريق ("قادة")
      // Col 3: الرقم القومي
      // Col 4: موبايل
      // Col 5: العنوان
      // Col 6: تاريخ الميلاد
      // Col 7: الجامعة
      // Col 8: الكلية
      // Col 9: الوظيفة
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0) continue;
        const nameAr = r[1] ? String(r[1]).trim() : '';
        if (!nameAr || nameAr.includes('total')) continue;

        const seq = String(i).padStart(3, '0');
        const code = `2026-12-${seq}`;
        const nameEn = transliterateArabicName(nameAr);
        const nationalId = r[3] ? String(r[3]).replace(/,/g, '').trim() : '';
        const phone = cleanPhone(r[4]);
        const addressAr = r[5] ? String(r[5]).trim() : null;
        const addressEn = translateAddress(addressAr || '');
        const dob = parseDob(r[6]);
        const uni = r[7] ? String(r[7]).trim() : '';
        const college = r[8] ? String(r[8]).trim() : '';
        const schoolOrCollege = [uni, college].filter(Boolean).join(' - ') || null;
        const job = r[9] ? String(r[9]).trim() : '';
        
        const noteParts = [];
        if (nationalId) noteParts.push(`الرقم القومي: ${nationalId}`);
        if (job) noteParts.push(`الوظيفة: ${job}`);
        const notes = noteParts.join(' | ') || null;

        const missing = [];
        if (!phone) missing.push('رقم الموبايل');
        if (!dob) missing.push('تاريخ الميلاد');
        if (!addressAr) missing.push('العنوان');

        const hasMissing = missing.length > 0;
        const missingFieldsStr = missing.join(', ');

        await pool.query(`
          INSERT INTO members (
            member_code, pin_hash, unit_id, full_name_ar, full_name_en,
            date_of_birth, member_phone, address_ar, address_en,
            school_or_college, academic_year, academic_year_en,
            notes, has_missing_data, missing_fields, is_active, updated_at
          ) VALUES (
            $1, '1234', $2, $3, $4,
            $5, $6, $7, $8,
            $9, 'قادة', 'Leadership',
            $10, $11, $12, true, CURRENT_TIMESTAMP
          )
        `, [
          code, unitId, nameAr, nameEn,
          dob, phone, addressAr, addressEn || null,
          schoolOrCollege, notes, hasMissing, missingFieldsStr
        ]);

        totalInserted++;
        if (hasMissing) totalWithMissing++;
        unitCounts[sheetName.trim()]++;
      }
      continue;
    }

    // Regular scout sheets:
    const header = rows[0];
    const codeIdx = header.findIndex(c => c && String(c).includes('الكود'));
    const nameIdx = header.findIndex(c => c && (String(c).includes('الاسم') || String(c).includes('اسم')));
    const yearIdx = header.findIndex(c => c && String(c).includes('السنة'));
    const phoneIdx = header.findIndex(c => c && (String(c).includes('رقم الموبايل') || String(c).includes('موبايل')));
    const dobIdx = header.findIndex(c => c && String(c).includes('تاريخ الميلاد'));
    const addrIdx = header.findIndex(c => c && (String(c).includes('العنوان بالعربى') || String(c).includes('العنوان')));
    const fatherPhoneIdx = header.findIndex(c => c && String(c).includes('رقم الأب'));
    const motherPhoneIdx = header.findIndex(c => c && String(c).includes('رقم الأم'));
    const schoolIdx = header.findIndex(c => c && (String(c).includes('School') || String(c).includes('المدرسة')));
    const sundaySchoolIdx = header.findIndex(c => c && String(c).includes('فصل مدارس الاحد'));
    const confFatherIdx = header.findIndex(c => c && String(c).includes('اب الاعتراف'));
    const notesIdx = header.findIndex(c => c && (String(c).toLowerCase().includes('note') || String(c).includes('ملاحظات')));

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;
      const nameAr = nameIdx !== -1 && r[nameIdx] ? String(r[nameIdx]).trim() : '';
      if (!nameAr || nameAr.includes('total') || nameAr.startsWith('Officially OUT')) continue;

      let code = codeIdx !== -1 && r[codeIdx] ? String(r[codeIdx]).trim() : '';
      if (!code || code === '-') {
        code = `2026-${String(unitId).padStart(2, '0')}-${String(i).padStart(3, '0')}`;
      }

      if (usedCodes.has(code)) {
        let counter = 2;
        while (usedCodes.has(`${code}-${counter}`)) {
          counter++;
        }
        console.log(`⚠️ Resolving duplicate code ${code} -> ${code}-${counter} for ${nameAr}`);
        code = `${code}-${counter}`;
      }
      usedCodes.add(code);

      const nameEn = transliterateArabicName(nameAr);
      const academicYear = yearIdx !== -1 && r[yearIdx] ? String(r[yearIdx]).trim() : null;
      const academicYearEn = academicYear ? translateAcademicYear(academicYear) : null;
      const memberPhone = phoneIdx !== -1 ? cleanPhone(r[phoneIdx]) : null;
      const dob = dobIdx !== -1 ? parseDob(r[dobIdx]) : null;
      const addressAr = addrIdx !== -1 && r[addrIdx] ? String(r[addrIdx]).trim() : null;
      const addressEn = addressAr ? translateAddress(addressAr) : null;
      const fatherPhone = fatherPhoneIdx !== -1 ? cleanPhone(r[fatherPhoneIdx]) : null;
      const motherPhone = motherPhoneIdx !== -1 ? cleanPhone(r[motherPhoneIdx]) : null;
      const school = schoolIdx !== -1 && r[schoolIdx] ? String(r[schoolIdx]).trim() : null;
      const sundaySchool = sundaySchoolIdx !== -1 && r[sundaySchoolIdx] ? String(r[sundaySchoolIdx]).trim() : null;
      const confessionFather = confFatherIdx !== -1 && r[confFatherIdx] ? String(r[confFatherIdx]).trim() : null;
      const rawNotes = notesIdx !== -1 && r[notesIdx] ? String(r[notesIdx]).trim() : null;
      const notes = (rawNotes && rawNotes !== '-') ? rawNotes : null;

      // Identify missing fields for flagging
      const missing = [];
      if (!dob) missing.push('تاريخ الميلاد');
      if (!memberPhone && !fatherPhone && !motherPhone) missing.push('رقم للتواصل');
      if (!addressAr) missing.push('العنوان');
      if (!school) missing.push('المدرسة / الكلية');
      if (!confessionFather || confessionFather === 'لا يوجد' || confessionFather === '--' || confessionFather === '-') {
        missing.push('اب الاعتراف');
      }

      const hasMissing = missing.length > 0;
      const missingFieldsStr = missing.join(', ');

      await pool.query(`
        INSERT INTO members (
          member_code, pin_hash, unit_id, full_name_ar, full_name_en,
          date_of_birth, member_phone, father_phone, mother_phone,
          address_ar, address_en, school_or_college, school_or_college_en,
          academic_year, academic_year_en, sunday_school_class,
          father_of_confession, notes, has_missing_data, missing_fields,
          is_active, updated_at
        ) VALUES (
          $1, '1234', $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18, $19,
          true, CURRENT_TIMESTAMP
        )
      `, [
        code, unitId, nameAr, nameEn,
        dob, memberPhone, fatherPhone, motherPhone,
        addressAr, addressEn || null, school, school,
        academicYear, academicYearEn, sundaySchool,
        confessionFather, notes, hasMissing, missingFieldsStr
      ]);

      totalInserted++;
      if (hasMissing) totalWithMissing++;
      unitCounts[sheetName.trim()]++;
    }
  }

  console.log('\n=============================================');
  console.log(`✅ Import finished! Total records inserted: ${totalInserted}`);
  console.log(`⚠️  Members with missing fields flagged: ${totalWithMissing}`);
  console.log('Breakdown by sheet:');
  for (const [s, c] of Object.entries(unitCounts)) {
    console.log(`  - ${s}: ${c}`);
  }
  console.log('=============================================\n');

  await pool.end();
}

run().catch(err => {
  console.error('Fatal error during import:', err);
  process.exit(1);
});
