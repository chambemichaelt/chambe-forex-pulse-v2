import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { tradeStore, type TradeRecord } from '@/lib/mock-store';
import { getSession } from '@/lib/session';

async function getAuthenticatedSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return null;
  }

  const session = getSession(sessionId);

  if (!session || !session.user) {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await getAuthenticatedSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    trades: tradeStore,
  });
}

export async function POST(req: Request) {
  const session = await getAuthenticatedSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const user = session.user;

  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const role = user.role;

  if (role !== 'owner' && role !== 'broadcaster') {
    return NextResponse.json(
      { error: 'Broadcast permission required' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    const amount = Number(body.amount ?? 100);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Trade amount must be greater than zero' },
        { status: 400 }
      );
    }

    const direction =
      body.direction === 'PUT' ? 'PUT' : 'CALL';

    const trade: TradeRecord = {
      id: `trade_${Date.now()}`,
      symbol: body.symbol ?? 'EURUSD',
      direction,
      amount,
      price: Number(body.price ?? 1.09),
      commission: 0,
      status: 'open',
      createdAt: new Date().toISOString(),
      broadcaster: user.accountId,
      followerCount: 0,
    };

    tradeStore.unshift(trade);

    return NextResponse.json({
      ok: true,
      trade,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid trade request' },
      { status: 400 }
    );
  }
}
