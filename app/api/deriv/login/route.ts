import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const APP_ID =
  process.env.NEXT_PUBLIC_DERIV_APP_ID || '34yYmvMto9OabbxhKj2Rz';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://chambe-forex-pulse-v2.vercel.app';

const REDIRECT_URI =
  process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI ||
  `${APP_URL}/api/deriv/callback`;

function base64Url(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function GET(request: NextRequest) {
  const state = base64Url(crypto.randomBytes(32));
  const codeVerifier = base64Url(crypto.randomBytes(32));

  const codeChallenge = base64Url(
    crypto.createHash('sha256').update(codeVerifier).digest()
  );

  const oauthUrl = new URL('https://auth.deriv.com/oauth2/auth');

  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('client_id', APP_ID);
  oauthUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  oauthUrl.searchParams.set('scope', 'trade application_read');
  oauthUrl.searchParams.set('state', state);
  oauthUrl.searchParams.set('code_challenge', codeChallenge);
  oauthUrl.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(oauthUrl.toString());

  response.cookies.set(
    'deriv_oauth',
    `${state}.${codeVerifier}`,
    {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/',
    }
  );

  /*
   * Preserve the signed registration state, if the user arrived
   * through the self-service registration flow.
   *
   * The value is already cryptographically signed by the server.
   * It is stored in an HttpOnly cookie so browser JavaScript
   * cannot modify it.
   */
  const registrationState =
    request.cookies.get('forex_pulse_registration')?.value;

  if (registrationState) {
    response.cookies.set(
      'forex_pulse_registration',
      registrationState,
      {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 10 * 60,
        path: '/',
      }
    );
  }

  return response;
}
