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

const DEFAULT_SERVICE_ACCOUNT = {
  type: 'service_account',
  project_id: 'scouts-management-510520',
  private_key_id: '5f3aa6d7bc4dc7e05e91bc80d92ea9f227f7fb98',
  private_key:
    '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC4yXvGHgr+paBp\niopb4xabbKof043TVRmd2ViYHcAClSsLMrbE1hPvlqSB4gJ4f2SSFNnwrvoZOmQC\nKUKMzgQDZ1rCXKawJf7EHD/7f4kJabFKUn5isR15R3URbh2oHVKKD5q7WQjpnsuy\nzy8BKCwBUW95T1/2cEdibwqRuMd0s5OEQuMsvEi1SyutrrgLApK4MsUZM0ndAe7+\n8sfhgD+z6r9Enx5zaEdnBHa0WuCAAyMmqBizwxWuMTEO4I39iD9hld3QDZKlneYN\nUlqATbVyONBc/KMfHGWTikRW5F48qKQmwOBjF7Z2r6dO0KTunE6tii7TC5aljWiW\n4sXNUd5XAgMBAAECggEAEmLx7uekXmwqhvXjCHuTD0oDr4EEVqfcEanDt/cV2Ovw\nyX91Uiae+zL5EXdkmYrLfgGXIey3M/VsaA6k8Y+6NIB/NmGzsElHjUnmT+cDwq0C\nmAuXScinzx5+FornZofsY5Jj6gpU6bIEQLl+ytWtc0AgIGj2enX3lGLKIW/KYOEm\nCedQCxtpdm1oBeg8qOYZ1aU/8nZXqa1YWLZPW336t5tm6L4pNfw+wSkGWqeR6sAa\nbdcbD7l/m2M3oBHQaZHY2jSqeYrIR11qRY6m8ea41YJcx1GoWVK2lL7buIRToMzA\n2zCaXFRiCCc9n48wyIn08yBGU2qBl5n0Q56etTprWQKBgQDnVQSzQ3LZ2nwGOEaj\nj+WAzf+wdUwShr+YcwSbJB+UxFnyb/taTuXEAvyD2zpMBwbhswEhHplkgax0SAtH\n/rovB/WZ49vHG4QVRu9AwO+B8YAs2hUYbgxEuE/6MYQDhlZo1FQx3LwGjfOZKKrS\nzKNJX22Pz24lRAJDad3k3aZOkwKBgQDMfdzKadaU5t3PoPj1Tg4Vf0walFiCW5kO\nvetEV2l0B8hyiDO57gqXR02SXXfd6U0UlRQvpkHcowFhX5Fgtv4FMuXDnrqTg0gx\nd8vIB8W7/jh9cZ0pSznS6WHr86yWVv0EPtsruHYN3wb3x6lcNoPHHhc5n5fADKWS\nLBTX/cxHrQKBgQCNf7SDTlN3LCxGxa93prIUKm0m62ifwGp7focnul3S6pO2NocB\nw1bJoaYBpVwwWu/7qDmdn5DmKGdrLRIxdH8/+1dgTT8GuC7/sMbxzdHyotzrEm5q\n5g19D1xkRltgqJA8SPxDD6i3PabuXTC4BlIutD9ZAuF1y/ayc5Q1xNpQHwKBgHvg\nfyErjm8zkAlYdZh8yXFiZSLw3NFTVdwlVuFWpq5AjMA9HEC1IDtWWXqiHpwS2bvv\nN4RKDjnvkUWAlFvnXuidVaz0eggkjlZRQOSTOMjSjzwG2HMMfCH1eXlraxDD75Bj\n13ebzgBHLDxr+n+/EoNMCjvBHzebMa3kAFh8CgUdAoGBAMLgh/36AmsdDZ+UBkYw\nOcg5VzL201ijIHZLkXa/7PVenUCMPvwd17V9av2Mz6Vc9nSl8KmKqXiNeUoyZ0lK\nGgNRiG57AsJj0OHCTmqWsjIV1ld1aarhmfKV7FXkC6hO18b71hswX6w+o7eh0og4\nxmUBcKbuXlXMBXhFDLm5gy00\n-----END PRIVATE KEY-----\n',
  client_email: 'scouts-drive@scouts-management-510520.iam.gserviceaccount.com',
};

export function getDriveClient() {
  // 1. Direct Backend user OAuth2 refresh token (uses youssefosamame@gmail.com quota: 5 TB!)
  const envRefreshToken =
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN ||
    '1//03E0Z6fC8_a76CgYIARAAGAMSNgF-L9IrGgYEjFYPFEbOxEuNYnHNDhRITVQP8p-9FJdKNc_NJ3mHDbuYmU2HGTFJ30gopBiTyQ';

  if (envRefreshToken) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: envRefreshToken });
    return {
      drive: google.drive({ version: 'v3', auth: oauth2Client }),
      authMode: 'oauth2' as const,
      email: 'youssefosamame@gmail.com',
    };
  }

  // 2. Stored OAuth2 tokens on backend disk fallback
  const tokens = loadOAuthTokens();
  if (tokens && tokens.refresh_token) {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);

    oauth2Client.on('tokens', (newTokens) => {
      saveOAuthTokens({ ...tokens, ...newTokens });
    });

    return {
      drive: google.drive({ version: 'v3', auth: oauth2Client }),
      authMode: 'oauth2' as const,
      email: tokens.email || 'youssefosamame@gmail.com',
    };
  }

  // 3. Permanent Service Account fallback (for shared drives or read operations)
  try {
    let serviceAccountCredentials: any = DEFAULT_SERVICE_ACCOUNT;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        serviceAccountCredentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      } catch {}
    } else if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      try {
        const fileContent = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8');
        serviceAccountCredentials = JSON.parse(fileContent);
      } catch {}
    }

    if (serviceAccountCredentials?.client_email && serviceAccountCredentials?.private_key) {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: serviceAccountCredentials.client_email,
          private_key: serviceAccountCredentials.private_key,
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
      });

      return {
        drive: google.drive({ version: 'v3', auth }),
        authMode: 'service_account' as const,
        email: serviceAccountCredentials.client_email,
      };
    }
  } catch (saErr) {
    console.warn('[GoogleAuth] Service Account init warning:', saErr);
  }

  throw new Error('No valid Google Drive credentials found');
}
