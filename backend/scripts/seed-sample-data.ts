import pg from 'pg';

const { Client } = pg;

async function seedSampleData() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://scouts-db_owner:npg_8CWYvpAEG4jt@ep-bitter-sky-b9osi6ia-pooler.c-7.eu-central-1.aws.neon.tech/scouts-db?sslmode=require';

  console.log('🔄 Connecting to Neon Cloud PostgreSQL...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected successfully!');

  // 1. Seed Equipment Catalog
  console.log('📦 Seeding equipment catalog...');
  const equipmentItems = [
    { cat: 1, name: 'Tent 4-Person Heavy Duty (خيمة 4 أفراد مقاومة للمطر)', sku: 'TNT-001', qty: 25, bay: 'Bay A-1', cond: 'good' },
    { cat: 1, name: 'Marquee Mess Tent 20x10m (صيوان طعام كبير)', sku: 'TNT-002', qty: 4, bay: 'Bay A-2', cond: 'good' },
    { cat: 2, name: 'Propane Camp Stove 2-Burner (موقد غاز مع شعلتين)', sku: 'CKG-001', qty: 12, bay: 'Bay B-1', cond: 'good' },
    { cat: 2, name: 'Stainless Cooking Pots 50L (حلل طهي طعام جماعي)', sku: 'CKG-002', qty: 8, bay: 'Bay B-2', cond: 'good' },
    { cat: 3, name: 'Manila Pioneering Rope 200m (حبل مانيلا ريادة 14مم)', sku: 'ROP-001', qty: 15, bay: 'Bay C-1', cond: 'good' },
    { cat: 3, name: 'Carabiners & Pulleys Set (أطقم شناكل وبكرات تسلق)', sku: 'ROP-002', qty: 20, bay: 'Bay C-2', cond: 'good' },
    { cat: 4, name: 'LED Floodlight 100W with Stand (كشاف ليد ستاند خارجي)', sku: 'LGT-001', qty: 12, bay: 'Bay D-1', cond: 'good' },
    { cat: 4, name: 'Heavy Duty Extension Reel 50m (بكرة سلك تيار مقاومة)', sku: 'LGT-002', qty: 10, bay: 'Bay D-2', cond: 'good' },
    { cat: 5, name: 'Portable PA System 200W + 2 Mics (سماعة متحركة مع مايكين)', sku: 'SND-001', qty: 4, bay: 'Bay E-1', cond: 'good' },
  ];

  for (const item of equipmentItems) {
    await client.query(`
      INSERT INTO equipment (category_id, name, sku, total_quantity, storage_bay, condition)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (sku) DO UPDATE 
      SET total_quantity = EXCLUDED.total_quantity, name = EXCLUDED.name;
    `, [item.cat, item.name, item.sku, item.qty, item.bay, item.cond]);
  }
  console.log(`✅ Seeded ${equipmentItems.length} equipment items.`);

  // 2. Seed Realistic Members across units
  console.log('👥 Seeding member roster across units...');
  const unitsRes = await client.query('SELECT id, code, name_ar FROM units ORDER BY id ASC');
  const units = unitsRes.rows;

  const sampleKids = [
    { name_ar: 'مارك مينا رزق', name_en: 'Mark Mina Rizk', dob: '2014-03-15', yr: 'Primary 5', phone: '01221111111', f_phone: '01222222222' },
    { name_ar: 'أنطونيو فادي صليب', name_en: 'Antonio Fady Salib', dob: '2014-07-22', yr: 'Primary 5', phone: '01223333333', f_phone: '01224444444' },
    { name_ar: 'بيشوي جورج توفيق', name_en: 'Bishoy George Tawfik', dob: '2013-05-10', yr: 'Primary 6', phone: '01225555555', f_phone: '01226666666' },
    { name_ar: 'كيرلس عماد نصحي', name_en: 'Kyrillos Emad Noshy', dob: '2013-11-04', yr: 'Primary 6', phone: '01227777777', f_phone: '01228888888' },
    { name_ar: 'مارينا مايكل صبحي', name_en: 'Marina Michael Sobhy', dob: '2014-04-18', yr: 'Primary 5', phone: '01229999999', f_phone: '01201111111' },
    { name_ar: 'فيرونيكا إيهاب حبيب', name_en: 'Veronica Ihab Habib', dob: '2014-09-30', yr: 'Primary 5', phone: '01202222222', f_phone: '01203333333' },
    { name_ar: 'يوستينا نادر فرج', name_en: 'Justina Nader Farag', dob: '2013-02-14', yr: 'Primary 6', phone: '01204444444', f_phone: '01205555555' },
    { name_ar: 'سيلفيا سامح رمزي', name_en: 'Silvia Sameh Ramzy', dob: '2013-08-08', yr: 'Primary 6', phone: '01206666666', f_phone: '01207777777' },
    { name_ar: 'ديفيد رفيق بشرى', name_en: 'David Rafik Boshra', dob: '2011-06-25', yr: 'Prep 2', phone: '01208888888', f_phone: '01209999999' },
    { name_ar: 'فادي هاني مسعود', name_en: 'Fady Hany Masoud', dob: '2010-01-19', yr: 'Prep 3', phone: '01211111111', f_phone: '01212222222' },
    { name_ar: 'يوسف مجدي غالي', name_en: 'Youssef Magdy Ghaly', dob: '2011-10-12', yr: 'Prep 2', phone: '01213333333', f_phone: '01214444444' },
    { name_ar: 'مينا أشرف لبيب', name_en: 'Mina Ashraf Labib', dob: '2010-12-05', yr: 'Prep 3', phone: '01215555555', f_phone: '01216666666' },
    { name_ar: 'ساندرا رأفت وليم', name_en: 'Sandra Raafat William', dob: '2011-03-29', yr: 'Prep 2', phone: '01217777777', f_phone: '01218888888' },
    { name_ar: 'جوانا ميلاد أسعد', name_en: 'Joanna Milad Asaad', dob: '2010-08-16', yr: 'Prep 3', phone: '01219999999', f_phone: '01231111111' },
    { name_ar: 'مارتينا عادل فهمي', name_en: 'Martina Adel Fahmy', dob: '2011-09-02', yr: 'Prep 2', phone: '01232222222', f_phone: '01233333333' },
    { name_ar: 'كارولين باهر شكري', name_en: 'Caroline Baher Shokry', dob: '2010-05-11', yr: 'Prep 3', phone: '01234444444', f_phone: '01235555555' },
    { name_ar: 'جون بيتر يوسف', name_en: 'John Peter Youssef', dob: '2008-04-14', yr: 'Secondary 2', phone: '01236666666', f_phone: '01237777777' },
    { name_ar: 'توماس أسامة عوض', name_en: 'Thomas Osama Awad', dob: '2007-11-20', yr: 'Secondary 3', phone: '01238888888', f_phone: '01239999999' },
    { name_ar: 'ميرنا صفوت كامل', name_en: 'Mirna Safwat Kamel', dob: '2008-02-18', yr: 'Secondary 2', phone: '01241111111', f_phone: '01242222222' },
    { name_ar: 'جانيت أمير لمعي', name_en: 'Janet Amir Lamei', dob: '2007-06-30', yr: 'Secondary 3', phone: '01243333333', f_phone: '01244444444' },
    { name_ar: 'رامز إبراهيم عازر', name_en: 'Ramez Ibrahim Azer', dob: '2004-09-12', yr: 'University 2', phone: '01245555555', f_phone: '01246666666' },
    { name_ar: 'ستيفن منير غطاس', name_en: 'Stephen Mounir Ghattas', dob: '2003-01-25', yr: 'University 3', phone: '01247777777', f_phone: '01248888888' },
  ];

  let memberCount = 0;
  for (let i = 0; i < sampleKids.length; i++) {
    const kid = sampleKids[i];
    const unitIndex = Math.min(Math.floor(i / 2), units.length - 1);
    const unit = units[unitIndex];
    const memberCode = `SCT-${String(i + 101).padStart(4, '0')}`;

    // Get a patrol for this unit if exists
    const pRes = await client.query('SELECT id FROM patrols WHERE unit_id = $1 LIMIT 1', [unit.id]);
    const patrolId = pRes.rows[0]?.id || null;

    await client.query(`
      INSERT INTO members (
        member_code, pin_hash, unit_id, patrol_id,
        full_name_ar, full_name_en, date_of_birth,
        member_phone, father_phone, mother_phone,
        address_ar, address_en, school_or_college,
        academic_year, sunday_school_class, father_of_confession,
        notes, is_active
      ) VALUES (
        $1, '1234', $2, $3,
        $4, $5, $6,
        $7, $8, $8,
        'ش الترعة المرقسية، شبرا، القاهرة', 'Teraa St, Shobra, Cairo', 'مدرسة سان مارك',
        $9, 'فصل القديس أثناسيوس', 'القمص متى باسيليوس',
        'عضو ملتزم ومتميز كشفياً', TRUE
      )
      ON CONFLICT (member_code) DO NOTHING;
    `, [
      memberCode, unit.id, patrolId,
      kid.name_ar, kid.name_en, kid.dob,
      kid.phone, kid.f_phone, kid.yr
    ]);
    memberCount++;
  }
  console.log(`✅ Seeded ${memberCount} members into members table.`);

  // 3. Seed Sample Attendance Sessions & Records
  console.log('📅 Seeding sample attendance sessions...');
  const adminRes = await client.query("SELECT id FROM users WHERE email = 'admin@scouts.org' LIMIT 1");
  const adminId = adminRes.rows[0]?.id;

  const ashbalUnit = units.find(u => u.code === 'cubs_a') || units[0];
  const kashafaUnit = units.find(u => u.code === 'scouts_a') || units[1];

  // Session 1: Ashbal meeting
  const sess1Res = await client.query(`
    INSERT INTO attendance_sessions (unit_id, session_date, session_title, recorded_by)
    VALUES ($1, '2026-10-09', 'اجتماع سداسيات الجمعة الافتتاحي', $2)
    ON CONFLICT (unit_id, session_date) DO UPDATE SET session_title = EXCLUDED.session_title
    RETURNING id;
  `, [ashbalUnit.id, adminId]);
  const sess1Id = sess1Res.rows[0]?.id;

  // Session 2: Kashafa meeting
  const sess2Res = await client.query(`
    INSERT INTO attendance_sessions (unit_id, session_date, session_title, recorded_by)
    VALUES ($1, '2026-10-09', 'تجمع طليعة النسر والأسد الأسبوعي', $2)
    ON CONFLICT (unit_id, session_date) DO UPDATE SET session_title = EXCLUDED.session_title
    RETURNING id;
  `, [kashafaUnit.id, adminId]);
  const sess2Id = sess2Res.rows[0]?.id;

  // Populate records for session 1
  const ashbalMembers = await client.query('SELECT id FROM members WHERE unit_id = $1', [ashbalUnit.id]);
  for (const m of ashbalMembers.rows) {
    await client.query(`
      INSERT INTO attendance_records (session_id, member_id, status, notes)
      VALUES ($1, $2, 'present', 'حاضر بالزي الكشفي الكامل')
      ON CONFLICT (session_id, member_id) DO NOTHING;
    `, [sess1Id, m.id]);
  }

  // Populate records for session 2
  const kashafaMembers = await client.query('SELECT id FROM members WHERE unit_id = $1', [kashafaUnit.id]);
  for (const m of kashafaMembers.rows) {
    await client.query(`
      INSERT INTO attendance_records (session_id, member_id, status, notes)
      VALUES ($1, $2, 'present', 'حاضر بالزي الكشفي الكامل')
      ON CONFLICT (session_id, member_id) DO NOTHING;
    `, [sess2Id, m.id]);
  }
  console.log('✅ Seeded attendance sessions and attendance records.');

  // 4. Seed an Active Equipment Booking
  console.log('⛺ Seeding an active equipment checkout booking...');
  const tentEq = await client.query("SELECT id FROM equipment WHERE sku = 'TNT-001' LIMIT 1");
  if (tentEq.rows.length > 0) {
    const bookingRes = await client.query(`
      INSERT INTO bookings (user_id, unit_id, start_date, end_date, purpose, status, approved_by)
      VALUES ($1, $2, '2026-10-16', '2026-10-18', 'مخيم القيادة الخلوي السنوي لوحدة الكشافة', 'approved', $1)
      RETURNING id;
    `, [adminId, kashafaUnit.id]);
    const bookingId = bookingRes.rows[0]?.id;

    await client.query(`
      INSERT INTO booking_items (booking_id, equipment_id, quantity)
      VALUES ($1, $2, 6);
    `, [bookingId, tentEq.rows[0].id]);
    console.log('✅ Seeded approved equipment checkout booking.');
  }

  console.log('\n🎉 Real operational testing data has been successfully injected into Neon DB!\n');
  await client.end();
}

seedSampleData().catch((err) => {
  console.error('❌ Failed to seed sample data:', err);
  process.exit(1);
});
