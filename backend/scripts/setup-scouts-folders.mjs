import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const TOKENS_PATH = path.resolve('frontend/backend/google-oauth-tokens.json');
const YEAR_FOLDER_ID = '1Rr5ZjtUESEgZBYHnL83n5jxi_x_kCrKY'; // 2026-2027
const EVENTS_FOLDER_ID = '1qTz_YJSTWGujpovGrqS_0M68JQvpnhmN'; // Events

// Teams list (12 units)
const TEAMS = [
  'Ashbal A',
  'Ashbal B',
  'Zahrat A',
  'Zahrat B',
  'Kashafa A',
  'Kashafa B',
  'Morshdat A',
  'Morshdat B',
  'Motakadem',
  'Ra2edat',
  'Gawala',
  'Leadership Staff'
];

// Initial events inside Events folder
const INITIAL_EVENTS = [
  'Camp',
  'Sports Day',
  'Nady Kashfy'
];

const KEY_FILE = path.resolve('backend/scouts-management-510520-5f3aa6d7bc4d.json');

async function getClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

async function findOrCreateFolder(drive, name, parentId) {
  const q = `'${parentId}' in parents and name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const res = await drive.files.list({
    q,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (res.data.files && res.data.files.length > 0) {
    console.log(`  [EXISTS] Folder "${name}": ${res.data.files[0].id}`);
    return res.data.files[0].id;
  }

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id, name',
    supportsAllDrives: true,
  });

  console.log(`  [CREATED] Folder "${name}": ${created.data.id}`);
  return created.data.id;
}

async function main() {
  console.log('Connecting to Google Drive...');
  const drive = await getClient();

  // 1. Clean up old test folder if present in 2026-2027
  const oldFolderRes = await drive.files.list({
    q: `'${YEAR_FOLDER_ID}' in parents and name = 'Kashafa_A_Annual_Campfire_2026' and trashed = false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
  });
  if (oldFolderRes.data.files && oldFolderRes.data.files.length > 0) {
    for (const f of oldFolderRes.data.files) {
      console.log(`Deleting old test folder "${f.name}" (${f.id})...`);
      await drive.files.delete({ fileId: f.id, supportsAllDrives: true });
    }
  }

  console.log('\n--- 1. Creating Team Folders in 2026-2027 ---');
  const teamFolderMap = {};
  for (const team of TEAMS) {
    const id = await findOrCreateFolder(drive, team, YEAR_FOLDER_ID);
    teamFolderMap[team] = id;
  }

  console.log('\n--- 2. Creating Event Subfolders inside "Events" ---');
  const eventFolderMap = {};
  for (const eventName of INITIAL_EVENTS) {
    const id = await findOrCreateFolder(drive, eventName, EVENTS_FOLDER_ID);
    eventFolderMap[eventName] = id;
  }

  console.log('\n--- 3. Verifying Final Structure in Google Drive ---');
  const yearFiles = await drive.files.list({
    q: `'${YEAR_FOLDER_ID}' in parents and trashed = false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
  });
  console.log(`Folders in 2026-2027 (${yearFiles.data.files.length}):`);
  yearFiles.data.files.forEach(f => console.log(`  📁 ${f.name} (ID: ${f.id})`));

  const eventFiles = await drive.files.list({
    q: `'${EVENTS_FOLDER_ID}' in parents and trashed = false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
  });
  console.log(`\nFolders in Events (${eventFiles.data.files.length}):`);
  eventFiles.data.files.forEach(f => console.log(`  📁 Events / ${f.name} (ID: ${f.id})`));

  console.log('\n>>> GOOGLE DRIVE FOLDER SETUP COMPLETE! <<<');
}

main().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
