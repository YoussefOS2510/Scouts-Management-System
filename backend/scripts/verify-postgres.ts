import pg from 'pg';

const { Pool } = pg;

async function verifyPostgres() {
  console.log('--- 1. Testing Connection to PostgreSQL 16 ---');

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_CONNECTION_STRING ||
    'postgresql://postgres:postgrespassword@localhost:5432/scouts_db';

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  console.log('[PASS] Connected successfully to PostgreSQL (scouts_db)!');

  try {
    console.log('\n--- 2. Verifying Tables and Structural Seeds ---');
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log(`Found ${res.rows.length} public tables.`);
    for (const row of res.rows) {
      const countRes = await client.query(`SELECT COUNT(*) AS c FROM "${row.table_name}"`);
      console.log(`  - Table [${row.table_name}]: ${countRes.rows[0].c} rows`);
    }

    console.log('\n--- 3. Verifying System Admin & Permissions Function ---');
    const adminRes = await client.query(`SELECT id, email, full_name FROM users WHERE email = 'admin@scouts.org'`);
    if (adminRes.rows.length === 0) {
      throw new Error('System Admin not found in users table!');
    }
    const admin = adminRes.rows[0];
    console.log(`  [PASS] Admin found: ${admin.full_name} (${admin.email})`);

    const permRes = await client.query(`
      SELECT fn_check_leader_permission($1, 'attendance.take', NULL) AS is_granted
    `, [admin.id]);
    console.log(`  [PASS] fn_check_leader_permission returned: ${permRes.rows[0].is_granted}`);

    console.log('\n[SUCCESS] PostgreSQL database verification passed cleanly!');
  } finally {
    client.release();
    await pool.end();
  }
}

verifyPostgres().catch((err) => {
  console.error('[FAIL] PostgreSQL verification failed:', err.message);
  process.exit(1);
});
