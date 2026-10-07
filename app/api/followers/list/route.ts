import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { getFollowerAccounts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = await getSession(sessionId);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    const role = session.user.role;

    if (role !== 'owner' && role !== 'broadcaster') {
      return NextResponse.json(
        { error: 'Follower registry access requires broadcaster permission' },
        { status: 403 }
      );
    }

    const followers = await getFollowerAccounts();

    const safeFollowers = followers.map((follower) => ({
      id: follower.id,
      userId: follower.userId,
      email: follower.email,
      loginId: follower.loginId,
      accountId: follower.accountId,
      status: follower.status,
      createdAt: follower.createdAt,
      updatedAt: follower.updatedAt,
    }));

    return NextResponse.json({
      ok: true,
      followers: safeFollowers,
    });
  } catch (error) {
    console.error('Failed to list followers:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to list followers',
      },
      { status: 500 }
    );
  }
}
