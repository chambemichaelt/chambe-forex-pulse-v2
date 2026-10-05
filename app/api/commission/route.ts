import { NextResponse } from 'next/server';
import { tradeStore } from '@/lib/mock-store';

export async function GET() {
  const totalVolume = tradeStore.reduce((sum, trade) => sum + trade.amount, 0);
  const totalCommission = tradeStore.reduce((sum, trade) => sum + trade.commission, 0);

  return NextResponse.json({
    ok: true,
    totalVolume,
    totalCommission,
    commissionRate: 0.03,
    openTrades: tradeStore.filter((trade) => trade.status === 'open').length,
  });
}
