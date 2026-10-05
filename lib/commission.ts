/**
 * Commission calculations for copy trading fees.
 * Default commission is 3% per follower trade.
 */

export const COMMISSION_RATE = 0.03;

export interface CommissionSummary {
  totalVolume: number;
  totalCommission: number;
  tradeCount: number;
  rate: number;
}

export function calculateCommission(amount: number, rate: number = COMMISSION_RATE): number {
  return Number((amount * rate).toFixed(2));
}

export function calculateCommissionForTrade(
  amount: number,
  followerCount: number = 1,
  rate: number = COMMISSION_RATE
): number {
  return Number((amount * followerCount * rate).toFixed(2));
}

export function summarizeCommissions(
  totalVolume: number,
  totalCommission: number,
  tradeCount: number
): CommissionSummary {
  return {
    totalVolume,
    totalCommission,
    tradeCount,
    rate: COMMISSION_RATE,
  };
}
