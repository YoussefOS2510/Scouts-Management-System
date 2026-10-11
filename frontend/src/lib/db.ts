import pg from 'pg';

const { Pool } = pg;

const defaultConnectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_CONNECTION_STRING ||
  'postgresql://postgres:postgrespassword@localhost:5432/scouts_db';

const isCloud =
  defaultConnectionString.includes('sslmode=require') ||
  defaultConnectionString.includes('neon.tech') ||
  defaultConnectionString.includes('supabase.co') ||
  defaultConnectionString.includes('render.com') ||
  process.env.NODE_ENV === 'production';

export const poolConfig: pg.PoolConfig = {
  connectionString: defaultConnectionString,
  max: 30,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: isCloud && !defaultConnectionString.includes('localhost') && !defaultConnectionString.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : undefined,
};

let poolInstance: pg.Pool | null = null;

export function getDbPool(): pg.Pool {
  if (!poolInstance) {
    poolInstance = new Pool(poolConfig);
    poolInstance.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]:', err);
    });
  }
  return poolInstance;
}

export type QueryParam = { name?: string; type?: any; value: any };

export async function query<T = any>(
  queryText: string,
  params?: Record<string, QueryParam> | QueryParam[] | any[]
): Promise<T[]> {
  const pool = getDbPool();

  let pgSql = queryText;
  const paramValues: any[] = [];
  let index = 1;

  if (params) {
    if (Array.isArray(params)) {
      const isNamed = params.length > 0 && typeof params[0] === 'object' && 'name' in params[0];
      if (isNamed) {
        const map = new Map<string, any>();
        for (const p of params as QueryParam[]) {
          if (p.name) map.set(p.name, p.value);
        }
        pgSql = pgSql.replace(/@([a-zA-Z0-9_]+)/g, (match, name) => {
          if (map.has(name)) {
            paramValues.push(map.get(name));
            return `$${index++}`;
          }
          return match;
        });
      } else {
        paramValues.push(...params);
      }
    } else if (typeof params === 'object') {
      const map = new Map<string, any>();
      for (const [key, p] of Object.entries(params)) {
        const name = (p as any)?.name || key;
        const val = (p as any)?.value !== undefined ? (p as any).value : p;
        map.set(name, val);
      }
      pgSql = pgSql.replace(/@([a-zA-Z0-9_]+)/g, (match, name) => {
        if (map.has(name)) {
          paramValues.push(map.get(name));
          return `$${index++}`;
        }
        return match;
      });
    }
  }

  // Compatibility: Handle T-SQL TOP n -> LIMIT n
  if (/\bTOP\s+(\d+)\b/i.test(pgSql)) {
    const match = pgSql.match(/\bTOP\s+(\d+)\b/i);
    const limitNum = match ? match[1] : '1';
    pgSql = pgSql.replace(/\bTOP\s+\d+\b/gi, '');
    if (!/\bLIMIT\b/i.test(pgSql)) {
      pgSql = `${pgSql.trim().replace(/;$/, '')} LIMIT ${limitNum}`;
    }
  }

  // Remove dbo. schema prefix if present
  pgSql = pgSql.replace(/\bdbo\./gi, '');

  const result = await pool.query(pgSql, paramValues);
  return result.rows as T[];
}

export async function checkLeaderPermission(
  userId: string,
  permissionKey: string,
  unitId?: number | null
): Promise<boolean> {
  const rows = await query<{ is_granted: boolean }>(
    `SELECT fn_check_leader_permission($1, $2, $3) AS is_granted`,
    [userId, permissionKey, unitId ?? null]
  );

  return Boolean(rows[0]?.is_granted);
}

// Mock sql type tokens for backwards compatibility with existing route imports
export const sql = {
  Int: 'int',
  BigInt: 'bigint',
  VarChar: (n?: number) => 'varchar',
  NVarChar: (n?: number | string) => 'varchar',
  UniqueIdentifier: 'uuid',
  Date: 'date',
  DateTime2: 'timestamptz',
  Bit: 'boolean',
  Text: 'text',
  MAX: 'max',
};

export { poolInstance as pool };
