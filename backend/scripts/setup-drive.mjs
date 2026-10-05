import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const KEY_FILE = path.resolve('backend/scouts-management-510520-5f3aa6d7bc4d.json');

async function main() {
  console.log('Using credentials from:', KEY_FILE);
  if (!fs.existsSync(KEY_FILE)) {
    throw new Error(`Credentials file not found: ${KEY_FILE}`);
  }

  const keyData = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
  console.log('Service account email:', keyData.client_email);

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  console.log('Querying Google Drive files/folders...');
  const listRes = await drive.files.list({
    q: "trashed = false",
    fields: 'files(id, name, mimeType, parents, shared, owners)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  console.log(`Found ${listRes.data.files?.length || 0} existing items in Drive.`);
  for (const f of listRes.data.files || []) {
    console.log(` - [${f.mimeType === 'application/vnd.google-apps.folder' ? 'DIR' : 'FILE'}] ${f.name} (${f.id})`);
  }

  // 1. Search or create "Scouts System" folder
  let rootFolder = listRes.data.files?.find(
    (f) => f.name === 'Scouts System' && f.mimeType === 'application/vnd.google-apps.folder'
  );

  let rootFolderId = rootFolder ? rootFolder.id : null;

  if (rootFolderId) {
    console.log(`Found existing root folder 'Scouts System' with ID: ${rootFolderId}`);
  } else {
    console.log(`Creating root folder 'Scouts System'...`);
    const createRoot = await drive.files.create({
      requestBody: {
        name: 'Scouts System',
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
    });
    rootFolderId = createRoot.data.id;
    console.log(`Successfully created 'Scouts System'! ID: ${rootFolderId}`);
  }

  // 2. Search or create "2026-2027" inside "Scouts System"
  const yearQuery = `'${rootFolderId}' in parents and name = '2026-2027' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const yearRes = await drive.files.list({
    q: yearQuery,
    fields: 'files(id, name, webViewLink)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  let yearFolderId = null;
  let yearFolderLink = null;

  if (yearRes.data.files && yearRes.data.files.length > 0) {
    yearFolderId = yearRes.data.files[0].id;
    yearFolderLink = yearRes.data.files[0].webViewLink;
    console.log(`Found existing year folder '2026-2027' with ID: ${yearFolderId}`);
  } else {
    console.log(`Creating year folder '2026-2027' inside 'Scouts System'...`);
    const createYear = await drive.files.create({
      requestBody: {
        name: '2026-2027',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId],
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
    });
    yearFolderId = createYear.data.id;
    yearFolderLink = createYear.data.webViewLink;
    console.log(`Successfully created '2026-2027'! ID: ${yearFolderId}`);
  }

  // 3. Search or create "Events" folder inside "2026-2027" (or store events directly in 2026-2027)
  // Let's create an "Events" folder as well if desired, or check
  const eventsQuery = `'${yearFolderId}' in parents and name = 'Events' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const eventsRes = await drive.files.list({
    q: eventsQuery,
    fields: 'files(id, name, webViewLink)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  let eventsFolderId = null;
  if (eventsRes.data.files && eventsRes.data.files.length > 0) {
    eventsFolderId = eventsRes.data.files[0].id;
    console.log(`Found existing 'Events' folder with ID: ${eventsFolderId}`);
  } else {
    console.log(`Creating 'Events' subfolder inside '2026-2027'...`);
    const createEvents = await drive.files.create({
      requestBody: {
        name: 'Events',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [yearFolderId],
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
    });
    eventsFolderId = createEvents.data.id;
    console.log(`Successfully created 'Events' subfolder! ID: ${eventsFolderId}`);
  }

  console.log('\n=============================================');
  console.log('GOOGLE DRIVE SETUP COMPLETED SUCCESSFULLY:');
  console.log('Root Folder (Scouts System):', rootFolderId);
  console.log('Year Folder (2026-2027):   ', yearFolderId);
  console.log('Events Subfolder:          ', eventsFolderId);
  console.log('=============================================\n');

  return { rootFolderId, yearFolderId, eventsFolderId };
}

main().catch((err) => {
  console.error('Drive Setup Error:', err);
  process.exit(1);
});
