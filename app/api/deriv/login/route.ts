import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { buildDerivAuthUrl } from '@/lib/deriv';

export async function GET() {
  const state = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const redirectUrl = buildDerivAuthUrl();

  cookies().set('deriv_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(redirectUrl);
}
