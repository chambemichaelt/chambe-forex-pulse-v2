/**
 * Deriv OAuth initiation
 * Redirects user to Deriv OAuth authorization endpoint
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '34yYmvMto9OabbxhKj2Rz';
  const redirectUri = process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI || 'https://chambe-forex-pulse-v2.vercel.app';

  const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${appId}&redirect_uri=${encodeURIComponent(
    `${redirectUri}/api/deriv/callback`
  )}&scope=read,trade&state=${Date.now()}`;

  return NextResponse.redirect(oauthUrl);
}