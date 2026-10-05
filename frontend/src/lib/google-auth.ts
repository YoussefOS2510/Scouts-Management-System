import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const TOKENS_PATH = path.resolve('backend/google-oauth-tokens.json');
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve('backend/scouts-management-510520-5f3aa6d7bc4d.json');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';

export function getOAuth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function getGoogleAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'select_account consent',
    scope: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });
}

export function saveOAuthTokens(tokens: any) {
  const dir = path.dirname(TOKENS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2), 'utf8');

  // Also save to root backend path if different
  const rootBackendPath = path.resolve('../backend/google-oauth-tokens.json');
  try {
    if (fs.existsSync(path.dirname(rootBackendPath))) {
      fs.writeFileSync(rootBackendPath, JSON.stringify(tokens, null, 2), 'utf8');
    }
  } catch {
    // ignore
  }
}

export function clearOAuthTokens() {
  const paths = [
    TOKENS_PATH,
    path.resolve('../backend/google-oauth-tokens.json'),
    path.resolve('backend/google-oauth-tokens.json'),
    path.resolve('frontend/backend/google-oauth-tokens.json'),
  ];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    } catch {
      // ignore
    }
  }
}

export function loadOAuthTokens(): any | null {
  const candidatePaths = [
    TOKENS_PATH,
    path.resolve('../backend/google-oauth-tokens.json'),
    path.resolve('frontend/backend/google-oauth-tokens.json'),
  ];
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const data = fs.readFileSync(p, 'utf8');
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export function getDriveClient() {
  // 1. Direct Backend environment variable token (100% headless, zero UI sign-in required)
  const envRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  if (envRefreshToken) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: envRefreshToken });
    return {
      drive: google.drive({ version: 'v3', auth: oauth2Client }),
      authMode: 'oauth2' as const,
      email: 'Central Storage',
    };
  }

  // 2. Try stored OAuth2 tokens on backend disk
  const tokens = loadOAuthTokens();
  if (tokens && tokens.refresh_token) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);

    // Automatically update saved tokens on refresh
    oauth2Client.on('tokens', (newTokens) => {
      saveOAuthTokens({ ...tokens, ...newTokens });
    });

    return {
      drive: google.drive({ version: 'v3', auth: oauth2Client }),
      authMode: 'oauth2' as const,
      email: 'Central Storage',
    };
  }

  // 2. Fallback to Service Account
  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    const auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_PATH,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    return {
      drive: google.drive({ version: 'v3', auth }),
      authMode: 'service_account' as const,
      email: 'scouts-drive@scouts-management-510520.iam.gserviceaccount.com',
    };
  }

  throw new Error('No valid Google Drive credentials (neither OAuth tokens nor Service Account JSON found)');
}
