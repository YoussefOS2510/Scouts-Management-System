import { query } from '../src/db';

async function migrate() {
  console.log('--- Migrating attendance_sessions for Event-based Attendance ---');

  // 1. Drop old constraint uq_attendance_unit_date if it exists
  try {
    await query(`ALTER TABLE attendance_sessions DROP CONSTRAINT IF EXISTS uq_attendance_unit_date;`);
    console.log('[PASS] Dropped old constraint uq_attendance_unit_date');
  } catch (err: any) {
    console.log('[INFO] Could not drop uq_attendance_unit_date:', err.message);
  }

  // 2. Add event_type, location, notes columns if not exist
  await query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'meeting';`);
  console.log('[PASS] Column event_type verified');

  await query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS location VARCHAR(150);`);
  console.log('[PASS] Column location verified');

  await query(`ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS notes TEXT;`);
  console.log('[PASS] Column notes verified');

  // 3. Ensure session_title has fallback for any existing rows where session_title is null
  await query(`UPDATE attendance_sessions SET session_title = 'اجتماع كشفي أسبوعي' WHERE session_title IS NULL OR session_title = '';`);
  console.log('[PASS] Updated any null session_titles');

  // 4. Add uq_attendance_unit_event unique constraint if not exists
  try {
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_attendance_unit_event'
        ) THEN
          ALTER TABLE attendance_sessions ADD CONSTRAINT uq_attendance_unit_event UNIQUE (unit_id, session_date, session_title);
        END IF;
      END $$;
    `);
    console.log('[PASS] Added constraint uq_attendance_unit_event (unit_id, session_date, session_title)');
  } catch (err: any) {
    console.log('[INFO] Constraint note:', err.message);
  }

  // 5. Verify columns and constraints
  const cols = await query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'attendance_sessions' 
    ORDER BY ordinal_position;
  `);
  console.log('\nUpdated columns of attendance_sessions:');
  console.table(cols);

  const cons = await query(`
    SELECT conname, contype, pg_get_constraintdef(oid) as def
    FROM pg_constraint 
    WHERE conrelid = 'attendance_sessions'::regclass;
  `);
  console.log('\nUpdated constraints on attendance_sessions:');
  console.table(cons);

  console.log('\n[SUCCESS] Migration completed successfully!');
}

migrate().catch(console.error).finally(() => process.exit(0));

