import {
  Unit,
  Patrol,
  Member,
  User,
  Role,
  Permission,
  UserRole,
  UserPermissionOverride,
  EquipmentCategory,
  EquipmentItem,
  Booking,
  MediaUploadJob,
  AuditLogEntry,
  MemberUnitHistory,
  MediaAlbum,
  MediaItem,
  ScoutAttendanceStats,
} from './types';

export const INITIAL_UNITS: Unit[] = [
  { id: 1, code: 'cubs_a', name_ar: 'أشبال A', name_en: 'Ashbal A', stage_group: 'cubs', gender: 'boys', is_leadership: false, target_grade: 'Grade 5' },
  { id: 2, code: 'cubs_b', name_ar: 'أشبال B', name_en: 'Ashbal B', stage_group: 'cubs', gender: 'boys', is_leadership: false, target_grade: 'Grade 6' },
  { id: 3, code: 'brownies_a', name_ar: 'زهرات A', name_en: 'Zahrat A', stage_group: 'brownies', gender: 'girls', is_leadership: false, target_grade: 'Grade 5' },
  { id: 4, code: 'brownies_b', name_ar: 'زهرات B', name_en: 'Zahrat B', stage_group: 'brownies', gender: 'girls', is_leadership: false, target_grade: 'Grade 6' },
  { id: 5, code: 'scouts_a', name_ar: 'كشافة A', name_en: 'Kashafa A', stage_group: 'scouts', gender: 'boys', is_leadership: false, target_grade: 'Prep 1–3 Parallel Troop A' },
  { id: 6, code: 'scouts_b', name_ar: 'كشافة B', name_en: 'Kashafa B', stage_group: 'scouts', gender: 'boys', is_leadership: false, target_grade: 'Prep 1–3 Parallel Troop B' },
  { id: 7, code: 'guides_a', name_ar: 'مرشدات A', name_en: 'Morshdat A', stage_group: 'guides', gender: 'girls', is_leadership: false, target_grade: 'Prep 1–3 Parallel Company A' },
  { id: 8, code: 'guides_b', name_ar: 'مرشدات B', name_en: 'Morshdat B', stage_group: 'guides', gender: 'girls', is_leadership: false, target_grade: 'Prep 1–3 Parallel Company B' },
  { id: 9, code: 'advanced_scouts', name_ar: 'متقدم', name_en: 'Motakadem', stage_group: 'advanced_scouts', gender: 'boys', is_leadership: false, target_grade: 'Secondary 1–3' },
  { id: 10, code: 'senior_guides', name_ar: 'رائدات', name_en: 'Ra2edat', stage_group: 'senior_guides', gender: 'girls', is_leadership: false, target_grade: 'Secondary 1–3' },
  { id: 11, code: 'rovers', name_ar: 'جوالة', name_en: 'Gawala', stage_group: 'rovers', gender: 'mixed', is_leadership: false, target_grade: 'University / Higher Ed' },
  { id: 12, code: 'leaders', name_ar: 'قادة', name_en: 'Leaders', stage_group: 'leadership', gender: 'mixed', is_leadership: true, target_grade: 'Leadership & Adult Staff' },
];

export const INITIAL_PATROLS: Patrol[] = [
  // Ashbal A (Unit 1)
  { id: 101, unit_id: 1, name_ar: 'سداسي الذئب', name_en: 'Wolf Six' },
  { id: 102, unit_id: 1, name_ar: 'سداسي الدب', name_en: 'Bear Six' },
  { id: 103, unit_id: 1, name_ar: 'سداسي الثعلب', name_en: 'Fox Six' },
  { id: 104, unit_id: 1, name_ar: 'سداسي النمر', name_en: 'Tiger Six' },

  // Ashbal B (Unit 2)
  { id: 201, unit_id: 2, name_ar: 'سداسي الفهد', name_en: 'Panther Six' },
  { id: 202, unit_id: 2, name_ar: 'سداسي الوشق', name_en: 'Lynx Six' },
  { id: 203, unit_id: 2, name_ar: 'سداسي القندس', name_en: 'Beaver Six' },

  // Zahrat A (Unit 3)
  { id: 301, unit_id: 3, name_ar: 'سداسي الياسمين', name_en: 'Jasmine Six' },
  { id: 302, unit_id: 3, name_ar: 'سداسي البنفسج', name_en: 'Violet Six' },
  { id: 303, unit_id: 3, name_ar: 'سداسي النرجس', name_en: 'Narcissus Six' },

  // Zahrat B (Unit 4)
  { id: 401, unit_id: 4, name_ar: 'سداسي التيوليب', name_en: 'Tulip Six' },
  { id: 402, unit_id: 4, name_ar: 'سداسي الجوري', name_en: 'Damask Rose Six' },

  // Kashafa A (Unit 5)
  { id: 1, unit_id: 5, name_ar: 'طليعة النسر', name_en: 'Eagle Patrol' },
  { id: 2, unit_id: 5, name_ar: 'طليعة الأسد', name_en: 'Lion Patrol' },
  { id: 3, unit_id: 5, name_ar: 'طليعة الفهد', name_en: 'Panther Patrol' },
  { id: 4, unit_id: 5, name_ar: 'طليعة الصقر', name_en: 'Falcon Patrol' },

  // Kashafa B (Unit 6)
  { id: 601, unit_id: 6, name_ar: 'طليعة الشاهين', name_en: 'Peregrine Patrol' },
  { id: 602, unit_id: 6, name_ar: 'طليعة الذئب', name_en: 'Wolf Patrol' },
  { id: 603, unit_id: 6, name_ar: 'طليعة العقاب', name_en: 'Eagle Hawk Patrol' },

  // Morshdat A (Unit 7)
  { id: 5, unit_id: 7, name_ar: 'طليعة الزهور', name_en: 'Flowers Patrol' },
  { id: 6, unit_id: 7, name_ar: 'طليعة الأمل', name_en: 'Hope Patrol' },
  { id: 703, unit_id: 7, name_ar: 'طليعة المحبة', name_en: 'Love Patrol' },

  // Morshdat B (Unit 8)
  { id: 801, unit_id: 8, name_ar: 'طليعة السلام', name_en: 'Peace Patrol' },
  { id: 802, unit_id: 8, name_ar: 'طليعة العطاء', name_en: 'Giving Patrol' },

  // Motakadem A (Unit 9)
  { id: 901, unit_id: 9, name_ar: 'طليعة الفرسان', name_en: 'Knights Patrol' },
  { id: 902, unit_id: 9, name_ar: 'طليعة الرواد', name_en: 'Pioneers Patrol' },
  { id: 903, unit_id: 9, name_ar: 'طليعة الشجعان', name_en: 'Braves Patrol' },

  // Motakadem B (Unit 10)
  { id: 1001, unit_id: 10, name_ar: 'طليعة العاصفة', name_en: 'Storm Patrol' },
  { id: 1002, unit_id: 10, name_ar: 'طليعة البركان', name_en: 'Volcano Patrol' },

  // Ra2edat A (Unit 11)
  { id: 1101, unit_id: 11, name_ar: 'طليعة النور', name_en: 'Light Patrol' },
  { id: 1102, unit_id: 11, name_ar: 'طليعة الفجر', name_en: 'Dawn Patrol' },

  // Gawala A (Unit 12)
  { id: 1201, unit_id: 12, name_ar: 'رهط النجاح', name_en: 'Success Crew' },
  { id: 1202, unit_id: 12, name_ar: 'رهط العزيمة', name_en: 'Determination Crew' },
];

export const INITIAL_MEMBERS: Member[] = [
  // 1. Cubs A (Grade 5 Boys)
  {
    id: 'm101',
    member_code: 'SCT-2026-0101',
    unit_id: 1,
    patrol_id: 101,
    full_name_ar: 'دانيال مايكل رزق',
    full_name_en: 'Daniel Michael Rizk',
    date_of_birth: '2016-03-12',
    father_phone: '+201012345001',
    mother_phone: '+201212345001',
    address_ar: '١٥ شارع شبرا، القاهرة',
    school_or_college: 'مدرسة سان جورج',
    academic_year: 'Grade 5',
    sunday_school_class: 'فصل القديس أبانوب',
    father_of_confession: 'أبونا أنطونيوس',
    is_active: true,
  },
  {
    id: 'm102',
    member_code: 'SCT-2026-0102',
    unit_id: 1,
    patrol_id: 102,
    full_name_ar: 'يوسف رامي لمعي',
    full_name_en: 'Youssef Ramy Lamei',
    date_of_birth: '2016-07-25',
    father_phone: '+201012345002',
    mother_phone: '+201212345002',
    address_ar: '٨ شارع الترعة البولاقية، شبرا',
    school_or_college: 'مدرسة الفرير',
    academic_year: 'Grade 5',
    sunday_school_class: 'فصل القديس أبانوب',
    father_of_confession: 'أبونا يوحنا',
    is_active: true,
  },

  // 2. Cubs B (Grade 6 Boys)
  {
    id: 'm201',
    member_code: 'SCT-2026-0201',
    unit_id: 2,
    patrol_id: 201,
    full_name_ar: 'بيتر جورج عزيز',
    full_name_en: 'Peter George Aziz',
    date_of_birth: '2015-02-18',
    father_phone: '+201012345003',
    mother_phone: '+201212345003',
    address_ar: '٢٢ شارع دمشق، مصر الجديدة',
    school_or_college: 'مدرسة سان فنسان',
    academic_year: 'Grade 6',
    sunday_school_class: 'فصل الشهيد فيلوباتير',
    father_of_confession: 'أبونا بولا',
    is_active: true,
  },
  {
    id: 'm202',
    member_code: 'SCT-2026-0202',
    unit_id: 2,
    patrol_id: 202,
    full_name_ar: 'أندرو إيهاب فكري',
    full_name_en: 'Andrew Ihab Fekry',
    date_of_birth: '2015-09-04',
    father_phone: '+201012345004',
    mother_phone: '+201212345004',
    address_ar: '٥ شارع المرغني، مصر الجديدة',
    school_or_college: 'مدرسة الرعاة الصالحين',
    academic_year: 'Grade 6',
    sunday_school_class: 'فصل الشهيد فيلوباتير',
    father_of_confession: 'أبونا أنطونيوس',
    is_active: true,
  },

  // 3. Brownies A (Grade 5 Girls)
  {
    id: 'm301',
    member_code: 'SCT-2026-0301',
    unit_id: 3,
    patrol_id: 301,
    full_name_ar: 'مريم عماد سامي',
    full_name_en: 'Mariam Emad Samy',
    date_of_birth: '2016-04-10',
    father_phone: '+201012345005',
    mother_phone: '+201212345005',
    address_ar: '١٢ شارع هارون الرشيد، مصر الجديدة',
    school_or_college: 'مدرسة القلب المقدس',
    academic_year: 'Grade 5',
    sunday_school_class: 'فصل القديسة دميانة',
    father_of_confession: 'أبونا بيشوي',
    is_active: true,
  },
  {
    id: 'm302',
    member_code: 'SCT-2026-0302',
    unit_id: 3,
    patrol_id: 302,
    full_name_ar: 'كلارا باسل توفيق',
    full_name_en: 'Clara Bassel Tawfik',
    date_of_birth: '2016-11-05',
    father_phone: '+201012345006',
    mother_phone: '+201212345006',
    address_ar: '٣٠ شارع خلوصي، شبرا',
    school_or_college: 'مدرسة الراعي الصالح',
    academic_year: 'Grade 5',
    sunday_school_class: 'فصل القديسة دميانة',
    father_of_confession: 'أبونا يوسف',
    is_active: true,
  },

  // 4. Brownies B (Grade 6 Girls)
  {
    id: 'm401',
    member_code: 'SCT-2026-0401',
    unit_id: 4,
    patrol_id: 401,
    full_name_ar: 'جوي هاني نبيل',
    full_name_en: 'Joy Hany Nabil',
    date_of_birth: '2015-01-22',
    father_phone: '+201012345007',
    mother_phone: '+201212345007',
    address_ar: '١٨ شارع الطيران، مدينة نصر',
    school_or_college: 'مدرسة مير دي ديو',
    academic_year: 'Grade 6',
    sunday_school_class: 'فصل القديسة مارينا',
    father_of_confession: 'أبونا كيرلس',
    is_active: true,
  },
  {
    id: 'm402',
    member_code: 'SCT-2026-0402',
    unit_id: 4,
    patrol_id: 402,
    full_name_ar: 'كريستينا شريف فريد',
    full_name_en: 'Christina Sherif Farid',
    date_of_birth: '2015-08-30',
    father_phone: '+201012345008',
    mother_phone: '+201212345008',
    address_ar: '٧ شارع عباس العقاد، مدينة نصر',
    school_or_college: 'مدرسة سان فنسان دي بول',
    academic_year: 'Grade 6',
    sunday_school_class: 'فصل القديسة مارينا',
    father_of_confession: 'أبونا موسى',
    is_active: true,
  },

  // 5. Scouts A (Prep Boys Parallel Troop A)
  {
    id: 'm501',
    member_code: 'SCT-2026-0501',
    unit_id: 5,
    patrol_id: 1,
    full_name_ar: 'أنطونيوس هاني صبحي',
    full_name_en: 'Antonios Hany Sobhy',
    date_of_birth: '2012-05-14',
    member_phone: '+201112345009',
    father_phone: '+201012345009',
    mother_phone: '+201212345009',
    address_ar: '٩ شارع جزيرة بدران، شبرا',
    school_or_college: 'مدرسة التوفيقية',
    academic_year: 'Prep 2',
    sunday_school_class: 'فصل الشهيد مارجرجس',
    father_of_confession: 'أبونا ساويرس',
    is_active: true,
  },
  {
    id: 'm502',
    member_code: 'SCT-2026-0502',
    unit_id: 5,
    patrol_id: 2,
    full_name_ar: 'فادي سامح سمير',
    full_name_en: 'Fady Sameh Samir',
    date_of_birth: '2013-09-19',
    member_phone: '+201112345010',
    father_phone: '+201012345010',
    mother_phone: '+201212345010',
    address_ar: '١٤ شارع أحمد حلمي، شبرا',
    school_or_college: 'مدرسة النيل الإعدادية',
    academic_year: 'Prep 1',
    sunday_school_class: 'فصل الشهيد مارجرجس',
    father_of_confession: 'أبونا بولا',
    is_active: true,
  },

  // 6. Scouts B (Prep Boys Parallel Troop B)
  {
    id: 'm601',
    member_code: 'SCT-2026-0601',
    unit_id: 6,
    patrol_id: 601,
    full_name_ar: 'ستيفن مدحت عادل',
    full_name_en: 'Steven Medhat Adel',
    date_of_birth: '2012-03-27',
    member_phone: '+201112345011',
    father_phone: '+201012345011',
    mother_phone: '+201212345011',
    address_ar: '٢٥ شارع روض الفرج، القاهرة',
    school_or_college: 'مدرسة روض الفرج التجريبية',
    academic_year: 'Prep 2',
    sunday_school_class: 'فصل القديس أثناسيوس',
    father_of_confession: 'أبونا متى',
    is_active: true,
  },
  {
    id: 'm602',
    member_code: 'SCT-2026-0602',
    unit_id: 6,
    patrol_id: 602,
    full_name_ar: 'ماركوس نبيل زكي',
    full_name_en: 'Markus Nabil Zaki',
    date_of_birth: '2013-10-11',
    member_phone: '+201112345012',
    father_phone: '+201012345012',
    mother_phone: '+201212345012',
    address_ar: '٣ شارع خمارويه، شبرا',
    school_or_college: 'مدرسة سان مارك',
    academic_year: 'Prep 1',
    sunday_school_class: 'فصل القديس أثناسيوس',
    father_of_confession: 'أبونا كيرلس',
    is_active: true,
  },

  // 7. Guides A (Prep Girls Company A)
  {
    id: 'm701',
    member_code: 'SCT-2026-0701',
    unit_id: 7,
    patrol_id: 5,
    full_name_ar: 'فيرينا ماجد فوزي',
    full_name_en: 'Verena Maged Fawzy',
    date_of_birth: '2012-06-15',
    member_phone: '+201112345013',
    father_phone: '+201012345013',
    mother_phone: '+201212345013',
    address_ar: '١١ شارع البستان، مصر الجديدة',
    school_or_college: 'مدرسة كوليدج دي لا سال',
    academic_year: 'Prep 2',
    sunday_school_class: 'فصل القديسة فيرينا',
    father_of_confession: 'أبونا بيشوي',
    is_active: true,
  },
  {
    id: 'm702',
    member_code: 'SCT-2026-0702',
    unit_id: 7,
    patrol_id: 6,
    full_name_ar: 'يوستينا ميلاد فرج',
    full_name_en: 'Justina Milad Farag',
    date_of_birth: '2013-12-01',
    member_phone: '+201112345014',
    father_phone: '+201012345014',
    mother_phone: '+201212345014',
    address_ar: '٦ شارع جسر السويس، عين شمس',
    school_or_college: 'مدرسة الراهبات الفرنسيسكانيات',
    academic_year: 'Prep 1',
    sunday_school_class: 'فصل القديسة فيرينا',
    father_of_confession: 'أبونا يوحنا',
    is_active: true,
  },

  // 8. Guides B (Prep Girls Company B)
  {
    id: 'm801',
    member_code: 'SCT-2026-0801',
    unit_id: 8,
    patrol_id: 801,
    full_name_ar: 'ساندرا تامر شكري',
    full_name_en: 'Sandra Tamer Shoukry',
    date_of_birth: '2012-08-08',
    member_phone: '+201112345015',
    father_phone: '+201012345015',
    mother_phone: '+201212345015',
    address_ar: '٢٠ شارع الأهرام، الكوربة',
    school_or_college: 'مدرسة العائلة المقدسة',
    academic_year: 'Prep 2',
    sunday_school_class: 'فصل القديسة رفقا',
    father_of_confession: 'أبونا أنطونيوس',
    is_active: true,
  },
  {
    id: 'm802',
    member_code: 'SCT-2026-0802',
    unit_id: 8,
    patrol_id: 802,
    full_name_ar: 'بربارة أشرف رمزي',
    full_name_en: 'Barbara Ashraf Ramzy',
    date_of_birth: '2013-04-16',
    member_phone: '+201112345016',
    father_phone: '+201012345016',
    mother_phone: '+201212345016',
    address_ar: '٨ شارع بغداد، مصر الجديدة',
    school_or_college: 'مدرسة سان فنسان دي بول',
    academic_year: 'Prep 1',
    sunday_school_class: 'فصل القديسة رفقا',
    father_of_confession: 'أبونا باخوم',
    is_active: true,
  },

  // 9. Advanced Scouts (Secondary Boys)
  {
    id: 'm901',
    member_code: 'SCT-2026-0901',
    unit_id: 9,
    patrol_id: 901,
    full_name_ar: 'كيرلس رأفت لويس',
    full_name_en: 'Kirollos Raafat Louis',
    date_of_birth: '2009-02-14',
    member_phone: '+201112345017',
    father_phone: '+201012345017',
    mother_phone: '+201212345017',
    address_ar: '٤٥ شارع الخليفة المأمون، مصر الجديدة',
    school_or_college: 'مدرسة القبة الثانوية العسكرية',
    academic_year: 'Sec 2',
    sunday_school_class: 'فصل القديس استفانوس',
    father_of_confession: 'أبونا يوسف',
    is_active: true,
  },
  {
    id: 'm902',
    member_code: 'SCT-2026-0902',
    unit_id: 9,
    patrol_id: 902,
    full_name_ar: 'جون مايكل عاطف',
    full_name_en: 'John Michael Atef',
    date_of_birth: '2010-07-20',
    member_phone: '+201112345018',
    father_phone: '+201012345018',
    mother_phone: '+201212345018',
    address_ar: '١٠ شارع ابن خلدون، شبرا',
    school_or_college: 'مدرسة التوفيقية الثانوية',
    academic_year: 'Sec 1',
    sunday_school_class: 'فصل القديس استفانوس',
    father_of_confession: 'أبونا بولا',
    is_active: true,
  },

  // 10. Senior Guides (Secondary Girls)
  {
    id: 'm1001',
    member_code: 'SCT-2026-1001',
    unit_id: 10,
    patrol_id: 1001,
    full_name_ar: 'مونيكا نادر إبراهيم',
    full_name_en: 'Monica Nader Ibrahim',
    date_of_birth: '2009-05-11',
    member_phone: '+201112345019',
    father_phone: '+201012345019',
    mother_phone: '+201212345019',
    address_ar: '١٣ شارع بطرس غالي، مصر الجديدة',
    school_or_college: 'مدرسة نوتردام دي سيون',
    academic_year: 'Sec 2',
    sunday_school_class: 'فصل القديسة بربارة',
    father_of_confession: 'أبونا كيرلس',
    is_active: true,
  },
  {
    id: 'm1002',
    member_code: 'SCT-2026-1002',
    unit_id: 10,
    patrol_id: 1002,
    full_name_ar: 'ريتا وجدي حنا',
    full_name_en: 'Rita Wagdy Hanna',
    date_of_birth: '2010-10-03',
    member_phone: '+201112345020',
    father_phone: '+201012345020',
    mother_phone: '+201212345020',
    address_ar: '٥ شارع رمسيس، العباسية',
    school_or_college: 'مدرسة السيدة العذراء الفرنسيسكانية',
    academic_year: 'Sec 1',
    sunday_school_class: 'فصل القديسة بربارة',
    father_of_confession: 'أبونا ساويرس',
    is_active: true,
  },

  // 11. Rovers (University / Higher Ed)
  {
    id: 'm1101',
    member_code: 'SCT-2026-1101',
    unit_id: 11,
    patrol_id: 1201,
    full_name_ar: 'بافلوس عادل نصيف',
    full_name_en: 'Pavlos Adel Nassef',
    date_of_birth: '2005-01-19',
    member_phone: '+201112345021',
    father_phone: '+201012345021',
    mother_phone: '+201212345021',
    address_ar: '٧٧ شارع مصطفى النحاس، مدينة نصر',
    school_or_college: 'كلية الهندسة جامعة عين شمس',
    academic_year: 'University Year 3',
    sunday_school_class: 'أسرة الخريجين والجامعيين',
    father_of_confession: 'أبونا ميخائيل',
    is_active: true,
  },
  {
    id: 'm1102',
    member_code: 'SCT-2026-1102',
    unit_id: 11,
    patrol_id: 1202,
    full_name_ar: 'ماريان وائل غالي',
    full_name_en: 'Marian Wael Ghaly',
    date_of_birth: '2006-08-28',
    member_phone: '+201112345022',
    father_phone: '+201012345022',
    mother_phone: '+201212345022',
    address_ar: '٣٢ شارع مكرم عبيد، مدينة نصر',
    school_or_college: 'كلية الصيدلة جامعة القاهرة',
    academic_year: 'University Year 2',
    sunday_school_class: 'أسرة الخريجين والجامعيين',
    father_of_confession: 'أبونا داود',
    is_active: true,
  },
];

export const INITIAL_USERS: User[] = [
  // 1 Leader for each role:
  { id: 'u0', email: 'admin@scouts.org', full_name: 'مدير النظام (System Admin)', phone: '+201000000001', is_active: true },
  { id: 'u1', email: 'peter.shoukry@scouts.org', full_name: 'القائد بيتر شكري (Peter Shoukry)', phone: '+201001112233', is_active: true },
  { id: 'u2', email: 'ihab.fawzy@scouts.org', full_name: 'القائد إيهاب فوزي (Ihab Fawzy)', phone: '+201004445566', is_active: true },
  { id: 'u5', email: 'mariam.sameh@scouts.org', full_name: 'القائدة مريم سامح (Mariam Sameh)', phone: '+201007778899', is_active: true },
  { id: 'u4', email: 'andrew.nabil@scouts.org', full_name: 'القائد أندرو نبيل (Andrew Nabil)', phone: '+201005556677', is_active: true },

  // 1 Leader for each team (All 12 Units):
  { id: 'u11', email: 'fady.george@scouts.org', full_name: 'القائد فادي جورج (Fady George)', phone: '+201011110001', is_active: true },
  { id: 'u12', email: 'mina.adel@scouts.org', full_name: 'القائد مينا عادل (Mina Adel)', phone: '+201011110002', is_active: true },
  { id: 'u13', email: 'sarah.mina@scouts.org', full_name: 'القائدة سارة مينا (Sarah Mina)', phone: '+201011110003', is_active: true },
  { id: 'u14', email: 'marina.youssef@scouts.org', full_name: 'القائدة مارينا يوسف (Marina Youssef)', phone: '+201011110004', is_active: true },
  { id: 'u3',  email: 'mark.wagdy@scouts.org', full_name: 'القائد مارك وجدي (Mark Wagdy)', phone: '+201011110005', is_active: true },
  { id: 'u16', email: 'kirollos.samy@scouts.org', full_name: 'القائد كيرلس سامي (Kirollos Samy)', phone: '+201011110006', is_active: true },
  { id: 'u17', email: 'sandra.magdy@scouts.org', full_name: 'القائدة ساندرا مجدي (Sandra Magdy)', phone: '+201011110007', is_active: true },
  { id: 'u18', email: 'christine.nabil@scouts.org', full_name: 'القائدة كريستين نبيل (Christine Nabil)', phone: '+201011110008', is_active: true },
  { id: 'u19', email: 'george.emil@scouts.org', full_name: 'القائد جورج إميل (George Emil)', phone: '+201011110009', is_active: true },
  { id: 'u20', email: 'lydia.raouf@scouts.org', full_name: 'القائدة ليديا رؤوف (Lydia Raouf)', phone: '+201011110010', is_active: true },
  { id: 'u21', email: 'bishoy.nader@scouts.org', full_name: 'القائد بيشوي نادر (Bishoy Nader)', phone: '+201011110011', is_active: true },
  { id: 'u22', email: 'michael.rafik@scouts.org', full_name: 'القائد ميخائيل رفيق (Michael Rafik)', phone: '+201011110012', is_active: true },
];

export const INITIAL_ROLES: Role[] = [
  { id: 1, name: 'admin', description: 'System Administrator (أدمن النظام) - Full unrestricted CRUD access, statistics, and system administration' },
  { id: 2, name: 'group_leader', description: 'Group Leader (قائد الفوج) - Global view-only access, executive and team analytics' },
  { id: 3, name: 'quartermaster', description: 'Quartermaster (أمين العهدة) - Manages equipment, approves bookings, logs item condition' },
  { id: 4, name: 'section_leader', description: 'Section Leader (قائد وحدة / مرحلة) - Scoped to unit, attendance, members, promotions' },
  { id: 5, name: 'assistant_leader', description: 'Assistant Leader (مساعد قائد) - Scoped to unit, attendance marking, contacts viewing' },
  { id: 6, name: 'media_officer', description: 'Media Officer (مسؤول الإعلام) - Media uploads and Drive archive management' },
];

export const INITIAL_PERMISSIONS: Permission[] = [
  { id: 1, key: 'members.view', category: 'members', description_en: 'View member roster and basic contacts', description_ar: 'عرض كشف الأعضاء وبيانات الاتصال' },
  { id: 2, key: 'members.create_edit', category: 'members', description_en: 'Add/edit member profiles and church details', description_ar: 'إضافة وتعديل بيانات الأعضاء وبيانات الكنيسة' },
  { id: 3, key: 'members.view_confidential', category: 'members', description_en: 'View father of confession, spiritual notes, and medical alerts', description_ar: 'الاطلاع على أب الاعتراف والملاحظات الروحية والطبية' },
  { id: 4, key: 'members.promote', category: 'members', description_en: 'Execute annual stage promotions', description_ar: 'تنفيذ حركة التصعيد السنوي للمراحل' },
  { id: 5, key: 'attendance.take', category: 'attendance', description_en: 'Mark and submit active attendance sessions', description_ar: 'تسجيل وحفظ جلسات الحضور والغياب النشطة' },
  { id: 6, key: 'attendance.edit_history', category: 'attendance', description_en: 'Modify past attendance sessions', description_ar: 'تعديل سجلات وجلسات الحضور السابقة' },
  { id: 7, key: 'attendance.export', category: 'attendance', description_en: 'Export attendance rosters to CSV/Excel', description_ar: 'تصدير كشوف الحضور إلى ملفات إكسيل' },
  { id: 8, key: 'inventory.view', category: 'inventory', description_en: 'View inventory catalog and real-time availability', description_ar: 'استعراض كتالوج العهدة والأرصدة المتاحة' },
  { id: 9, key: 'inventory.book', category: 'inventory', description_en: 'Submit equipment checkout requests', description_ar: 'تقديم طلبات حجز واستعارة مهمات العهدة' },
  { id: 10, key: 'inventory.manage', category: 'inventory', description_en: 'Add/delete inventory items and adjust counts', description_ar: 'إدارة المهمات وتعديل الكميات الإجمالية وحالتها' },
  { id: 11, key: 'inventory.approve', category: 'inventory', description_en: 'Approve or reject checkout requests', description_ar: 'الموافقة على أو رفض طلبات حجز العهدة' },
  { id: 12, key: 'media.upload', category: 'media', description_en: 'Upload event photos/videos to the staging queue', description_ar: 'رفع صور وفيديوهات الفعاليات إلى طابور المعالجة' },
  { id: 13, key: 'media.view_all', category: 'media', description_en: 'Access organizational Drive archives', description_ar: 'استعراض كامل أرشيف الوسائط وجوجل درايف' },
  { id: 14, key: 'users.manage_roles', category: 'admin', description_en: 'Adjust roles, scopes, and custom toggle overrides', description_ar: 'إدارة وتعيين الأدوار والصلاحيات المخصصة للقادة' },
  { id: 15, key: 'admin.analytics', category: 'admin', description_en: 'Access executive analytics and performance metrics', description_ar: 'الوصول إلى لوحة التحليلات المتقدمة وإحصائيات الفوج' },
  { id: 16, key: 'admin.audit_logs', category: 'admin', description_en: 'View and track all actions executed by leaders', description_ar: 'استعراض وتتبع سجل عمليات وتصرفات القادة' },
  { id: 17, key: 'attendance.analytics', category: 'attendance', description_en: 'View attendance analytics and performance metrics for the team', description_ar: 'الاطلاع على إحصائيات وتحليلات الحضور للوحدة' },
];

export const INITIAL_ROLE_PERMISSIONS: { roleId: number; permissionId: number }[] = [
  // 1. Admin gets ALL permissions 1..17 (full unrestricted CRUD, stats, role management)
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((pId) => ({ roleId: 1, permissionId: pId })),

  // 2. Group Leader gets global view-only and analytics permissions
  ...[1, 3, 7, 8, 13, 15, 16, 17].map((pId) => ({ roleId: 2, permissionId: pId })),

  // 3. Quartermaster: inventory view, book, manage, approve
  { roleId: 3, permissionId: 8 },
  { roleId: 3, permissionId: 9 },
  { roleId: 3, permissionId: 10 },
  { roleId: 3, permissionId: 11 },

  // 4. Section Leader: members, attendance, basic inventory book, media upload
  { roleId: 4, permissionId: 1 },
  { roleId: 4, permissionId: 2 },
  { roleId: 4, permissionId: 3 },
  { roleId: 4, permissionId: 4 },
  { roleId: 4, permissionId: 5 },
  { roleId: 4, permissionId: 6 },
  { roleId: 4, permissionId: 7 },
  { roleId: 4, permissionId: 8 },
  { roleId: 4, permissionId: 9 },
  { roleId: 4, permissionId: 12 },
  { roleId: 4, permissionId: 17 }, // attendance.analytics

  // 5. Assistant Leader: view members, mark attendance, book inventory, media upload, team analytics
  { roleId: 5, permissionId: 1 },
  { roleId: 5, permissionId: 5 },
  { roleId: 5, permissionId: 8 },
  { roleId: 5, permissionId: 9 },
  { roleId: 5, permissionId: 12 },
  { roleId: 5, permissionId: 17 }, // attendance.analytics

  // 6. Media Officer: media upload, media view_all
  { roleId: 6, permissionId: 12 },
  { roleId: 6, permissionId: 13 },
];

export const INITIAL_USER_ROLES: UserRole[] = [
  // Global Role Leaders:
  { id: 1, user_id: 'u0', role_id: 1, unit_id: null }, // System Admin
  { id: 2, user_id: 'u1', role_id: 2, unit_id: null }, // Peter Shoukry: Group Leader
  { id: 3, user_id: 'u2', role_id: 3, unit_id: null }, // Ihab Fawzy: Quartermaster
  { id: 4, user_id: 'u5', role_id: 6, unit_id: null }, // Mariam Sameh: Media Officer
  { id: 5, user_id: 'u4', role_id: 5, unit_id: 5 },    // Andrew Nabil: Assistant Leader (Kashafa A)

  // Team Leaders (Section Leader for each of the 12 Units):
  { id: 6,  user_id: 'u11', role_id: 4, unit_id: 1 },  // Fady George (Ashbal A)
  { id: 7,  user_id: 'u12', role_id: 4, unit_id: 2 },  // Mina Adel (Ashbal B)
  { id: 8,  user_id: 'u13', role_id: 4, unit_id: 3 },  // Sarah Mina (Zahrat A)
  { id: 9,  user_id: 'u14', role_id: 4, unit_id: 4 },  // Marina Youssef (Zahrat B)
  { id: 10, user_id: 'u3',  role_id: 4, unit_id: 5 },  // Mark Wagdy (Kashafa A)
  { id: 11, user_id: 'u16', role_id: 4, unit_id: 6 },  // Kirollos Samy (Kashafa B)
  { id: 12, user_id: 'u17', role_id: 4, unit_id: 7 },  // Sandra Magdy (Morshdat A)
  { id: 13, user_id: 'u18', role_id: 4, unit_id: 8 },  // Christine Nabil (Morshdat B)
  { id: 14, user_id: 'u19', role_id: 4, unit_id: 9 },  // George Emil (Motakadem)
  { id: 15, user_id: 'u20', role_id: 4, unit_id: 10 }, // Lydia Raouf (Ra2edat)
  { id: 16, user_id: 'u21', role_id: 4, unit_id: 11 }, // Bishoy Nader (Gawala)
  { id: 17, user_id: 'u22', role_id: 4, unit_id: 12 }, // Michael Rafik (Leadership Staff)
];

export const INITIAL_USER_OVERRIDES: UserPermissionOverride[] = [
  // Andrew Nabil: granted permission to export attendance for Scouts A despite being Assistant Leader
  { id: 1, user_id: 'u4', permission_id: 7, unit_id: 5, is_granted: true },
  // Andrew Nabil: explicitly revoked permission to book inventory
  { id: 2, user_id: 'u4', permission_id: 9, unit_id: 5, is_granted: false },
];

export const INITIAL_EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  { id: 1, name: 'Tents & Shelter (خيام وإيواء)' },
  { id: 2, name: 'Cooking & Kitchen (مهمات طهي ومطبخ)' },
  { id: 3, name: 'Pioneering & Ropes (حبال ومشاريع ريادية)' },
  { id: 4, name: 'Lighting & Electrical (إنارة وكهرباء)' },
  { id: 5, name: 'Sound & AV (صوتيات وإذاعة)' },
];

export const INITIAL_EQUIPMENT: EquipmentItem[] = [
  { id: 1, category_id: 1, name: 'Tent 4-Person Heavy Duty (خيمة 4 أفراد مقاومة للمطر)', sku: 'TNT-001', total_quantity: 25, storage_bay: 'Bay A-1', condition: 'good' },
  { id: 2, category_id: 1, name: 'Marquee Mess Tent 20x10m (صيوان طعام كبير)', sku: 'TNT-002', total_quantity: 3, storage_bay: 'Bay A-2', condition: 'good' },
  { id: 3, category_id: 2, name: 'Propane Camp Stove 2-Burner (موقد غاز مع شعلتين)', sku: 'CKG-001', total_quantity: 10, storage_bay: 'Bay B-1', condition: 'good' },
  { id: 4, category_id: 2, name: 'Stainless Cooking Pots 50L (حلل طهي طعام جماعي)', sku: 'CKG-002', total_quantity: 8, storage_bay: 'Bay B-2', condition: 'good' },
  { id: 5, category_id: 3, name: 'Manila Pioneering Rope 200m (حبل مانيلا ريادة 14مم)', sku: 'ROP-001', total_quantity: 15, storage_bay: 'Bay C-1', condition: 'good' },
  { id: 6, category_id: 3, name: 'Carabiners & Pulleys Set (أطقم شناكل وبكرات تسلق)', sku: 'ROP-002', total_quantity: 20, storage_bay: 'Bay C-2', condition: 'new' },
  { id: 7, category_id: 4, name: 'LED Floodlight 100W with Stand (كشاف ليد ستاند خارجي)', sku: 'LGT-001', total_quantity: 12, storage_bay: 'Bay D-1', condition: 'good' },
  { id: 8, category_id: 4, name: 'Heavy Duty Extension Reel 50m (بكرة سلك تيار مقاومة)', sku: 'LGT-002', total_quantity: 10, storage_bay: 'Bay D-2', condition: 'good' },
  { id: 9, category_id: 5, name: 'Portable PA System 200W + 2 Mics (سماعة متحركة مع مايكين)', sku: 'SND-001', total_quantity: 4, storage_bay: 'Bay E-1', condition: 'good' },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    user_id: 'u3',
    unit_id: 5,
    start_date: '2026-10-01',
    end_date: '2026-10-04',
    purpose: 'Campfire & Pioneering Weekend Camp (مخيم نهاية الأسبوع بوادي النطرون)',
    status: 'approved',
    approved_by: 'u2',
    created_at: '2026-09-10T12:00:00Z',
    items: [
      { booking_id: 'b1', equipment_id: 1, quantity: 10 },
      { booking_id: 'b1', equipment_id: 5, quantity: 4 },
      { booking_id: 'b1', equipment_id: 7, quantity: 3 },
    ],
  },
  {
    id: 'b2',
    user_id: 'u1',
    unit_id: 9,
    start_date: '2026-10-15',
    end_date: '2026-10-18',
    purpose: 'Advanced Scouts Survival Challenge (مخيم البقاء للمتقدم)',
    status: 'pending',
    created_at: '2026-09-14T09:30:00Z',
    items: [
      { booking_id: 'b2', equipment_id: 1, quantity: 8 },
      { booking_id: 'b2', equipment_id: 3, quantity: 3 },
    ],
  },
];

export const INITIAL_MEDIA_JOBS: MediaUploadJob[] = [
  {
    id: 'med-101',
    uploaded_by: 'u5',
    unit_id: 5,
    local_buffer_path: 'D:/ScoutsBuffer/raw_dsc_9021.cr3',
    file_name: 'DSC_9021_FlagRaisingCeremony.cr3',
    mime_type: 'image/x-canon-cr3',
    file_size_bytes: 42800100,
    target_drive_folder_id: '1aB2c3D4e5F6_ScoutsArchive2026',
    status: 'synced',
    retry_count: 0,
    drive_file_id: '1drive_file_abc99238',
    created_at: '2026-09-15T10:15:00Z',
    synced_at: '2026-09-15T10:17:22Z',
  },
  {
    id: 'med-102',
    uploaded_by: 'u5',
    unit_id: 5,
    local_buffer_path: 'D:/ScoutsBuffer/camp_highlights_4k.mp4',
    file_name: 'Camp_Highlights_4K.mp4',
    mime_type: 'video/mp4',
    file_size_bytes: 1845000000,
    target_drive_folder_id: '1aB2c3D4e5F6_ScoutsArchive2026',
    status: 'uploading',
    retry_count: 1,
    created_at: '2026-09-15T16:00:00Z',
  },
  {
    id: 'med-103',
    uploaded_by: 'u3',
    unit_id: 5,
    local_buffer_path: 'D:/ScoutsBuffer/patrol_inspection.jpg',
    file_name: 'Patrol_Inspection_Session_4.jpg',
    mime_type: 'image/jpeg',
    file_size_bytes: 6500000,
    target_drive_folder_id: '1aB2c3D4e5F6_ScoutsArchive2026',
    status: 'queued',
    retry_count: 0,
    created_at: '2026-09-15T18:40:00Z',
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    user_id: 'u3',
    user_name: 'القائد مارك وجدي (Mark Wagdy)',
    user_role_name: 'Section Leader',
    unit_id: 5,
    action_type: 'attendance_saved',
    title_ar: 'تسجيل جلسة حضور وانصراف',
    title_en: 'Attendance Session Recorded',
    description_ar: 'تم تسجيل الحضور الأسبوعي لطليعة النسر والأسد (١٨ حاضر، ٢ غائب، ١ معتذر)',
    description_en: 'Recorded weekly attendance for Kashafa A (18 Present, 2 Absent, 1 Excused)',
    metadata: { session_title: 'اجتماع الجمعة الكشفي', present: 18, absent: 2, excused: 1 },
    created_at: '2026-09-16T17:30:00Z',
  },
  {
    id: 'log-002',
    user_id: 'u3',
    user_name: 'القائد مارك وجدي (Mark Wagdy)',
    user_role_name: 'Section Leader',
    unit_id: 5,
    action_type: 'booking_created',
    title_ar: 'طلب حجز مهمات عهدة مخيم',
    title_en: 'Camp Equipment Booking Request',
    description_ar: 'تم طلب حجز ١٠ خيام ٤ أفراد و٢ موقد غاز لمخيم وادي الريان (١-٤ أكتوبر)',
    description_en: 'Submitted booking request for 10 4-Person Tents and 2 Stoves for Wadi El Rayan Camp',
    metadata: { items_count: 2, total_units: 12, start_date: '2026-10-01', end_date: '2026-10-04' },
    created_at: '2026-09-15T14:15:00Z',
  },
  {
    id: 'log-003',
    user_id: 'u2',
    user_name: 'القائد إيهاب فوزي (Ihab Fawzy)',
    user_role_name: 'Quartermaster',
    unit_id: null,
    action_type: 'booking_approved',
    title_ar: 'اعتماد طلب حجز مهمات',
    title_en: 'Equipment Booking Approved',
    description_ar: 'تمت مراجعة رصيد العهدة واعتماد الحجز رقم b1 لوحدة كشافة A',
    description_en: 'Verified warehouse stock and approved booking b1 for Kashafa A',
    metadata: { booking_id: 'b1', unit_id: 5 },
    created_at: '2026-09-15T16:00:00Z',
  },
  {
    id: 'log-004',
    user_id: 'u1',
    user_name: 'القائد بيتر شكري (Peter Shoukry)',
    user_role_name: 'Group Leader (Super Admin)',
    unit_id: null,
    action_type: 'permission_overridden',
    title_ar: 'تعديل الصلاحيات المخصصة لقائد',
    title_en: 'Leader Permission Override Updated',
    description_ar: 'تم منح صلاحية تصدير الحضور (attendance.export) للقائد أندرو نبيل في كشافة A',
    description_en: 'Granted attendance.export permission override to Andrew Nabil for unit Kashafa A',
    metadata: { target_user: 'u4', permission_key: 'attendance.export', is_granted: true },
    created_at: '2026-09-14T11:20:00Z',
  },
  {
    id: 'log-005',
    user_id: 'u1',
    user_name: 'القائد بيتر شكري (Peter Shoukry)',
    user_role_name: 'Group Leader (Super Admin)',
    unit_id: null,
    action_type: 'permission_overridden',
    title_ar: 'حجب صلاحية حجز العهدة لقائد',
    title_en: 'Leader Booking Permission Revoked',
    description_ar: 'تم حجب صلاحية حجز العهدة (inventory.book) للقائد أندرو نبيل في كشافة A',
    description_en: 'Revoked inventory.book permission override for Andrew Nabil in unit Kashafa A',
    metadata: { target_user: 'u4', permission_key: 'inventory.book', is_granted: false },
    created_at: '2026-09-14T11:25:00Z',
  },
  {
    id: 'log-006',
    user_id: 'u5',
    user_name: 'القائدة مريم سامح (Mariam Sameh)',
    user_role_name: 'Media Officer',
    unit_id: 5,
    action_type: 'media_uploaded',
    title_ar: 'إدراج وسائط في طابور الأرشفة',
    title_en: 'Media Enqueued for Cloud Ingestion',
    description_ar: 'تم رفع فيديو بدقة 4K لمسيرة الكشافة بحجم 1.84 GB إلى المخزن المؤقت',
    description_en: 'Enqueued 1.84 GB 4K video to staging buffer for Google Drive upload',
    metadata: { file_name: 'Camp_Highlights_4K.mp4', file_size: 1845000000 },
    created_at: '2026-09-15T16:00:00Z',
  },
  {
    id: 'log-007',
    user_id: 'u6',
    user_name: 'القائدة سارة مينا (Sarah Mina)',
    user_role_name: 'Section Leader',
    unit_id: 3,
    action_type: 'attendance_saved',
    title_ar: 'تسجيل جلسة حضور وانصراف زهرات A',
    title_en: 'Zahrat A Attendance Session Recorded',
    description_ar: 'تسجيل الحضور الأسبوعي لسداسي الياسمين والبنفسج (٢٢ حاضرة، ١ غائبة)',
    description_en: 'Recorded weekly attendance for Zahrat A (22 Present, 1 Absent)',
    metadata: { unit_id: 3, present: 22, absent: 1 },
    created_at: '2026-09-16T18:10:00Z',
  },
];

// ==========================================================
// YOUTH PROGRESSION HISTORY (Unit Membership Across the Years)
// ==========================================================
export const INITIAL_MEMBER_UNIT_HISTORY: MemberUnitHistory[] = [
  // Scout: Mina Samir Fayez (m1)
  {
    id: 1,
    member_id: 'm1',
    unit_id: 1, // Ashbal A
    patrol_id: 101, // سداسي الذئب
    year: 2024,
    stage_name_ar: 'أشبال A (الصف الخامس الابتدائي)',
    stage_name_en: 'Ashbal A (Grade 5)',
    notes: 'التحاق أولي بمرحلة الأشبال، اجتياز شارة السباحة وشارة العقد',
  },
  {
    id: 2,
    member_id: 'm1',
    unit_id: 2, // Ashbal B
    patrol_id: 201, // سداسي الفهد
    year: 2025,
    stage_name_ar: 'أشبال B (الصف السادس الابتدائي)',
    stage_name_en: 'Ashbal B (Grade 6)',
    notes: 'قائد سداسي، اجتياز مخيم الصداقة بالأشبال',
  },
  {
    id: 3,
    member_id: 'm1',
    unit_id: 5, // Kashafa A
    patrol_id: 1, // طليعة النسر
    year: 2026,
    stage_name_ar: 'كشافة A (المرحلة الإعدادية)',
    stage_name_en: 'Kashafa A (Prep 1-3)',
    notes: 'التصعيد لكشافة A، طليعة النسر، مساعد رائد طليعة',
  },

  // Scout: Youssef Rafik Ibrahim (m2)
  {
    id: 4,
    member_id: 'm2',
    unit_id: 1,
    patrol_id: 101,
    year: 2024,
    stage_name_ar: 'أشبال A (الصف الخامس)',
    stage_name_en: 'Ashbal A (Grade 5)',
  },
  {
    id: 5,
    member_id: 'm2',
    unit_id: 2,
    patrol_id: 201,
    year: 2025,
    stage_name_ar: 'أشبال B (الصف السادس)',
    stage_name_en: 'Ashbal B (Grade 6)',
  },
  {
    id: 6,
    member_id: 'm2',
    unit_id: 5,
    patrol_id: 1,
    year: 2026,
    stage_name_ar: 'كشافة A (المرحلة الإعدادية)',
    stage_name_en: 'Kashafa A (Prep 1-3)',
  },

  // Scout: Fady Maged Samir (m101) - Younger Cub currently in Ashbal
  {
    id: 7,
    member_id: 'm101',
    unit_id: 1,
    patrol_id: 101,
    year: 2025,
    stage_name_ar: 'أشبال A (المستوى الأول)',
    stage_name_en: 'Ashbal A (Level 1)',
  },
  {
    id: 8,
    member_id: 'm101',
    unit_id: 1,
    patrol_id: 101,
    year: 2026,
    stage_name_ar: 'أشبال A (الصف الخامس)',
    stage_name_en: 'Ashbal A (Grade 5)',
  },

  // Guide: Mariam Sherif Azmy (m301)
  {
    id: 9,
    member_id: 'm301',
    unit_id: 3, // Zahrat A
    patrol_id: 301,
    year: 2024,
    stage_name_ar: 'زهرات A (الصف الخامس)',
    stage_name_en: 'Zahrat A (Grade 5)',
  },
  {
    id: 10,
    member_id: 'm301',
    unit_id: 4, // Zahrat B
    patrol_id: 401,
    year: 2025,
    stage_name_ar: 'زهرات B (الصف السادس)',
    stage_name_en: 'Zahrat B (Grade 6)',
  },
  {
    id: 11,
    member_id: 'm301',
    unit_id: 7, // Morshdat A
    patrol_id: 5,
    year: 2026,
    stage_name_ar: 'مرشدات A (المرحلة الإعدادية)',
    stage_name_en: 'Morshdat A (Prep 1-3)',
  },
];

// ==========================================================
// MEDIA ALBUMS (Drive Folders Scoped by Year & Unit)
// ==========================================================
export const INITIAL_MEDIA_ALBUMS: MediaAlbum[] = [
  // Ashbal 2024 (Unit 1)
  {
    id: 'alb-ashbal-2024-camp',
    unit_id: 1,
    year: 2024,
    event_name: 'Summer_Camp_St_Mark_2024',
    event_name_ar: 'مخيم مارمرقس الصيفي للأشبال 2024',
    cover_image_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
    photo_count: 8,
    drive_folder_id: '1drive_folder_ashbal_2024_camp',
    date: '2024-07-20',
  },
  {
    id: 'alb-ashbal-2024-promise',
    unit_id: 1,
    year: 2024,
    event_name: 'Promise_and_Investiture_2024',
    event_name_ar: 'حفل الوعد والقبول للأشبال 2024',
    cover_image_url: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=80',
    photo_count: 5,
    drive_folder_id: '1drive_folder_ashbal_2024_promise',
    date: '2024-11-15',
  },

  // Ashbal B 2025 (Unit 2)
  {
    id: 'alb-ashbal-2025-safari',
    unit_id: 2,
    year: 2025,
    event_name: 'Wadi_Degla_Exploration_2025',
    event_name_ar: 'رحلة وادي دجلة الاستكشافية 2025',
    cover_image_url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
    photo_count: 7,
    drive_folder_id: '1drive_folder_ashbal_2025_safari',
    date: '2025-04-18',
  },
  {
    id: 'alb-ashbal-2025-sports',
    unit_id: 2,
    year: 2025,
    event_name: 'Sports_Day_Tournament_2025',
    event_name_ar: 'الدوري الرياضي ومهرجان الألعاب 2025',
    cover_image_url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
    photo_count: 6,
    drive_folder_id: '1drive_folder_ashbal_2025_sports',
    date: '2025-10-10',
  },

  // Kashafa A 2026 (Unit 5)
  {
    id: 'alb-kashafa-2026-rayan',
    unit_id: 5,
    year: 2026,
    event_name: 'Wadi_Rayan_Desert_Camp_2026',
    event_name_ar: 'مخيم وادي الريان الكشفي الكبير 2026',
    cover_image_url: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=800&q=80',
    photo_count: 14,
    drive_folder_id: '1drive_folder_kashafa_2026_rayan',
    date: '2026-02-12',
  },
  {
    id: 'alb-kashafa-2026-inspection',
    unit_id: 5,
    year: 2026,
    event_name: 'Patrol_Inspection_Pioneering_2026',
    event_name_ar: 'مهرجان الريادة ونماذج الحبال للطلائع 2026',
    cover_image_url: 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=800&q=80',
    photo_count: 9,
    drive_folder_id: '1drive_folder_kashafa_2026_inspection',
    date: '2026-08-25',
  },

  // Zahrat A 2024 (Unit 3)
  {
    id: 'alb-zahrat-2024-camp',
    unit_id: 3,
    year: 2024,
    event_name: 'Spring_Flower_Camp_2024',
    event_name_ar: 'مخيم الزهرات الربيعي 2024',
    cover_image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    photo_count: 6,
    drive_folder_id: '1drive_folder_zahrat_2024_camp',
    date: '2024-04-14',
  },

  // Morshdat A 2026 (Unit 7)
  {
    id: 'alb-morshdat-2026-leadership',
    unit_id: 7,
    year: 2026,
    event_name: 'Morshdat_Leadership_Challenge_2026',
    event_name_ar: 'معسكر القيادة والتحدي للمرشدات 2026',
    cover_image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    photo_count: 10,
    drive_folder_id: '1drive_folder_morshdat_2026_camp',
    date: '2026-07-08',
  },
];

// ==========================================================
// MEDIA ITEMS (Photos inside Albums)
// ==========================================================
export const INITIAL_MEDIA_ITEMS: MediaItem[] = [
  // Photos for Ashbal 2024 Camp (alb-ashbal-2024-camp)
  {
    id: 'img-ashbal-01',
    album_id: 'alb-ashbal-2024-camp',
    unit_id: 1,
    year: 2024,
    file_name: 'IMG_2024_Ashbal_Campfire.jpg',
    title_ar: 'حلقة السمر حول نار المخيم الكشفي للأشبال',
    title_en: 'Ashbal Campfire & Songs Night',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=85',
    thumbnail_url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=75',
    date: '2024-07-20',
    tags: ['نار السمر', 'سداسيات', 'مخيم الصيف'],
  },
  {
    id: 'img-ashbal-02',
    album_id: 'alb-ashbal-2024-camp',
    unit_id: 1,
    year: 2024,
    file_name: 'IMG_2024_Ashbal_FlagRaising.jpg',
    title_ar: 'تحية العلم وطابور الصباح بالزي الكشفي الكامل',
    title_en: 'Morning Flag Ceremony in Full Uniform',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=85',
    thumbnail_url: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=400&q=75',
    date: '2024-07-21',
    tags: ['تحية العلم', 'الأشبال'],
  },
  {
    id: 'img-ashbal-03',
    album_id: 'alb-ashbal-2024-camp',
    unit_id: 1,
    year: 2024,
    file_name: 'IMG_2024_Tent_Pitching.jpg',
    title_ar: 'مسابقة نصب الخيام المربعة بين السداسيات',
    title_en: 'Sixes Tent Pitching Competition',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=85',
    thumbnail_url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=400&q=75',
    date: '2024-07-22',
    tags: ['خيام', 'مهارات خلوية'],
  },

  // Photos for Ashbal B 2025 Safari (alb-ashbal-2025-safari)
  {
    id: 'img-ashbal-04',
    album_id: 'alb-ashbal-2025-safari',
    unit_id: 2,
    year: 2025,
    file_name: 'IMG_2025_Wadi_Degla_Trek.jpg',
    title_ar: 'مسير وادي دجلة البيئي وقراءة البوصلة',
    title_en: 'Wadi Degla Eco Trek & Compass Reading',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85',
    thumbnail_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=75',
    date: '2025-04-18',
    tags: ['سفاري', 'بوصلة', 'أشبال B'],
  },
  {
    id: 'img-ashbal-05',
    album_id: 'alb-ashbal-2025-safari',
    unit_id: 2,
    year: 2025,
    file_name: 'IMG_2025_Knot_Tying_Badge.jpg',
    title_ar: 'ورشة شارة العقد والربطات الكشفية لسداسي الفهد',
    title_en: 'Knots and Lashings Workshop for Panther Six',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=1200&q=85',
    thumbnail_url: 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=400&q=75',
    date: '2025-04-19',
    tags: ['عقد وربطات', 'شارات'],
  },

  // Photos for Kashafa A 2026 Camp (alb-kashafa-2026-rayan)
  {
    id: 'img-kashafa-01',
    album_id: 'alb-kashafa-2026-rayan',
    unit_id: 5,
    year: 2026,
    file_name: 'IMG_2026_Patrol_Eagle_Tower.jpg',
    title_ar: 'برج المراقبة الكشفي من عمل طليعة النسر (كشافة A)',
    title_en: 'Scout Watchtower Constructed by Eagle Patrol',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=1200&q=85',
    thumbnail_url: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=400&q=75',
    date: '2026-02-12',
    tags: ['ريادة كشفية', 'طليعة النسر', 'وادي الريان'],
  },
  {
    id: 'img-kashafa-02',
    album_id: 'alb-kashafa-2026-rayan',
    unit_id: 5,
    year: 2026,
    file_name: 'IMG_2026_Campfire_Council.jpg',
    title_ar: 'مجلس السمر السنوي وتبادل الأناشيد الكشفية',
    title_en: 'Annual Campfire Council & Scout Anthems',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85',
    thumbnail_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=75',
    date: '2026-02-13',
    tags: ['نار السمر', 'كشافة A'],
  },
  {
    id: 'img-kashafa-03',
    album_id: 'alb-kashafa-2026-rayan',
    unit_id: 5,
    year: 2026,
    file_name: 'IMG_2026_Patrol_Cooking.jpg',
    title_ar: 'طهي خلوي في الهواء الطلق لطليعة النسر',
    title_en: 'Outdoor Pioneering Camp Cooking',
    media_type: 'image',
    url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=85',
    thumbnail_url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=400&q=75',
    date: '2026-02-14',
    tags: ['طهي خلوي', 'طليعة النسر'],
  },
];

// ==========================================================
// SCOUT ATTENDANCE HISTORICAL SESSIONS & STATS
// ==========================================================
export interface ScoutSessionRecord {
  id: string;
  member_id: string;
  session_date: string;
  session_title_ar: string;
  session_title_en: string;
  unit_name_ar: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  notes?: string;
}

export const INITIAL_SCOUT_SESSION_RECORDS: ScoutSessionRecord[] = [
  // Mina Samir (m1) Attendance Record
  { id: 'att-m1-01', member_id: 'm1', session_date: '2026-09-25', session_title_ar: 'اجتماع التدريب الكشفي الأسبوعي', session_title_en: 'Weekly Scout Drill', unit_name_ar: 'كشافة A', status: 'present', notes: 'حضور مبكر ومتميز بالزي' },
  { id: 'att-m1-02', member_id: 'm1', session_date: '2026-09-18', session_title_ar: 'ورشة الريادة ونماذج الحبال', session_title_en: 'Pioneering Workshop', unit_name_ar: 'كشافة A', status: 'present', notes: 'إتقان عقدة الوتد والدورة المربعة' },
  { id: 'att-m1-03', member_id: 'm1', session_date: '2026-09-11', session_title_ar: 'مسير استكشافي خفيف', session_title_en: 'Short Hike', unit_name_ar: 'كشافة A', status: 'late', notes: 'تأخر ١٥ دقيقة بعذر مسبق' },
  { id: 'att-m1-04', member_id: 'm1', session_date: '2026-09-04', session_title_ar: 'مهرجان الافتتاح السنوي للفوج', session_title_en: 'Opening Season Festival', unit_name_ar: 'كشافة A', status: 'present' },
  { id: 'att-m1-05', member_id: 'm1', session_date: '2026-08-28', session_title_ar: 'اجتماع طليعة النسر التنسيقي', session_title_en: 'Eagle Patrol Council', unit_name_ar: 'كشافة A', status: 'present' },
  { id: 'att-m1-06', member_id: 'm1', session_date: '2026-08-21', session_title_ar: 'ورشة الإسعافات الأولية والشارات', session_title_en: 'First Aid Badge Session', unit_name_ar: 'كشافة A', status: 'excused', notes: 'سفر عائلي معتذر' },
  { id: 'att-m1-07', member_id: 'm1', session_date: '2026-08-14', session_title_ar: 'تدريب الفرقة الموسيقية الكشفية', session_title_en: 'Scout March Band Training', unit_name_ar: 'كشافة A', status: 'present' },
  { id: 'att-m1-08', member_id: 'm1', session_date: '2026-08-07', session_title_ar: 'يوم الخدمة العامة والبيئة', session_title_en: 'Community Service Day', unit_name_ar: 'كشافة A', status: 'present' },
  { id: 'att-m1-09', member_id: 'm1', session_date: '2026-07-31', session_title_ar: 'معسكر تدريبي ليوم واحد', session_title_en: 'One-Day Training Camp', unit_name_ar: 'كشافة A', status: 'present' },
  { id: 'att-m1-10', member_id: 'm1', session_date: '2026-07-24', session_title_ar: 'اجتماع الجمعة الكشفي', session_title_en: 'Friday Scout Assembly', unit_name_ar: 'كشافة A', status: 'present' },

  // Fady Maged (m101) Cub Attendance
  { id: 'att-m101-01', member_id: 'm101', session_date: '2026-09-25', session_title_ar: 'اجتماع سداسي الذئب الأسبوعي', session_title_en: 'Wolf Six Meeting', unit_name_ar: 'أشبال A', status: 'present' },
  { id: 'att-m101-02', member_id: 'm101', session_date: '2026-09-18', session_title_ar: 'ألعاب حركية ومسابقات الأشبال', session_title_en: 'Cub Scout Games', unit_name_ar: 'أشبال A', status: 'present' },
  { id: 'att-m101-03', member_id: 'm101', session_date: '2026-09-11', session_title_ar: 'حفظ شريعة الغاب والوعد', session_title_en: 'Cub Scout Law & Promise', unit_name_ar: 'أشبال A', status: 'present' },
];


