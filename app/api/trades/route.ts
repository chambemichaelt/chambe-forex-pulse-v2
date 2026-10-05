import { NextResponse } from 'next/server';
import { tradeStore } from '@/lib/mock-store';

export async function GET() {
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), trades: tradeStore });
}

export async function POST(req: Request) {
  const body = await req.json();

  const trade = {
    id: `trade_${Date.now()}`,
    symbol: body.symbol ?? 'EURUSD',
    direction: body.direction ?? 'CALL',
    amount: Number(body.amount ?? 100),
    price: Number(body.price ?? 1.09),
    commission: Number(body.amount ?? 100) * 0.03,
    status: 'open',
    createdAt: new Date().toISOString(),
    broadcaster: 'You',
    followerCount: 4,
  };

  tradeStore.unshift(trade);

  return NextResponse.json({ ok: true, trade });
}
