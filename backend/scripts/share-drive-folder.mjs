import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const KEY_FILE = path.resolve('backend/scouts-management-510520-5f3aa6d7bc4d.json');
const ROOT_FOLDER_ID = '16J2dvQglurhedNtC6BdwOek6bNcLiAMn';
const TARGET_EMAIL = 'youssefosamame@gmail.com';

async function main() {
  console.log(`Sharing folder ${ROOT_FOLDER_ID} with ${TARGET_EMAIL}...`);

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  // Grant writer (editor) access to the root folder
  const response = await drive.permissions.create({
    fileId: ROOT_FOLDER_ID,
    requestBody: {
      role: 'writer',
      type: 'user',
      emailAddress: TARGET_EMAIL,
    },
    sendNotificationEmail: true,
    supportsAllDrives: true,
    fields: 'id, emailAddress, role',
  });

  console.log('Permission created successfully:', response.data);

  // Retrieve folder details to get webViewLink
  const folderDetails = await drive.files.get({
    fileId: ROOT_FOLDER_ID,
    fields: 'id, name, webViewLink',
    supportsAllDrives: true,
  });

  console.log('\n--- Share Summary ---');
  console.log('Folder Name:', folderDetails.data.name);
  console.log('Folder URL: ', folderDetails.data.webViewLink);
  console.log('Shared with:', TARGET_EMAIL, `(${response.data.role})`);
}

main().catch((err) => {
  console.error('Failed to share folder:', err);
  process.exit(1);
});
