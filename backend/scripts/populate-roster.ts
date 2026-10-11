import sql from 'mssql/msnodesqlv8';

const connectionString = 
  process.env.MSSQL_CONNECTION_STRING || 
  'Driver={ODBC Driver 18 for SQL Server};Server=(local);Database=ScoutsDB;Trusted_Connection=yes;TrustServerCertificate=yes;';

async function main() {
  console.log('Connecting to Microsoft SQL Server 2025 (ScoutsDB)...');
  const pool = new sql.ConnectionPool({ connectionString });
  await pool.connect();
  console.log('Connected successfully!');

  // 1. Clean existing records in proper FK order
  console.log('\n--- 1. Cleaning Existing Records ---');
  await pool.request().query(`
    DELETE FROM attendance_records;
    DELETE FROM attendance_sessions;
    DELETE FROM member_unit_history;
    DELETE FROM booking_items;
    DELETE FROM bookings;
    DELETE FROM audit_logs;
    DELETE FROM media_items;
    DELETE FROM media_albums;
    DELETE FROM media_upload_queue;
    DELETE FROM members;
    DELETE FROM user_permission_overrides;
    DELETE FROM user_roles;
    DELETE FROM users;
  `);
  console.log('Cleared all previous members, users, and user roles.');

  // 2. Ensure all units have standard patrols
  console.log('\n--- 2. Ensuring Patrols for All Units ---');
  await pool.request().query(`
    -- Ashbal B
    DECLARE @u2 INT = (SELECT id FROM units WHERE code = 'cubs_b');
    IF NOT EXISTS (SELECT 1 FROM patrols WHERE unit_id = @u2)
      INSERT INTO patrols (unit_id, name_ar, name_en) VALUES
        (@u2, N'سداسي الفهد', N'Panther Six'),
        (@u2, N'سداسي الوشق', N'Lynx Six');

    -- Zahrat A
    DECLARE @u3 INT = (SELECT id FROM units WHERE code = 'brownies_a');
    IF NOT EXISTS (SELECT 1 FROM patrols WHERE unit_id = @u3)
      INSERT INTO patrols (unit_id, name_ar, name_en) VALUES
        (@u3, N'سداسي الياسمين', N'Jasmine Six'),
        (@u3, N'سداسي البنفسج', N'Violet Six');

    -- Zahrat B
    DECLARE @u4 INT = (SELECT id FROM units WHERE code = 'brownies_b');
    IF NOT EXISTS (SELECT 1 FROM patrols WHERE unit_id = @u4)
      INSERT INTO patrols (unit_id, name_ar, name_en) VALUES
        (@u4, N'سداسي التيوليب', N'Tulip Six'),
        (@u4, N'سداسي الجوري', N'Damask Rose Six');

    -- Kashafa B
    DECLARE @u6 INT = (SELECT id FROM units WHERE code = 'scouts_b');
    IF NOT EXISTS (SELECT 1 FROM patrols WHERE unit_id = @u6)
      INSERT INTO patrols (unit_id, name_ar, name_en) VALUES
        (@u6, N'طليعة الشاهين', N'Peregrine Patrol'),
        (@u6, N'طليعة الذئب', N'Wolf Patrol');

    -- Morshdat B
    DECLARE @u8 INT = (SELECT id FROM units WHERE code = 'guides_b');
    IF NOT EXISTS (SELECT 1 FROM patrols WHERE unit_id = @u8)
      INSERT INTO patrols (unit_id, name_ar, name_en) VALUES
        (@u8, N'طليعة السلام', N'Peace Patrol'),
        (@u8, N'طليعة العطاء', N'Giving Patrol');

    -- Motakadem
    DECLARE @u9 INT = (SELECT id FROM units WHERE code = 'advanced_scouts');
    IF NOT EXISTS (SELECT 1 FROM patrols WHERE unit_id = @u9)
      INSERT INTO patrols (unit_id, name_ar, name_en) VALUES
        (@u9, N'طليعة الفرسان', N'Knights Patrol'),
        (@u9, N'طليعة الرواد', N'Pioneers Patrol');

    -- Ra2edat
    DECLARE @u10 INT = (SELECT id FROM units WHERE code = 'senior_guides');
    IF NOT EXISTS (SELECT 1 FROM patrols WHERE unit_id = @u10)
      INSERT INTO patrols (unit_id, name_ar, name_en) VALUES
        (@u10, N'طليعة العاصفة', N'Storm Patrol'),
        (@u10, N'طليعة البركان', N'Volcano Patrol');

    -- Gawala
    DECLARE @u11 INT = (SELECT id FROM units WHERE code = 'rovers');
    IF NOT EXISTS (SELECT 1 FROM patrols WHERE unit_id = @u11)
      INSERT INTO patrols (unit_id, name_ar, name_en) VALUES
        (@u11, N'رهط النجاح', N'Success Crew'),
        (@u11, N'رهط العزيمة', N'Determination Crew');
  `);

  // 3. Insert Leaders: 1 for each role + 1 for each team
  console.log('\n--- 3. Inserting Leaders (Role Leaders + Team Leaders) ---');
  
  interface LeaderDef {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    roleName: string;
    unitCode?: string;
  }

  const leaders: LeaderDef[] = [
    // 1 for each role:
    { id: '11111111-0000-0000-0000-000000000001', email: 'admin@scouts.org', fullName: 'مدير النظام (System Admin)', phone: '+201000000001', roleName: 'admin' },
    { id: '11111111-0000-0000-0000-000000000002', email: 'peter.shoukry@scouts.org', fullName: 'القائد بيتر شكري (Peter Shoukry)', phone: '+201001112233', roleName: 'group_leader' },
    { id: '11111111-0000-0000-0000-000000000003', email: 'ihab.fawzy@scouts.org', fullName: 'القائد إيهاب فوزي (Ihab Fawzy)', phone: '+201004445566', roleName: 'quartermaster' },
    { id: '11111111-0000-0000-0000-000000000004', email: 'mariam.sameh@scouts.org', fullName: 'القائدة مريم سامح (Mariam Sameh)', phone: '+201007778899', roleName: 'media_officer' },
    { id: '11111111-0000-0000-0000-000000000005', email: 'andrew.nabil@scouts.org', fullName: 'القائد أندرو نبيل (Andrew Nabil)', phone: '+201005556677', roleName: 'assistant_leader', unitCode: 'scouts_a' },

    // 1 leader for each team (Section Leader for all 12 Units):
    { id: '11111111-0000-0000-0000-000000000011', email: 'fady.george@scouts.org', fullName: 'القائد فادي جورج (Fady George)', phone: '+201011110001', roleName: 'section_leader', unitCode: 'cubs_a' },
    { id: '11111111-0000-0000-0000-000000000012', email: 'mina.adel@scouts.org', fullName: 'القائد مينا عادل (Mina Adel)', phone: '+201011110002', roleName: 'section_leader', unitCode: 'cubs_b' },
    { id: '11111111-0000-0000-0000-000000000013', email: 'sarah.mina@scouts.org', fullName: 'القائدة سارة مينا (Sarah Mina)', phone: '+201011110003', roleName: 'section_leader', unitCode: 'brownies_a' },
    { id: '11111111-0000-0000-0000-000000000014', email: 'marina.youssef@scouts.org', fullName: 'القائدة مارينا يوسف (Marina Youssef)', phone: '+201011110004', roleName: 'section_leader', unitCode: 'brownies_b' },
    { id: '11111111-0000-0000-0000-000000000015', email: 'mark.wagdy@scouts.org', fullName: 'القائد مارك وجدي (Mark Wagdy)', phone: '+201011110005', roleName: 'section_leader', unitCode: 'scouts_a' },
    { id: '11111111-0000-0000-0000-000000000016', email: 'kirollos.samy@scouts.org', fullName: 'القائد كيرلس سامي (Kirollos Samy)', phone: '+201011110006', roleName: 'section_leader', unitCode: 'scouts_b' },
    { id: '11111111-0000-0000-0000-000000000017', email: 'sandra.magdy@scouts.org', fullName: 'القائدة ساندرا مجدي (Sandra Magdy)', phone: '+201011110007', roleName: 'section_leader', unitCode: 'guides_a' },
    { id: '11111111-0000-0000-0000-000000000018', email: 'christine.nabil@scouts.org', fullName: 'القائدة كريستين نبيل (Christine Nabil)', phone: '+201011110008', roleName: 'media_officer', unitCode: 'guides_a', additionalUnitCodes: ['guides_b'] },
    { id: '11111111-0000-0000-0000-000000000019', email: 'george.emil@scouts.org', fullName: 'القائد جورج إميل (George Emil)', phone: '+201011110009', roleName: 'section_leader', unitCode: 'advanced_scouts' },
    { id: '11111111-0000-0000-0000-000000000020', email: 'lydia.raouf@scouts.org', fullName: 'القائدة ليديا رؤوف (Lydia Raouf)', phone: '+201011110010', roleName: 'section_leader', unitCode: 'senior_guides' },
    { id: '11111111-0000-0000-0000-000000000021', email: 'bishoy.nader@scouts.org', fullName: 'القائد بيشوي نادر (Bishoy Nader)', phone: '+201011110011', roleName: 'section_leader', unitCode: 'rovers' },
    { id: '11111111-0000-0000-0000-000000000022', email: 'michael.rafik@scouts.org', fullName: 'القائد ميخائيل رفيق (Michael Rafik)', phone: '+201011110012', roleName: 'section_leader', unitCode: 'leaders' },
  ];

  for (const l of leaders) {
    const userReq = pool.request();
    userReq.input('id', sql.UniqueIdentifier, l.id);
    userReq.input('email', sql.NVarChar(255), l.email);
    userReq.input('password_hash', sql.NVarChar(255), 'pbkdf2_sha256$260000$password123');
    userReq.input('full_name', sql.NVarChar(150), l.fullName);
    userReq.input('phone', sql.NVarChar(20), l.phone);

    await userReq.query(`
      INSERT INTO users (id, email, password_hash, full_name, phone, is_active)
      VALUES (@id, @email, @password_hash, @full_name, @phone, 1);
    `);

    const unitCodes = [l.unitCode, ...((l as any).additionalUnitCodes || [])].filter(Boolean);
    if (unitCodes.length === 0) {
      unitCodes.push(null);
    }

    for (const uCode of unitCodes) {
      const roleReq = pool.request();
      roleReq.input('userId', sql.UniqueIdentifier, l.id);
      roleReq.input('roleName', sql.NVarChar(50), l.roleName);
      roleReq.input('unitCode', sql.NVarChar(50), uCode ?? null);

      await roleReq.query(`
        DECLARE @rId INT = (SELECT id FROM roles WHERE name = @roleName);
        DECLARE @uId INT = CASE WHEN @unitCode IS NOT NULL THEN (SELECT id FROM units WHERE code = @unitCode) ELSE NULL END;
        INSERT INTO user_roles (user_id, role_id, unit_id)
        VALUES (@userId, @rId, @uId);
      `);
    }

    console.log(`  + Leader: ${l.fullName} [Role: ${l.roleName}, Units: ${unitCodes.join(', ')}]`);
  }

  // 4. Insert Kids (2 kids for each youth age group / team = 22 kids total)
  console.log('\n--- 4. Inserting Kids (2 Kids for Each Age Group / Team) ---');

  interface KidDef {
    code: string;
    unitCode: string;
    nameAr: string;
    nameEn: string;
    dob: string;
    fatherPhone: string;
    motherPhone: string;
    memberPhone?: string;
    addressAr: string;
    school: string;
    grade: string;
    fatherConfession: string;
  }

  const kids: KidDef[] = [
    // 1. Cubs A (Grade 5 Boys)
    {
      code: 'SCT-2026-0101', unitCode: 'cubs_a', nameAr: 'دانيال مايكل رزق', nameEn: 'Daniel Michael Rizk',
      dob: '2016-03-12', fatherPhone: '+201012345001', motherPhone: '+201212345001', addressAr: '١٥ شارع شبرا، القاهرة',
      school: 'مدرسة سان جورج', grade: 'Grade 5', fatherConfession: 'أبونا أنطونيوس'
    },
    {
      code: 'SCT-2026-0102', unitCode: 'cubs_a', nameAr: 'يوسف رامي لمعي', nameEn: 'Youssef Ramy Lamei',
      dob: '2016-07-25', fatherPhone: '+201012345002', motherPhone: '+201212345002', addressAr: '٨ شارع الترعة البولاقية',
      school: 'مدرسة الفرير', grade: 'Grade 5', fatherConfession: 'أبونا يوحنا'
    },

    // 2. Cubs B (Grade 6 Boys)
    {
      code: 'SCT-2026-0201', unitCode: 'cubs_b', nameAr: 'بيتر جورج عزيز', nameEn: 'Peter George Aziz',
      dob: '2015-02-18', fatherPhone: '+201012345003', motherPhone: '+201212345003', addressAr: '٢٢ شارع دمشق، مصر الجديدة',
      school: 'مدرسة سان فنسان', grade: 'Grade 6', fatherConfession: 'أبونا بولا'
    },
    {
      code: 'SCT-2026-0202', unitCode: 'cubs_b', nameAr: 'أندرو إيهاب فكري', nameEn: 'Andrew Ihab Fekry',
      dob: '2015-09-04', fatherPhone: '+201012345004', motherPhone: '+201212345004', addressAr: '٥ شارع المرغني، مصر الجديدة',
      school: 'مدرسة الرعاة الصالحين', grade: 'Grade 6', fatherConfession: 'أبونا أنطونيوس'
    },

    // 3. Brownies A (Grade 5 Girls)
    {
      code: 'SCT-2026-0301', unitCode: 'brownies_a', nameAr: 'مريم عماد سامي', nameEn: 'Mariam Emad Samy',
      dob: '2016-04-10', fatherPhone: '+201012345005', motherPhone: '+201212345005', addressAr: '١٢ شارع هارون الرشيد، مصر الجديدة',
      school: 'مدرسة القلب المقدس', grade: 'Grade 5', fatherConfession: 'أبونا بيشوي'
    },
    {
      code: 'SCT-2026-0302', unitCode: 'brownies_a', nameAr: 'كلارا باسل توفيق', nameEn: 'Clara Bassel Tawfik',
      dob: '2016-11-05', fatherPhone: '+201012345006', motherPhone: '+201212345006', addressAr: '٣٠ شارع خلوصي، شبرا',
      school: 'مدرسة الراعي الصالح', grade: 'Grade 5', fatherConfession: 'أبونا يوسف'
    },

    // 4. Brownies B (Grade 6 Girls)
    {
      code: 'SCT-2026-0401', unitCode: 'brownies_b', nameAr: 'جوي هاني نبيل', nameEn: 'Joy Hany Nabil',
      dob: '2015-01-22', fatherPhone: '+201012345007', motherPhone: '+201212345007', addressAr: '١٨ شارع الطيران، مدينة نصر',
      school: 'مدرسة مير دي ديو', grade: 'Grade 6', fatherConfession: 'أبونا كيرلس'
    },
    {
      code: 'SCT-2026-0402', unitCode: 'brownies_b', nameAr: 'كريستينا شريف فريد', nameEn: 'Christina Sherif Farid',
      dob: '2015-08-30', fatherPhone: '+201012345008', motherPhone: '+201212345008', addressAr: '٧ شارع عباس العقاد، مدينة نصر',
      school: 'مدرسة سان فنسان دي بول', grade: 'Grade 6', fatherConfession: 'أبونا موسى'
    },

    // 5. Scouts A (Prep Boys Parallel Troop A)
    {
      code: 'SCT-2026-0501', unitCode: 'scouts_a', nameAr: 'أنطونيوس هاني صبحي', nameEn: 'Antonios Hany Sobhy',
      dob: '2012-05-14', fatherPhone: '+201012345009', motherPhone: '+201212345009', memberPhone: '+201112345009',
      addressAr: '٩ شارع جزيرة بدران، شبرا', school: 'مدرسة التوفيقية', grade: 'Prep 2', fatherConfession: 'أبونا ساويرس'
    },
    {
      code: 'SCT-2026-0502', unitCode: 'scouts_a', nameAr: 'فادي سامح سمير', nameEn: 'Fady Sameh Samir',
      dob: '2013-09-19', fatherPhone: '+201012345010', motherPhone: '+201212345010', memberPhone: '+201112345010',
      addressAr: '١٤ شارع أحمد حلمي، شبرا', school: 'مدرسة النيل الإعدادية', grade: 'Prep 1', fatherConfession: 'أبونا بولا'
    },

    // 6. Scouts B (Prep Boys Parallel Troop B)
    {
      code: 'SCT-2026-0601', unitCode: 'scouts_b', nameAr: 'ستيفن مدحت عادل', nameEn: 'Steven Medhat Adel',
      dob: '2012-03-27', fatherPhone: '+201012345011', motherPhone: '+201212345011', memberPhone: '+201112345011',
      addressAr: '٢٥ شارع روض الفرج، القاهرة', school: 'مدرسة روض الفرج التجريبية', grade: 'Prep 2', fatherConfession: 'أبونا متى'
    },
    {
      code: 'SCT-2026-0602', unitCode: 'scouts_b', nameAr: 'ماركوس نبيل زكي', nameEn: 'Markus Nabil Zaki',
      dob: '2013-10-11', fatherPhone: '+201012345012', motherPhone: '+201212345012', memberPhone: '+201112345012',
      addressAr: '٣ شارع خمارويه، شبرا', school: 'مدرسة سان مارك', grade: 'Prep 1', fatherConfession: 'أبونا كيرلس'
    },

    // 7. Guides A (Prep Girls Parallel Company A)
    {
      code: 'SCT-2026-0701', unitCode: 'guides_a', nameAr: 'فيرينا ماجد فوزي', nameEn: 'Verena Maged Fawzy',
      dob: '2012-06-15', fatherPhone: '+201012345013', motherPhone: '+201212345013', memberPhone: '+201112345013',
      addressAr: '١١ شارع البستان، مصر الجديدة', school: 'مدرسة كوليدج دي لا سال', grade: 'Prep 2', fatherConfession: 'أبونا بيشوي'
    },
    {
      code: 'SCT-2026-0702', unitCode: 'guides_a', nameAr: 'يوستينا ميلاد فرج', nameEn: 'Justina Milad Farag',
      dob: '2013-12-01', fatherPhone: '+201012345014', motherPhone: '+201212345014', memberPhone: '+201112345014',
      addressAr: '٦ شارع جسر السويس، عين شمس', school: 'مدرسة الراهبات الفرنسيسكانيات', grade: 'Prep 1', fatherConfession: 'أبونا يوحنا'
    },

    // 8. Guides B (Prep Girls Parallel Company B)
    {
      code: 'SCT-2026-0801', unitCode: 'guides_b', nameAr: 'ساندرا تامر شكري', nameEn: 'Sandra Tamer Shoukry',
      dob: '2012-08-08', fatherPhone: '+201012345015', motherPhone: '+201212345015', memberPhone: '+201112345015',
      addressAr: '٢٠ شارع الأهرام، الكوربة', school: 'مدرسة العائلة المقدسة', grade: 'Prep 2', fatherConfession: 'أبونا أنطونيوس'
    },
    {
      code: 'SCT-2026-0802', unitCode: 'guides_b', nameAr: 'بربارة أشرف رمزي', nameEn: 'Barbara Ashraf Ramzy',
      dob: '2013-04-16', fatherPhone: '+201012345016', motherPhone: '+201212345016', memberPhone: '+201112345016',
      addressAr: '٨ شارع بغداد، مصر الجديدة', school: 'مدرسة سان فنسان دي بول', grade: 'Prep 1', fatherConfession: 'أبونا باخوم'
    },

    // 9. Advanced Scouts (Secondary Boys)
    {
      code: 'SCT-2026-0901', unitCode: 'advanced_scouts', nameAr: 'كيرلس رأفت لويس', nameEn: 'Kirollos Raafat Louis',
      dob: '2009-02-14', fatherPhone: '+201012345017', motherPhone: '+201212345017', memberPhone: '+201112345017',
      addressAr: '٤٥ شارع الخليفة المأمون، مصر الجديدة', school: 'مدرسة القبة الثانوية العسكرية', grade: 'Sec 2', fatherConfession: 'أبونا يوسف'
    },
    {
      code: 'SCT-2026-0902', unitCode: 'advanced_scouts', nameAr: 'جون مايكل عاطف', nameEn: 'John Michael Atef',
      dob: '2010-07-20', fatherPhone: '+201012345018', motherPhone: '+201212345018', memberPhone: '+201112345018',
      addressAr: '١٠ شارع ابن خلدون، شبرا', school: 'مدرسة التوفيقية الثانوية', grade: 'Sec 1', fatherConfession: 'أبونا بولا'
    },

    // 10. Senior Guides (Secondary Girls)
    {
      code: 'SCT-2026-1001', unitCode: 'senior_guides', nameAr: 'مونيكا نادر إبراهيم', nameEn: 'Monica Nader Ibrahim',
      dob: '2009-05-11', fatherPhone: '+201012345019', motherPhone: '+201212345019', memberPhone: '+201112345019',
      addressAr: '١٣ شارع بطرس غالي، مصر الجديدة', school: 'مدرسة نوتردام دي سيون', grade: 'Sec 2', fatherConfession: 'أبونا كيرلس'
    },
    {
      code: 'SCT-2026-1002', unitCode: 'senior_guides', nameAr: 'ريتا وجدي حنا', nameEn: 'Rita Wagdy Hanna',
      dob: '2010-10-03', fatherPhone: '+201012345020', motherPhone: '+201212345020', memberPhone: '+201112345020',
      addressAr: '٥ شارع رمسيس، العباسية', school: 'مدرسة السيدة العذراء الفرنسيسكانية', grade: 'Sec 1', fatherConfession: 'أبونا ساويرس'
    },

    // 11. Rovers (University Higher Ed)
    {
      code: 'SCT-2026-1101', unitCode: 'rovers', nameAr: 'بافلوس عادل نصيف', nameEn: 'Pavlos Adel Nassef',
      dob: '2005-01-19', fatherPhone: '+201012345021', motherPhone: '+201212345021', memberPhone: '+201112345021',
      addressAr: '٧٧ شارع مصطفى النحاس، مدينة نصر', school: 'كلية الهندسة جامعة عين شمس', grade: 'University Year 3', fatherConfession: 'أبونا ميخائيل'
    },
    {
      code: 'SCT-2026-1102', unitCode: 'rovers', nameAr: 'ماريان وائل غالي', nameEn: 'Marian Wael Ghaly',
      dob: '2006-08-28', fatherPhone: '+201012345022', motherPhone: '+201212345022', memberPhone: '+201112345022',
      addressAr: '٣٢ شارع مكرم عبيد، مدينة نصر', school: 'كلية الصيدلة جامعة القاهرة', grade: 'University Year 2', fatherConfession: 'أبونا داود'
    },
  ];

  for (const k of kids) {
    const kidReq = pool.request();
    kidReq.input('code', sql.NVarChar(50), k.code);
    kidReq.input('unitCode', sql.NVarChar(50), k.unitCode);
    kidReq.input('nameAr', sql.NVarChar(255), k.nameAr);
    kidReq.input('nameEn', sql.NVarChar(255), k.nameEn);
    kidReq.input('dob', sql.Date, k.dob);
    kidReq.input('fatherPhone', sql.NVarChar(20), k.fatherPhone);
    kidReq.input('motherPhone', sql.NVarChar(20), k.motherPhone);
    kidReq.input('memberPhone', sql.NVarChar(20), k.memberPhone ?? null);
    kidReq.input('addressAr', sql.NVarChar(sql.MAX), k.addressAr);
    kidReq.input('school', sql.NVarChar(200), k.school);
    kidReq.input('fatherConfession', sql.NVarChar(150), k.fatherConfession);

    await kidReq.query(`
      DECLARE @unitId INT = (SELECT id FROM units WHERE code = @unitCode);
      DECLARE @patrolId INT = (SELECT TOP 1 id FROM patrols WHERE unit_id = @unitId ORDER BY id ASC);

      INSERT INTO members (
        id, member_code, pin_hash, unit_id, patrol_id, full_name_ar, full_name_en,
        date_of_birth, father_phone, mother_phone, member_phone, address_ar,
        school_or_college, academic_year, sunday_school_class, father_of_confession, is_active
      ) VALUES (
        NEWID(), @code, '1234', @unitId, @patrolId, @nameAr, @nameEn,
        @dob, @fatherPhone, @motherPhone, @memberPhone, @addressAr,
        @school, '2026-2027', N'فصل مدارس الأحد', @fatherConfession, 1
      );
    `);

    console.log(`  + Kid: ${k.code} - ${k.nameAr} (${k.nameEn}) [Unit: ${k.unitCode}]`);
  }

  // 5. Verification
  console.log('\n--- 5. Database Population Verification ---');
  const countUsers = await pool.request().query('SELECT COUNT(*) AS total FROM users');
  const countMembers = await pool.request().query('SELECT COUNT(*) AS total FROM members');
  const countRoles = await pool.request().query('SELECT COUNT(*) AS total FROM user_roles');
  const unitsSummary = await pool.request().query(`
    SELECT u.code, u.name_ar, u.name_en, COUNT(m.id) AS kids_count
    FROM units u
    LEFT JOIN members m ON m.unit_id = u.id
    WHERE u.is_leadership = 0
    GROUP BY u.code, u.name_ar, u.name_en, u.id
    ORDER BY u.id
  `);

  console.log(`Total Leaders in Database: ${countUsers.recordset[0].total}`);
  console.log(`Total Role Assignments:    ${countRoles.recordset[0].total}`);
  console.log(`Total Kids in Database:    ${countMembers.recordset[0].total}`);
  console.log('\nKids per Unit:');
  for (const row of unitsSummary.recordset) {
    console.log(`  - [${row.code}] ${row.name_ar} (${row.name_en}): ${row.kids_count} kids`);
  }

  await pool.close();
  console.log('\nAll database operations completed successfully!');
}

main().catch((err) => {
  console.error('Population error:', err);
  process.exit(1);
});
