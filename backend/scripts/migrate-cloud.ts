import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

async function migrateCloud() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('\n❌ ERROR: DATABASE_URL environment variable is not set!');
    console.log('Usage:');
    console.log('  $env:DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/scouts_db?sslmode=require"');
    console.log('  npm run migrate:cloud\n');
    process.exit(1);
  }

  console.log('🔄 Connecting to Cloud PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Required for cloud databases like Neon / Supabase
  });

  await client.connect();
  console.log('✅ Connected successfully!');

  const dbDir = path.join(process.cwd(), 'backend', 'db');
  const schemaSql = fs.readFileSync(path.join(dbDir, 'schema.sql'), 'utf8');
  const functionsSql = fs.readFileSync(path.join(dbDir, 'functions.sql'), 'utf8');
  const seedSql = fs.readFileSync(path.join(dbDir, 'seed.sql'), 'utf8');

  console.log('📦 Executing schema.sql (tables, indexes, UUIDs)...');
  await client.query(schemaSql);
  console.log('✅ Schema created successfully!');

  console.log('⚙️ Executing functions.sql (PL/pgSQL permission functions)...');
  await client.query(functionsSql);
  console.log('✅ Functions created successfully!');

  console.log('🌱 Executing seed.sql (units, patrols, roles, permissions, admin)...');
  await client.query(seedSql);
  console.log('✅ Baseline seed data inserted successfully!');

  console.log('\n🎉 ALL MIGRATIONS COMPLETE! Your free cloud database is 100% ready for production traffic.\n');
  await client.end();
}

migrateCloud().catch((err) => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
