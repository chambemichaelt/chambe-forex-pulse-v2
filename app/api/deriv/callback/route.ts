import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSession } from '@/lib/session';

const CLIENT_ID =
  process.env.NEXT_PUBLIC_DERIV_APP_ID || '34y4evMto90zbbhkj2Rz';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://chambe-forex-pulse-v2.vercel.app';

const REDIRECT_URI =
  process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI ||
  `${APP_URL}/api/deriv/callback`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const returnedState = searchParams.get('state');
  const error = searchParams.get('error');

  const cookieStore = await cookies();
  const savedState = cookieStore.get('deriv_oauth_state')?.value;
  const codeVerifier = cookieStore.get('deriv_oauth_verifier')?.value;

  if (error) {
    return NextResponse.redirect(
      `${APP_URL}?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code received from Deriv' },
      { status: 400 }
    );
  }

  if (!returnedState || !savedState || returnedState !== savedState) {
    return NextResponse.json(
      { error: 'Invalid OAuth state' },
      { status: 400 }
    );
  }

  if (!codeVerifier) {
    return NextResponse.json(
      { error: 'Missing PKCE code verifier' },
      { status: 400 }
    );
  }

  try {
    const tokenResponse = await fetch(
      'https://auth.deriv.com/oauth2/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          code,
          code_verifier: codeVerifier,
          redirect_uri: REDIRECT_URI,
        }).toString(),
        cache: 'no-store',
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Deriv token exchange failed:', tokenData);

      return NextResponse.redirect(
        `${APP_URL}?error=token_exchange_failed`
      );
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('Deriv returned no access token');

      return NextResponse.redirect(
        `${APP_URL}?error=no_access_token`
      );
    }

    /*
     * OAuth is successfully completed.
     *
     * Account information will be connected separately using
     * the current Deriv API.
     */
    const sessionId = createSession({
      id: 'deriv_oauth_user',
      email: '',
      balance: 0,
      currency: 'USD',
      accountId: '',
      token: accessToken,
      loginId: '',
      refreshToken: tokenData.refresh_token,
    });

    const response = NextResponse.redirect(APP_URL);

    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    response.cookies.delete('deriv_oauth_state');
    response.cookies.delete('deriv_oauth_verifier');

    return response;
  } catch (err) {
    console.error('Deriv OAuth callback failed:', err);

    return NextResponse.redirect(
      `${APP_URL}?error=oauth_failed`
    );
  }
}
