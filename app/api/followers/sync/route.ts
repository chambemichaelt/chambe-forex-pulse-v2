import { NextResponse } from 'next/server';
import { decryptToken, getActiveFollowerAccounts, saveTrade, addCommission } from '@/lib/db';
import { derivClient } from '@/lib/deriv-client';
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

    const followers = await getActiveFollowerAccounts();
    const results: Array<{ followerId: string; success: boolean; contractId?: number; error?: string }> = [];

    for (const follower of followers) {
      try {
        const token = decryptToken(follower.accessToken);
        const response = await derivClient.executeTrade(token, {
          symbol,
          contract_type: direction as 'CALL' | 'PUT',
          amount,
          duration: 60,
          duration_unit: 'm',
          currency: 'USD',
        });

        const commission = calculateCommission(amount);
        const tradeRecord = await saveTrade({
          id: `trade_${Date.now()}_${follower.id}`,
          symbol,
          direction: direction as 'CALL' | 'PUT',
          amount,
          price,
          commission,
          status: 'open',
          createdAt: new Date().toISOString(),
          broadcaster: 'Broadcaster',
          followerCount: followers.length,
          contractId: response.buy.contract_id,
          followerId: follower.id,
        });

        await addCommission({
          tradeId: tradeRecord.id,
          followerId: follower.id,
          amount: commission,
          rate: 0.03,
        });

        results.push({
          followerId: follower.id,
          success: true,
          contractId: response.buy.contract_id,
        });
      } catch (error) {
        results.push({
          followerId: follower.id,
          success: false,
          error: error instanceof Error ? error.message : 'Failed to sync follower trade',
        });
      }
    }

    return NextResponse.json({ ok: true, results, followerCount: followers.length });
  } catch (error) {
    console.error('Follower sync route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync followers' },
      { status: 500 }
    );
  }
}
