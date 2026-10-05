import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/google-auth';

const YEAR_FOLDER_ID = process.env.GOOGLE_DRIVE_YEAR_FOLDER_ID || '1Rr5ZjtUESEgZBYHnL83n5jxi_x_kCrKY';
const EVENTS_FOLDER_ID = process.env.GOOGLE_DRIVE_EVENTS_FOLDER_ID || '1qTz_YJSTWGujpovGrqS_0M68JQvpnhmN';

// Fallback initial structures if drive is temporarily offline
const DEFAULT_TEAMS = [
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
  'Leadership Staff',
];

const DEFAULT_EVENTS = ['Camp', 'Sports Day', 'Nady Kashfy'];

export async function GET() {
  try {
    const { drive } = getDriveClient();

    // 1. Fetch team folders inside 2026-2027 (excluding the 'Events' container)
    const yearChildrenRes = await drive.files.list({
      q: `'${YEAR_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 50,
    });

    const yearFolders = yearChildrenRes.data.files || [];
    const teamFolders = yearFolders
      .filter((f) => f.name !== 'Events')
      .map((f) => ({ id: f.id!, name: f.name! }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // 2. Fetch all folders inside 'Events' (Camp, Sports Day, Nady Kashfy, and Admin custom folders)
    const eventsChildrenRes = await drive.files.list({
      q: `'${EVENTS_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 50,
    });

    const eventFolders = (eventsChildrenRes.data.files || [])
      .map((f) => ({ id: f.id!, name: f.name! }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      year: '2026-2027',
      yearFolderId: YEAR_FOLDER_ID,
      eventsFolderId: EVENTS_FOLDER_ID,
      teams: teamFolders.length > 0 ? teamFolders : DEFAULT_TEAMS.map((name) => ({ id: `default-${name}`, name })),
      events: eventFolders.length > 0 ? eventFolders : DEFAULT_EVENTS.map((name) => ({ id: `default-${name}`, name })),
    });
  } catch (error: any) {
    console.error('[MediaFolders API] Error fetching folders:', error);
    return NextResponse.json({
      success: true,
      isFallback: true,
      year: '2026-2027',
      yearFolderId: YEAR_FOLDER_ID,
      eventsFolderId: EVENTS_FOLDER_ID,
      teams: DEFAULT_TEAMS.map((name) => ({ id: `fallback-${name}`, name })),
      events: DEFAULT_EVENTS.map((name) => ({ id: `fallback-${name}`, name })),
    });
  }
}

// POST: Admin-only creation of a new folder inside the Events container
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const folderName = (body.folderName || '').trim();

    if (!folderName) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const { drive } = getDriveClient();

    // Check if folder already exists inside Events
    const checkRes = await drive.files.list({
      q: `'${EVENTS_FOLDER_ID}' in parents and name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (checkRes.data.files && checkRes.data.files.length > 0) {
      return NextResponse.json({
        success: true,
        alreadyExisted: true,
        folder: {
          id: checkRes.data.files[0].id,
          name: checkRes.data.files[0].name,
        },
      });
    }

    // Create the new folder inside Events folder
    const created = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [EVENTS_FOLDER_ID],
      },
      fields: 'id, name',
      supportsAllDrives: true,
    });

    if (!created.data.id) {
      throw new Error('Google Drive API failed to return folder ID');
    }

    console.log(`[MediaFolders API] Admin created new Events subfolder "${folderName}" (ID: ${created.data.id})`);

    return NextResponse.json({
      success: true,
      folder: {
        id: created.data.id,
        name: created.data.name || folderName,
      },
    });
  } catch (error: any) {
    console.error('[MediaFolders API] Error creating folder:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create folder on Google Drive' },
      { status: 500 }
    );
  }
}
