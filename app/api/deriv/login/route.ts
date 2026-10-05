/**
 * Deriv OAuth initiation
 * Redirects user to Deriv OAuth authorization endpoint
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '34yYmvMto9OabbxhKj2Rz';
  const redirectUri = process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI || 'https://chambe-forex-pulse-v2.vercel.app';

  const oauthUrl = new URL('https://oauth.deriv.com/oauth2/authorize');
  oauthUrl.searchParams.set('app_id', appId);
  oauthUrl.searchParams.set('redirect_uri', `${redirectUri.replace(/\/$/, '')}/api/deriv/callback`);
  oauthUrl.searchParams.set('brand', 'deriv');
  oauthUrl.searchParams.set('scope', 'read,trade');
  oauthUrl.searchParams.set('state', String(Date.now()));

  return NextResponse.redirect(oauthUrl.toString());
}
