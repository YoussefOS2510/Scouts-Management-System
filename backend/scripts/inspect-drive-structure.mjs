import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const keyFile = path.resolve('backend/scouts-management-510520-5f3aa6d7bc4d.json');
const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

const YEAR_FOLDER_ID = '1Rr5ZjtUESEgZBYHnL83n5jxi_x_kCrKY'; // 2026-2027
const EVENTS_FOLDER_ID = '1qTz_YJSTWGujpovGrqS_0M68JQvpnhmN'; // Events

async function main() {
  const yearRes = await drive.files.list({
    q: `'${YEAR_FOLDER_ID}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType)',
  });
  console.log('--- Inside 2026-2027 ---');
  yearRes.data.files.forEach(f => console.log(`  📁 ${f.name} (ID: ${f.id})`));

  const eventsRes = await drive.files.list({
    q: `'${EVENTS_FOLDER_ID}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType)',
  });
  console.log('\n--- Inside Events ---');
  eventsRes.data.files.forEach(f => console.log(`  📁 Events / ${f.name} (ID: ${f.id})`));
}

main().catch(console.error);
