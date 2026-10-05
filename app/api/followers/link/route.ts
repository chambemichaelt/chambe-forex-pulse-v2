import { NextResponse } from 'next/server';
import { derivClient } from '@/lib/deriv-client';
import { decryptToken, getActiveFollowerAccounts, saveTrade, addCommission } from '@/lib/db';
import { calculateCommission } from '@/lib/commission';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const symbol = body.symbol ?? 'EURUSD';
    const direction = body.direction ?? 'CALL';
    const amount = Number(body.amount ?? 100);
    const price = Number(body.price ?? 1.09);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    const followers = getActiveFollowerAccounts();
    const executionResults: Array<{ followerId: string; status: 'success' | 'failed'; contractId?: number; error?: string }> = [];

    for (const follower of followers) {
      try {
        const token = decryptToken(follower.accessToken);
        const response = await derivClient.executeTrade(token, {
          symbol,
          contract_type: direction,
          amount,
          duration: 60,
          duration_unit: 'm',
          currency: 'USD',
        });

        executionResults.push({
          followerId: follower.id,
          status: 'success',
          contractId: response.buy.contract_id,
        });

        const commission = calculateCommission(amount);
        const tradeRecord = saveTrade({
          id: `trade_${Date.now()}_${follower.id}`,
          symbol,
          direction,
          amount,
          price,
          commission,
          status: 'open',
          createdAt: new Date().toISOString(),
          broadcaster: 'You',
          followerCount: followers.length,
          contractId: response.buy.contract_id,
          followerId: follower.id,
        });

        addCommission({
          tradeId: tradeRecord.id,
          followerId: follower.id,
          amount: commission,
          rate: 0.03,
        });
      } catch (error) {
        executionResults.push({
          followerId: follower.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Execution failed',
        });
      }
    }

    return NextResponse.json({ ok: true, results: executionResults, followerCount: followers.length });
  } catch (error) {
    console.error('Follower sync failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Follower sync failed' },
      { status: 500 }
    );
  }
}
