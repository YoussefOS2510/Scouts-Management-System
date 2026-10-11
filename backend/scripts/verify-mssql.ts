import sql from 'mssql/msnodesqlv8';

async function verifyMssql() {
  console.log('--- 1. Testing Connection to Microsoft SQL Server 2025 ---');

  const connectionString = 
    process.env.MSSQL_CONNECTION_STRING || 
    'Driver={ODBC Driver 18 for SQL Server};Server=(local);Database=ScoutsDB;Trusted_Connection=yes;TrustServerCertificate=yes;';

  const pool = new sql.ConnectionPool({
    connectionString,
  });
  await pool.connect();
  console.log('[PASS] Connected successfully to Microsoft SQL Server 2025 (ScoutsDB)!');

  console.log('\n--- 2. Verifying Tables and Zero Dummy Data ---');
  const result = await pool.request().query(`
    SELECT 
        t.name AS TableName,
        p.rows AS RowCounts
    FROM sys.tables t
    INNER JOIN sys.partitions p ON t.object_id = p.object_id
    WHERE p.index_id IN (0,1)
    ORDER BY t.name;
  `);

  const counts: Record<string, number> = {};
  for (const row of result.recordset) {
    const num = Number(row.RowCounts);
    counts[row.TableName] = num;
    console.log(`  - Table [${row.TableName}]: ${num} rows`);
  }

  // Assertions for operational tables
  if (counts['members'] !== 22) throw new Error(`Expected 22 kids (2 per age group/unit), found ${counts['members']}`);
  if (counts['users'] !== 17) throw new Error(`Expected 17 leaders (1 per role + 1 per team), found ${counts['users']}`);
  if (counts['user_roles'] < 17 || counts['user_roles'] > 18) throw new Error(`Expected 17-18 role assignments, found ${counts['user_roles']}`);
  if (counts['attendance_records'] !== 0) throw new Error(`Expected 0 attendance records, found ${counts['attendance_records']}`);
  if (counts['equipment'] !== 9) throw new Error(`Expected 9 equipment catalog items, found ${counts['equipment']}`);
  if (counts['bookings'] !== 0) throw new Error(`Expected 0 bookings, found ${counts['bookings']}`);
  if (counts['audit_logs'] !== 0) throw new Error(`Expected 0 audit logs, found ${counts['audit_logs']}`);
  console.log('[PASS] Operational tables confirmed: exactly 22 kids (2 per age group) and 17 leaders!');

  // Assertions for baseline structural seeds
  if (counts['units'] !== 12) throw new Error(`Expected 12 units, found ${counts['units']}`);
  if (counts['roles'] !== 7) throw new Error(`Expected 7 roles, found ${counts['roles']}`);
  if (counts['permissions'] !== 20) throw new Error(`Expected 20 permissions, found ${counts['permissions']}`);
  console.log('[PASS] Organizational units (12), roles (7), permissions (20) verified!');

  console.log('\n--- 3. Testing T-SQL fn_check_leader_permission ---');
  const permCheck = await pool.request().query(`
    DECLARE @admin_id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = 'admin@scouts.org');
    SELECT 
        dbo.fn_check_leader_permission(@admin_id, 'users.manage_roles', NULL) AS can_manage_roles,
        dbo.fn_check_leader_permission(@admin_id, 'attendance.take', 5) AS can_take_att_unit5,
        dbo.fn_check_leader_permission(@admin_id, 'inventory.manage', NULL) AS can_manage_inventory;
  `);

  const perms = permCheck.recordset[0];
  console.log(`  - Admin users.manage_roles: ${perms.can_manage_roles} (Expected: true)`);
  console.log(`  - Admin attendance.take (Unit 5): ${perms.can_take_att_unit5} (Expected: true)`);
  console.log(`  - Admin inventory.manage: ${perms.can_manage_inventory} (Expected: true)`);

  if (!perms.can_manage_roles || !perms.can_take_att_unit5 || !perms.can_manage_inventory) {
    throw new Error('fn_check_leader_permission verification failed on SQL Server');
  }

  await pool.close();
  console.log('\n>>> ALL MICROSOFT SQL SERVER VERIFICATIONS PASSED SUCCESSFULLY! <<<');
}

verifyMssql().catch((err) => {
  console.error('MSSQL Verification Error:', err);
  process.exit(1);
});
