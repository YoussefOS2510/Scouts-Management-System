import fs from 'fs';
import path from 'path';
import http from 'http';
import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';
const TOKENS_PATH = path.resolve('backend/google-oauth-tokens.json');

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
});

console.log('\n======================================================');
console.log('GOOGLE OAUTH 2.0 AUTHORIZATION');
console.log('======================================================\n');
console.log('To link youssefosamame@gmail.com with personal Drive quota:');
console.log('\n1. Open this URL in your web browser:\n');
console.log(authUrl);
console.log('\n======================================================\n');

// If code is passed as argument: node auth-google.mjs <code>
const codeArg = process.argv[2];
if (codeArg) {
  exchange(codeArg);
}

async function exchange(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    let email = 'youssefosamame@gmail.com';
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const info = await oauth2.userinfo.get();
      if (info.data.email) email = info.data.email;
    } catch (e) {}

    const payload = {
      ...tokens,
      email,
      connectedAt: new Date().toISOString(),
    };

    fs.writeFileSync(TOKENS_PATH, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`\nSUCCESS! Tokens saved for ${email} to ${TOKENS_PATH}`);
    process.exit(0);
  } catch (err) {
    console.error('Error exchanging token:', err.message);
    process.exit(1);
  }
}
