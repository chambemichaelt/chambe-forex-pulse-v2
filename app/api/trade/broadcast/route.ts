import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { derivClient } from '@/lib/deriv-client';
import { getSession } from '@/lib/session';
import { calculateCommission } from '@/lib/commission';
import { saveTrade, addCommission } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = getSession(sessionId);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const body = await req.json();
    const symbol = body.symbol ?? 'EURUSD';
    const direction = body.direction ?? 'CALL';
    const amount = Number(body.amount ?? 100);
    const price = Number(body.price ?? 1.09);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    const tradeResponse = await derivClient.executeTrade(session.user.token, {
      symbol,
      contract_type: direction as 'CALL' | 'PUT',
      amount,
      duration: 60,
      duration_unit: 'm',
      currency: session.user.currency ?? 'USD',
    });

    const commission = calculateCommission(amount);
    const tradeRecord = saveTrade({
      id: `trade_${Date.now()}`,
      symbol,
      direction: direction as 'CALL' | 'PUT',
      amount,
      price,
      commission,
      status: 'open',
      createdAt: new Date().toISOString(),
      broadcaster: session.user.email,
      followerCount: 1,
      contractId: tradeResponse.buy.contract_id,
    });

    addCommission({
      tradeId: tradeRecord.id,
      followerId: session.user.id,
      amount: commission,
      rate: 0.03,
    });

    return NextResponse.json({
      ok: true,
      trade: tradeRecord,
      commission,
      contractId: tradeResponse.buy.contract_id,
    });
  } catch (error) {
    console.error('Broadcast trade failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Trade broadcast failed' },
      { status: 500 }
    );
  }
}
