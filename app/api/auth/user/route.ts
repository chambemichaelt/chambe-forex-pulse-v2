/**
 * Get current user info from session
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const session = getSession(sessionId);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Session expired' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      balance: session.user.balance,
      currency: session.user.currency,
      accountId: session.user.accountId,
      loginId: session.user.loginId,
    },
  });
}