import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSession } from '@/lib/session';
import { derivClient } from '@/lib/deriv-client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authCode = searchParams.get('code');
  const error = searchParams.get('error');

  const redirectBase = process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI ?? 'https://chambe-forex-pulse-v2.vercel.app';

  if (error) {
    return NextResponse.redirect(`${redirectBase}?error=${encodeURIComponent(error)}`);
  }

  if (!authCode) {
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
  }

  try {
    const tokenResponse = await derivClient.exchangeCodeForToken(authCode);
    const accessToken = tokenResponse.access_token;

    if (!accessToken) {
      throw new Error('No access token returned from Deriv');
    }

    const account = await derivClient.getAccountInfo(accessToken);

    const sessionId = createSession({
      id: account.id,
      email: account.email,
      balance: account.balance,
      currency: account.currency,
      accountId: account.id,
      token: accessToken,
      loginId: account.loginId,
      refreshToken: tokenResponse.refresh_token,
    });

    const response = NextResponse.redirect(redirectBase);
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Deriv OAuth callback failed:', err);
    return NextResponse.redirect(`${redirectBase}?error=oauth_failed`);
  }
}
