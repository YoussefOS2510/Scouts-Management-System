import { NextResponse } from 'next/server';
import { loadOAuthTokens, getGoogleAuthUrl } from '@/lib/google-auth';

export async function GET() {
  const tokens = loadOAuthTokens();
  const hasEnvToken = Boolean(process.env.GOOGLE_DRIVE_REFRESH_TOKEN);
  const isConnected = hasEnvToken || Boolean(tokens && tokens.refresh_token);

  return NextResponse.json({
    isConnected,
    provider: 'Google Drive Cloud Storage',
  });
}
