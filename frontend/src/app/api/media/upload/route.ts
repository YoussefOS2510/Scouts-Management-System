import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDriveClient, loadOAuthTokens } from '@/lib/google-auth';

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '16J2dvQglurhedNtC6BdwOek6bNcLiAMn';
const YEAR_FOLDER_ID = process.env.GOOGLE_DRIVE_YEAR_FOLDER_ID || '1Rr5ZjtUESEgZBYHnL83n5jxi_x_kCrKY';
const EVENTS_FOLDER_ID = process.env.GOOGLE_DRIVE_EVENTS_FOLDER_ID || '1qTz_YJSTWGujpovGrqS_0M68JQvpnhmN';
const CURRENT_YEAR = process.env.SCOUTS_CURRENT_YEAR || '2026-2027';
const STAGING_DIR = process.env.MEDIA_STAGING_DIR || path.join(process.cwd(), 'staging_buffer');

async function findOrCreateFolder(drive: any, folderName: string, parentId?: string): Promise<string> {
  const queryParts = [
    `name = '${folderName.replace(/'/g, "\\'")}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`,
  ];
  if (parentId) {
    queryParts.push(`'${parentId}' in parents`);
  }

  const res = await drive.files.list({
    q: queryParts.join(' and '),
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (res.data.files && res.data.files.length > 0 && res.data.files[0].id) {
    return res.data.files[0].id;
  }

  const createMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    createMetadata.parents = [parentId];
  }

  const created = await drive.files.create({
    requestBody: createMetadata,
    fields: 'id, name',
    supportsAllDrives: true,
  });

  if (!created.data.id) {
    throw new Error(`Failed to create Google Drive folder: ${folderName}`);
  }

  return created.data.id;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const eventName = (formData.get('eventName') as string) || 'General_Event';
    const unitName = (formData.get('unitName') as string) || '';
    const year = (formData.get('year') as string) || CURRENT_YEAR;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Ensure staging directory exists on local volume
    if (!fs.existsSync(STAGING_DIR)) {
      fs.mkdirSync(STAGING_DIR, { recursive: true });
    }

    // Write file to local staging buffer
    const tempFileName = `upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const stagingPath = path.join(STAGING_DIR, tempFileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(stagingPath, buffer);

    console.log(`[MediaUpload] Staged ${file.name} (${buffer.length} bytes) to ${stagingPath}`);

    const destinationType = (formData.get('destinationType') as string) || 'event';
    const formTargetFolderId = formData.get('targetFolderId') as string | null;
    const targetFolderName = (formData.get('targetFolderName') as string) || (formData.get('eventName') as string) || 'General';

    const { drive, authMode, email } = getDriveClient();
    console.log(`[MediaUpload] Using Drive auth mode: ${authMode} (${email})`);

    let finalFolderId = formTargetFolderId;
    let folderPath = '';

    if (!finalFolderId) {
      if (destinationType === 'team') {
        const yearId = YEAR_FOLDER_ID || (await findOrCreateFolder(drive, year, ROOT_FOLDER_ID));
        finalFolderId = await findOrCreateFolder(drive, targetFolderName, yearId);
        folderPath = `/Scouts System/${year}/${targetFolderName}/`;
      } else {
        const yearId = YEAR_FOLDER_ID || (await findOrCreateFolder(drive, year, ROOT_FOLDER_ID));
        const eventsParentId = EVENTS_FOLDER_ID || (await findOrCreateFolder(drive, 'Events', yearId));
        finalFolderId = await findOrCreateFolder(drive, targetFolderName, eventsParentId);
        folderPath = `/Scouts System/${year}/Events/${targetFolderName}/`;
      }
    } else {
      folderPath = destinationType === 'team'
        ? `/Scouts System/${year}/${targetFolderName}/`
        : `/Scouts System/${year}/Events/${targetFolderName}/`;
    }

    // Stream upload to Google Drive
    console.log(`[MediaUpload] Uploading ${file.name} to Drive folder ${targetFolderName} (${finalFolderId})...`);

    const driveResponse = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [finalFolderId],
      },
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: fs.createReadStream(stagingPath),
      },
      fields: 'id, name, webViewLink, webContentLink, thumbnailLink',
      supportsAllDrives: true,
    });

    const driveFileId = driveResponse.data.id;
    const webViewLink = driveResponse.data.webViewLink;

    // Remove local staging buffer file upon 200 OK
    try {
      if (fs.existsSync(stagingPath)) {
        await fs.promises.unlink(stagingPath);
        console.log(`[MediaUpload] Cleaned up local buffer file: ${stagingPath}`);
      }
    } catch (cleanupErr) {
      console.warn('[MediaUpload] Buffer unlink warning:', cleanupErr);
    }

    return NextResponse.json({
      success: true,
      authMode,
      uploaderAccount: email,
      file: {
        id: driveFileId,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        webViewLink,
        targetFolderId: finalFolderId,
        folderPath,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[MediaUpload] Error handling upload:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload media to Google Drive' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tokens = loadOAuthTokens();
    const { drive, authMode, email } = getDriveClient();

    const res = await drive.files.list({
      q: `'${EVENTS_FOLDER_ID}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return NextResponse.json({
      year: CURRENT_YEAR,
      rootFolderId: ROOT_FOLDER_ID,
      eventsFolderId: EVENTS_FOLDER_ID,
      authMode,
      uploaderAccount: email,
      isOAuthConnected: Boolean(tokens?.refresh_token),
      eventFolders: res.data.files || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to fetch Drive events',
        isOAuthConnected: Boolean(loadOAuthTokens()?.refresh_token),
      },
      { status: 200 }
    );
  }
}
