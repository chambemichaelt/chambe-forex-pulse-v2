import { NextResponse } from 'next/server';
import { saveFollowerAccount, getFollowerAccountByEmail } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const email = payload.email?.toString();
    const loginId = payload.loginId?.toString();
    const accountId = payload.accountId?.toString();
    const accessToken = payload.accessToken?.toString();
    const refreshToken = payload.refreshToken?.toString();
    const scopes = Array.isArray(payload.scopes)
      ? payload.scopes.map((scope: unknown) => String(scope))
      : ['read'];

    if (!email || !accessToken || !accountId) {
      return NextResponse.json(
        { error: 'email, accountId, and accessToken are required' },
        { status: 400 }
      );
    }

    const existing = getFollowerAccountByEmail(email);
    const followerId = existing?.id ?? `follower_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const follower = saveFollowerAccount({
      id: followerId,
      userId: followerId,
      email,
      loginId: loginId ?? `login_${Date.now()}`,
      accountId,
      accessToken,
      refreshToken,
      scopes,
      status: 'active',
    });

    return NextResponse.json({ ok: true, follower });
  } catch (error) {
    console.error('Link follower failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to link follower' },
      { status: 500 }
    );
  }
}
