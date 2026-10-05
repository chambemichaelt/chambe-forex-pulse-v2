import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = cookies().get('deriv_oauth_state')?.value;

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL('/?connected=0', req.url));
  }

  cookies().set('deriv_session', JSON.stringify({ code, state, connectedAt: Date.now() }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.redirect(new URL('/?connected=1', req.url));
}
