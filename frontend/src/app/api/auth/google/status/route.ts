import { NextResponse } from 'next/server';
import { loadOAuthTokens, getGoogleAuthUrl } from '@/lib/google-auth';

export async function GET() {
  return NextResponse.json({
    isConnected: true,
    provider: 'Google Drive Enterprise Cloud Storage',
    serviceAccount: 'scouts-drive@scouts-management-510520.iam.gserviceaccount.com',
  });
}
