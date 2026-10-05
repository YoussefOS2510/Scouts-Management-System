import path from 'path';
import { MediaUploadWorker } from '../workers/media-worker.ts';

process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve('backend/scouts-management-510520-5f3aa6d7bc4d.json');
process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID = '16J2dvQglurhedNtC6BdwOek6bNcLiAMn';
process.env.GOOGLE_DRIVE_YEAR_FOLDER_ID = '1Rr5ZjtUESEgZBYHnL83n5jxi_x_kCrKY';
process.env.SCOUTS_CURRENT_YEAR = '2026-2027';

async function test() {
  console.log('Testing MediaUploadWorker Drive integration...');
  const worker = new MediaUploadWorker();
  
  // Test ensuring event folder for a 2026-2027 scout event
  const eventFolder = await worker.ensureEventFolder({
    year: '2026-2027',
    eventName: 'Annual_Campfire_2026',
    unitName: 'Kashafa_A',
  });

  console.log('Successfully ensured event folder hierarchy:');
  console.log('Root Folder (Scouts System):', eventFolder.rootFolderId);
  console.log('Year Folder (2026-2027):   ', eventFolder.yearFolderId);
  console.log('Event Folder:               ', eventFolder.eventFolderId);
}

test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
