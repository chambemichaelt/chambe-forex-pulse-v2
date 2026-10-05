/**
 * Deriv OAuth callback handler
 * Exchanges authorization code for access token and user info
 */

import { NextResponse } from 'next/server';
import { createSession } from '@/lib/session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authCode = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json(
      { error: `OAuth error: ${error}` },
      { status: 400 }
    );
  }

  if (!authCode) {
    return NextResponse.json(
      { error: 'No authorization code received' },
      { status: 400 }
    );
  }

  try {
    const redirectUri = process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI || 'https://chambe-forex-pulse-v2.vercel.app';

    // Exchange auth code for access token
    const tokenResponse = await fetch('https://oauth.deriv.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: `${redirectUri}/api/deriv/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange auth code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('No access token in response');
    }

    // For demo: create a session with mock user data
    // In production, fetch real user info from Deriv API
    const mockUser = {
      id: `user_${Date.now()}`,
      email: 'trader@deriv.com',
      balance: 10000,
      currency: 'USD',
      accountId: 'CR' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      token: accessToken,
      loginId: 'demo_trader',
    };

    // Create session with user data
    const sessionId = createSession(mockUser);

    // Redirect to dashboard with session cookie
    const response = NextResponse.redirect(`${redirectUri}`);

    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI || 'https://chambe-forex-pulse-v2.vercel.app'}?error=oauth_failed`
    );
  }
}