import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://scouts-db_owner:npg_8CWYvpAEG4jt@ep-bitter-sky-b9osi6ia-pooler.c-7.eu-central-1.aws.neon.tech/scouts-db?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

const leaders = [
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

async function seedLeaders() {
  console.log('🔄 Seeding leaders into Neon cloud database...');
  for (const l of leaders) {
    const userRes = await pool.query(`
      INSERT INTO users (id, email, password_hash, full_name, phone, is_active)
      VALUES ($1, $2, 'pbkdf2_sha256$260000$password123', $3, $4, TRUE)
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone
      RETURNING id;
    `, [l.id, l.email, l.fullName, l.phone]);

    const userId = userRes.rows[0].id;

    const unitCodes = [l.unitCode, ...(l.additionalUnitCodes || [])].filter(Boolean);
    if (unitCodes.length === 0) {
      unitCodes.push(null);
    }

    for (const uCode of unitCodes) {
      await pool.query(`
        INSERT INTO user_roles (user_id, role_id, unit_id)
        VALUES (
          $1,
          (SELECT id FROM roles WHERE name = $2),
          CASE WHEN $3::text IS NOT NULL THEN (SELECT id FROM units WHERE code = $3) ELSE NULL END
        )
        ON CONFLICT DO NOTHING;
      `, [userId, l.roleName, uCode]);
    }
    console.log(`  + Seeded leader: ${l.fullName} (${l.email})`);
  }

  console.log('\n--- Current Users in Database ---');
  const allUsers = await pool.query(`
    SELECT u.id, u.email, u.full_name, u.phone, r.name AS role_name, r.description AS role_desc,
           un.name_ar AS unit_name_ar, un.code AS unit_code
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    LEFT JOIN units un ON un.id = ur.unit_id
    ORDER BY u.email ASC;
  `);
  console.log(`Total users/roles in DB: ${allUsers.rows.length}`);
  console.log(JSON.stringify(allUsers.rows, null, 2));

  await pool.end();
}

seedLeaders().catch(err => {
  console.error(err);
  process.exit(1);
});
