import sql from 'mssql/msnodesqlv8';

/**
 * Microsoft SQL Server Database Configuration & Connection Pool
 * Supports:
 * 1. Windows Integrated Security (Default for local Microsoft SQL Server 2025 installation)
 * 2. SQL Server Authentication (via environment variables MSSQL_USER / MSSQL_PASSWORD)
 */
const defaultConnectionString = 
  process.env.MSSQL_CONNECTION_STRING || 
  'Driver={ODBC Driver 18 for SQL Server};Server=(local);Database=ScoutsDB;Trusted_Connection=yes;TrustServerCertificate=yes;';

export const sqlConfig = {
  connectionString: defaultConnectionString,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getDbPool(): Promise<sql.ConnectionPool> {
  if (!pool || !pool.connected) {
    pool = new sql.ConnectionPool(sqlConfig);
    await pool.connect();
  }
  return pool;
}

/**
 * Executes a T-SQL query and returns rows
 */
export async function query<T = any>(
  queryText: string,
  params?: Record<string, { type: sql.ISqlType; value: any }>
): Promise<T[]> {
  const db = await getDbPool();
  const request = db.request();

  if (params) {
    for (const [key, { type, value }] of Object.entries(params)) {
      request.input(key, type, value);
    }
  }

  const result = await request.query(queryText);
  return result.recordset as T[];
}

/**
 * Evaluates leader permission via SQL Server stored procedure/function
 */
export async function checkLeaderPermission(
  userId: string,
  permissionKey: string,
  unitId?: number | null
): Promise<boolean> {
  const rows = await query<{ is_granted: boolean }>(
    `SELECT dbo.fn_check_leader_permission(@userId, @permKey, @unitId) AS is_granted`,
    {
      userId: { type: sql.UniqueIdentifier, value: userId },
      permKey: { type: sql.NVarChar(80), value: permissionKey },
      unitId: { type: sql.Int, value: unitId ?? null },
    }
  );

  return Boolean(rows[0]?.is_granted);
}

export { sql };
