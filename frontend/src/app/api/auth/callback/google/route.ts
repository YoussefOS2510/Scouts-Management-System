import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getOAuth2Client, saveOAuthTokens } from '@/lib/google-auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('[GoogleOAuth Callback] Error from Google:', error);
    return NextResponse.redirect(new URL(`/media?oauth_error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/media?oauth_error=no_code_provided', request.url));
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user email to display in the UI
    let userEmail = 'Personal Google Account';
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      if (userInfo.data.email) {
        userEmail = userInfo.data.email;
      }
    } catch (e) {
      console.warn('[GoogleOAuth] Could not fetch user email info:', e);
    }

    // Save tokens including refresh_token
    saveOAuthTokens({
      ...tokens,
      email: userEmail,
      connectedAt: new Date().toISOString(),
    });

    console.log(`[GoogleOAuth] Successfully connected Google account: ${userEmail}`);

    return NextResponse.redirect(new URL('/media?connected=true', request.url));
  } catch (err: any) {
    console.error('[GoogleOAuth Callback] Token exchange failed:', err);
    return NextResponse.redirect(
      new URL(`/media?oauth_error=${encodeURIComponent(err.message || 'token_exchange_failed')}`, request.url)
    );
  }
}
