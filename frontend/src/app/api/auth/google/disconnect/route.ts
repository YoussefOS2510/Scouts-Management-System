import { NextResponse } from 'next/server';
import { clearOAuthTokens } from '@/lib/google-auth';

export async function GET() {
  clearOAuthTokens();
  return NextResponse.redirect(new URL('/media', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
}

export async function POST() {
  clearOAuthTokens();
  return NextResponse.json({ success: true, message: 'Google account disconnected' });
}
