import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getDriveClient, loadOAuthTokens } from '@/lib/google-auth';
import { query, sql } from '@/lib/db';

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '16J2dvQglurhedNtC6BdwOek6bNcLiAMn';
const YEAR_FOLDER_ID = process.env.GOOGLE_DRIVE_YEAR_FOLDER_ID || '1Rr5ZjtUESEgZBYHnL83n5jxi_x_kCrKY';
const EVENTS_FOLDER_ID = process.env.GOOGLE_DRIVE_EVENTS_FOLDER_ID || '1qTz_YJSTWGujpovGrqS_0M68JQvpnhmN';
const CURRENT_YEAR = process.env.SCOUTS_CURRENT_YEAR || '2026-2027';

function getStagingDir(): string {
  const envDir = process.env.MEDIA_STAGING_DIR;
  if (envDir && path.isAbsolute(envDir)) {
    try {
      if (!fs.existsSync(envDir)) {
        fs.mkdirSync(envDir, { recursive: true });
      }
      return envDir;
    } catch {
      // Fallback if not writable (e.g. read-only filesystem)
    }
  }

  // Safe writable fallback for Serverless (Vercel / AWS Lambda) and local systems: os.tmpdir()
  const fallback = path.join(os.tmpdir(), 'scouts_staging_buffer');
  try {
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  } catch {
    return os.tmpdir();
  }
}

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

    // Ensure staging directory exists on local or temporary volume
    const stagingDir = getStagingDir();

    // Write file to local staging buffer
    const tempFileName = `upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const stagingPath = path.join(stagingDir, tempFileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(stagingPath, buffer);

    console.log(`[MediaUpload] Staged ${file.name} (${buffer.length} bytes) to ${stagingPath}`);

    const destinationType = (formData.get('destinationType') as string) || 'event';
    const formTargetFolderId = formData.get('targetFolderId') as string | null;
    const targetFolderName = (formData.get('targetFolderName') as string) || (formData.get('eventName') as string) || 'General';
    const allowedFolderIdsRaw = formData.get('allowedFolderIds') as string | null;

    const userId = (formData.get('userId') as string) || '';
    const userEmail = ((formData.get('userEmail') as string) || '').toLowerCase();

    // Specific security restriction: Christine Nabil is strictly limited to Morshdat A and Morshdat B
    if (userId === 'u18' || userEmail === 'christine.nabil@scouts.org') {
      const MORSHDAT_A_ID = '1zUwkjhsG-0y5me48Dgr5Fg1zNKgbr1ll';
      const MORSHDAT_B_ID = '1rUHQZbcyJlB-z7Joxdb9AbHtXm-PMcj6';
      const allowedChristineIds = [MORSHDAT_A_ID, MORSHDAT_B_ID];

      const cleanTargetName = targetFolderName.trim().toLowerCase();
      const isMorshdatFolder = cleanTargetName.includes('morshdat a') ||
                               cleanTargetName.includes('morshdat b') ||
                               cleanTargetName.includes('مرشدات a') ||
                               cleanTargetName.includes('مرشدات b');

      const isAllowedId = formTargetFolderId && (
        allowedChristineIds.includes(formTargetFolderId) ||
        formTargetFolderId.includes('Morshdat A') ||
        formTargetFolderId.includes('Morshdat B') ||
        formTargetFolderId === 'unit-7' ||
        formTargetFolderId === 'unit-8'
      );

      if (destinationType !== 'team' || (!isAllowedId && !isMorshdatFolder)) {
        return NextResponse.json(
          { error: 'Unauthorized: Christine Nabil is only authorized to upload media to Morshdat A and Morshdat B folders.' },
          { status: 403 }
        );
      }
    }

    // Enforce team-scoped upload restrictions for media leaders assigned to specific teams
    if (allowedFolderIdsRaw) {
      try {
        const allowedIds: string[] = JSON.parse(allowedFolderIdsRaw);
        if (Array.isArray(allowedIds) && allowedIds.length > 0) {
          if (destinationType !== 'team') {
            return NextResponse.json(
              { error: 'Media leaders assigned to teams can only upload to team folders.' },
              { status: 403 }
            );
          }
          if (formTargetFolderId && !allowedIds.includes(formTargetFolderId)) {
            return NextResponse.json(
              { error: 'Unauthorized: Destination folder is outside your assigned team folders.' },
              { status: 403 }
            );
          }
        }
      } catch (parseErr) {
        console.warn('[MediaUpload] Failed to parse allowedFolderIds JSON:', parseErr);
      }
    }

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
    // Synchronize metadata with Microsoft SQL Server (ScoutsDB)
    try {
      const yearNum = parseInt(year) || 2026;
      await query(`
        INSERT INTO media_items (unit_id, year, file_name, title_ar, title_en, media_type, url, drive_file_id)
        VALUES (5, @yr, @fn, @title, @title, @mtype, @url, @fid)
      `, [
        { name: 'yr', type: sql.Int, value: yearNum },
        { name: 'fn', type: sql.NVarChar(255), value: file.name },
        { name: 'title', type: sql.NVarChar(200), value: eventName || file.name },
        { name: 'mtype', type: sql.NVarChar(20), value: file.type.startsWith('video') ? 'video' : 'image' },
        { name: 'url', type: sql.NVarChar(sql.MAX), value: webViewLink || `https://drive.google.com/file/d/${driveFileId}/view` },
        { name: 'fid', type: sql.NVarChar(255), value: driveFileId },
      ]);
    } catch (dbErr) {
      console.warn('[MediaUpload] DB indexing warning:', dbErr);
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
