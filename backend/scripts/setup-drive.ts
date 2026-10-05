import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const KEY_FILE = path.resolve('scouts-management-510520-5f3aa6d7bc4d.json');

async function main() {
  console.log('Using credentials from:', KEY_FILE);
  if (!fs.existsSync(KEY_FILE)) {
    throw new Error(`Credentials file not found: ${KEY_FILE}`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  console.log('Testing Google Drive authentication...');
  
  // List existing files/folders
  const listRes = await drive.files.list({
    q: "trashed = false",
    fields: 'files(id, name, mimeType, parents)',
  });
  console.log('Found existing files/folders:', listRes.data.files);

  // Search or create "Scouts System" folder
  let rootFolderId: string | null = null;
  const existingRoot = listRes.data.files?.find(
    (f) => f.name === 'Scouts System' && f.mimeType === 'application/vnd.google-apps.folder'
  );

  if (existingRoot && existingRoot.id) {
    console.log(`Found existing folder 'Scouts System': ${existingRoot.id}`);
    rootFolderId = existingRoot.id;
  } else {
    console.log(`Creating folder 'Scouts System'...`);
    const createRoot = await drive.files.create({
      requestBody: {
        name: 'Scouts System',
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id, name',
    });
    rootFolderId = createRoot.data.id || null;
    console.log(`Created 'Scouts System' with ID: ${rootFolderId}`);
  }

  if (!rootFolderId) {
    throw new Error('Failed to obtain root folder ID');
  }

  // Search or create year folder "2026-2027" inside "Scouts System"
  const yearFolderRes = await drive.files.list({
    q: `'${rootFolderId}' in parents and name = '2026-2027' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
  });

  let yearFolderId: string | null = null;
  if (yearFolderRes.data.files && yearFolderRes.data.files.length > 0) {
    yearFolderId = yearFolderRes.data.files[0].id || null;
    console.log(`Found existing year folder '2026-2027': ${yearFolderId}`);
  } else {
    console.log(`Creating year folder '2026-2027' inside 'Scouts System'...`);
    const createYear = await drive.files.create({
      requestBody: {
        name: '2026-2027',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [rootFolderId],
      },
      fields: 'id, name',
    });
    yearFolderId = createYear.data.id || null;
    console.log(`Created year folder '2026-2027' with ID: ${yearFolderId}`);
  }

  console.log('\n--- Setup Summary ---');
  console.log('Root Folder (Scouts System):', rootFolderId);
  console.log('Year Folder (2026-2027):', yearFolderId);
}

main().catch((err) => {
  console.error('Execution failed:', err);
  process.exit(1);
});
