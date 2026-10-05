import { NextResponse } from 'next/server';
import { getCommissions, getTrades } from '@/lib/db';
import { summarizeCommissions } from '@/lib/commission';

export async function GET() {
  try {
    const commissions = getCommissions();
    const trades = getTrades();

    const totalVolume = trades.reduce((sum, trade) => sum + trade.amount, 0);
    const totalCommission = commissions.reduce((sum, comm) => sum + comm.amount, 0);
    const tradeCount = trades.length;

    const summary = summarizeCommissions(totalVolume, totalCommission, tradeCount);

    return NextResponse.json({
      ok: true,
      summary,
      commissions,
      trades,
    });
  } catch (error) {
    console.error('Failed to get commission summary:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get commission summary' },
      { status: 500 }
    );
  }
}
