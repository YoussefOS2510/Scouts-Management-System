/**
 * Arabic to English transliteration and translation utilities for Egyptian Coptic Scout names,
 * addresses, academic years, and team names.
 */

// Common Egyptian/Coptic Christian and Arabic given and family names
const NAME_MAP: Record<string, string> = {
  // Common Given Names
  'مينا': 'Mina',
  'كيرلس': 'Kyrollos',
  'كيرولس': 'Kyrollos',
  'جورج': 'George',
  'بيتر': 'Peter',
  'شنودة': 'Shenouda',
  'مارك': 'Mark',
  'ماركو': 'Marco',
  'فادي': 'Fady',
  'مريم': 'Maryam',
  'يوسف': 'Youssef',
  'مارينا': 'Marina',
  'سارة': 'Sarah',
  'اندرو': 'Andrew',
  'اندروا': 'Andrew',
  'أندرو': 'Andrew',
  'مايكل': 'Michael',
  'ديفيد': 'David',
  'داود': 'David',
  'داوود': 'David',
  'بولا': 'Paula',
  'انطونيوس': 'Antonios',
  'أنطونيوس': 'Antonios',
  'توماس': 'Thomas',
  'فيلوباتير': 'Philopateer',
  'مارتن': 'Martin',
  'كارين': 'Karen',
  'مارتينا': 'Martina',
  'ماريان': 'Marianne',
  'جانيت': 'Janet',
  'جون': 'John',
  'ابانوب': 'Abanoub',
  'أبانوب': 'Abanoub',
  'بيشوي': 'Bishoy',
  'بيشوى': 'Bishoy',
  'مرقص': 'Markos',
  'موريس': 'Maurice',
  'رومانى': 'Romany',
  'روماني': 'Romany',
  'ستيفن': 'Stephen',
  'سام': 'Sam',
  'سيمون': 'Simone',
  'مونيكا': 'Monica',
  'ساندرا': 'Sandra',
  'فيرونيكا': 'Veronica',
  'كلارا': 'Clara',
  'كريستين': 'Christine',
  'كريستينا': 'Christina',
  'ميرنا': 'Myrna',
  'ميرا': 'Mira',
  'دونا': 'Donna',
  'ليديا': 'Lydia',
  'جلوريا': 'Gloria',
  'ريتا': 'Rita',
  'يوليانا': 'Yuliana',
  'ماري': 'Mary',

  // Egyptian Family / Middle Names
  'سامر': 'Samir',
  'سمير': 'Samir',
  'ماجد': 'Maged',
  'شريف': 'Sherif',
  'نبيل': 'Nabil',
  'أسامة': 'Osama',
  'اسامة': 'Osama',
  'جرجس': 'Guirguis',
  'جراجس': 'Guirguis',
  'ملاك': 'Malak',
  'عادل': 'Adel',
  'سامح': 'Sameh',
  'رامي': 'Ramy',
  'رامى': 'Ramy',
  'رفيق': 'Rafeek',
  'إيهاب': 'Ihab',
  'ايهاب': 'Ihab',
  'أشرف': 'Ashraf',
  'اشرف': 'Ashraf',
  'مدحت': 'Medhat',
  'هاني': 'Hany',
  'هانى': 'Hany',
  'عماد': 'Emad',
  'شادي': 'Shady',
  'شادى': 'Shady',
  'باسم': 'Bassem',
  'نادر': 'Nader',
  'وجيه': 'Wagih',
  'صلاح': 'Salah',
  'رأفت': 'Raafat',
  'طلعت': 'Talaat',
  'ثروت': 'Sarwat',
  'وجدي': 'Wagdy',
  'وجدى': 'Wagdy',
  'مجدى': 'Magdy',
  'مجدي': 'Magdy',
  'محسن': 'Mohsen',
  'منير': 'Mounir',
  'ماهر': 'Maher',
  'محب': 'Moheb',
  'ماريو': 'Mario',
  'أرساني': 'Arsani',
  'ارساني': 'Arsani',
  'ارسانى': 'Arsani',
  'أرسانى': 'Arsani',
  'باسل': 'Bassel',
  'نجوى': 'Nagwa',
  'نسيم': 'Nassim',
  'فيكتور': 'Victor',
  'كميل': 'Kamel',
  'كامل': 'Kamel',
  'عزيز': 'Aziz',
  'اسحق': 'Isaac',
  'إسحق': 'Isaac',
  'يعقوب': 'Yacoub',
  'إبراهيم': 'Ibrahim',
  'ابراهيم': 'Ibrahim',
  'موسى': 'Moussa',
  'موسي': 'Moussa',
  'بطرس': 'Boutros',
  'بباوي': 'Bebawy',
  'عريان': 'Erian',
  'حبيب': 'Habib',
  'نصحي': 'Noshy',
  'نصحى': 'Noshy',
  'صبحى': 'Sobhy',
  'صبحي': 'Sobhy',
  'خيرى': 'Khairy',
  'خيري': 'Khairy',
  'شفيق': 'Shafik',
  'توفيق': 'Tawfik',
  'فؤاد': 'Fouad',
  'فهيم': 'Fahim',
  'صبري': 'Sabry',
  'صبرى': 'Sabry',
  'عاطف': 'Atef',
  'عصام': 'Essam',
  'طارق': 'Tarek',
  'ناجي': 'Nagy',
  'ناجى': 'Nagy',
  'ناهد': 'Nahed',
  'سلوى': 'Salwa',
  'سلوي': 'Salwa',
  'وفاء': 'Wafaa',
  'أماني': 'Amani',
  'اماني': 'Amani',
};

// General Arabic character-to-Latin phonetic fallback map
const ARABIC_CHAR_MAP: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'aa', 'ء': '', 'ئ': 'e', 'ؤ': 'o',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'g', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
  'ف': 'f', 'ق': 'k', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'ة': 'a', 'و': 'o', 'ي': 'y', 'ى': 'a',
  'ّ': '', 'َ': 'a', 'ُ': 'o', 'ِ': 'e', 'ْ': '', 'ً': 'an', 'ٌ': 'on', 'ٍ': 'en'
};

export function transliterateArabicName(arabicName: string): string {
  if (!arabicName || !arabicName.trim()) return '';
  const parts = arabicName.trim().split(/\s+/);
  const englishParts = parts.map((part) => {
    // 1. Check exact dictionary match
    const clean = part.replace(/[^\u0621-\u064A]/g, '');
    if (NAME_MAP[clean]) {
      return NAME_MAP[clean];
    }

    // 2. Fallback phonetic transliteration
    let result = '';
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      const mapped = ARABIC_CHAR_MAP[char] !== undefined ? ARABIC_CHAR_MAP[char] : char;
      result += mapped;
    }
    // Capitalize first letter
    if (result.length > 0) {
      return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
    }
    return part;
  });

  return englishParts.join(' ');
}

// Egyptian address terms dictionary
const ADDRESS_DICTIONARY: [RegExp, string][] = [
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

export function translateAddress(addressAr: string): string {
  if (!addressAr || !addressAr.trim()) return '';
  let translated = addressAr.trim();
  for (const [pattern, replacement] of ADDRESS_DICTIONARY) {
    translated = translated.replace(pattern, replacement);
  }
  return translated;
}

// Academic Year terms translation
const ACADEMIC_YEAR_MAP: Record<string, string> = {
  'اولى ابتدائي': 'Primary 1',
  'أولى ابتدائي': 'Primary 1',
  'تانية ابتدائي': 'Primary 2',
  'ثانية ابتدائي': 'Primary 2',
  'تالتة ابتدائي': 'Primary 3',
  'ثالثة ابتدائي': 'Primary 3',
  'رابعة ابتدائي': 'Primary 4',
  'خامسة ابتدائي': 'Primary 5',
  'ساتة ابتدائي': 'Primary 6',
  'سادسة ابتدائي': 'Primary 6',
  'اولى اعدادي': 'Prep 1',
  'أولى إعدادي': 'Prep 1',
  'اولى اعدادى': 'Prep 1',
  'أولى إعدادى': 'Prep 1',
  'تانية اعدادي': 'Prep 2',
  'ثانية إعدادي': 'Prep 2',
  'تانية اعدادى': 'Prep 2',
  'ثانية إعدادى': 'Prep 2',
  'تالتة اعدادي': 'Prep 3',
  'ثالثة إعدادي': 'Prep 3',
  'تالتة اعدادى': 'Prep 3',
  'ثالثة إعدادى': 'Prep 3',
  'اولى ثانوي': 'Secondary 1',
  'أولى ثانوي': 'Secondary 1',
  'اولى ثانوى': 'Secondary 1',
  'أولى ثانوى': 'Secondary 1',
  'تانية ثانوي': 'Secondary 2',
  'ثانية ثانوي': 'Secondary 2',
  'تانية ثانوى': 'Secondary 2',
  'ثانية ثانوى': 'Secondary 2',
  'تالتة ثانوي': 'Secondary 3',
  'ثالثة ثانوي': 'Secondary 3',
  'تالتة ثانوى': 'Secondary 3',
  'ثالثة ثانوى': 'Secondary 3',
  'جامعة': 'University',
  'كلية': 'College',
  'تخرج': 'Graduated',
};

export function translateAcademicYear(academicYearAr: string): string {
  if (!academicYearAr || !academicYearAr.trim()) return '';
  const clean = academicYearAr.trim();
  if (ACADEMIC_YEAR_MAP[clean]) {
    return ACADEMIC_YEAR_MAP[clean];
  }
  for (const [key, val] of Object.entries(ACADEMIC_YEAR_MAP)) {
    if (clean.includes(key)) return val;
  }
  return clean;
}

// Unit / Team Name matcher
export const UNIT_NAME_MATCHER: { patterns: RegExp[]; unitId: number }[] = [
  { patterns: [/اشبال\s*a/i, /أشبال\s*a/i, /cubs\s*a/i], unitId: 1 },
  { patterns: [/اشبال\s*b/i, /أشبال\s*b/i, /cubs\s*b/i], unitId: 2 },
  { patterns: [/زهرات\s*a/i, /زهرات\s*أ/i, /brownies\s*a/i], unitId: 3 },
  { patterns: [/زهرات\s*b/i, /زهرات\s*ب/i, /brownies\s*b/i], unitId: 4 },
  { patterns: [/كشافة\s*a/i, /كشافه\s*a/i, /scouts\s*a/i], unitId: 5 },
  { patterns: [/كشافة\s*b/i, /كشافه\s*b/i, /scouts\s*b/i], unitId: 6 },
  { patterns: [/مرشدات\s*a/i, /guides\s*a/i], unitId: 7 },
  { patterns: [/مرشدات\s*b/i, /guides\s*b/i], unitId: 8 },
  { patterns: [/متقدم/i, /advanced/i], unitId: 9 },
  { patterns: [/رائدات/i, /senior/i], unitId: 10 },
  { patterns: [/جوالة/i, /جواله/i, /rovers/i], unitId: 11 },
  { patterns: [/قادة/i, /قاده/i, /leaders/i], unitId: 12 },
  // General fallbacks if only section name is provided
  { patterns: [/اشبال/i, /أشبال/i, /cubs/i], unitId: 1 },
  { patterns: [/زهرات/i, /brownies/i], unitId: 3 },
  { patterns: [/كشافة/i, /كشافه/i, /scouts/i], unitId: 5 },
  { patterns: [/مرشدات/i, /guides/i], unitId: 7 },
];

export function matchUnitId(teamName: string): number | null {
  if (!teamName || !teamName.trim()) return null;
  const clean = teamName.trim();
  for (const item of UNIT_NAME_MATCHER) {
    if (item.patterns.some((p) => p.test(clean))) {
      return item.unitId;
    }
  }
  return null;
}
