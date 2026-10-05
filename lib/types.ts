/**
 * Shared TypeScript types for the Forex Pulse app
 */

export type TradeDirection = 'CALL' | 'PUT';
export type ConnectionMode = 'broadcast' | 'read-only' | 'independent';

export interface Trade {
  id: string;
  symbol: string;
  direction: TradeDirection;
  amount: number;
  price: number;
  commission: number;
  status: 'open' | 'closed';
  createdAt: string;
  broadcaster: string;
  followerCount: number;
}

export interface Summary {
  totalVolume: number;
  totalCommission: number;
  openTrades: number;
  commissionRate: number;
}

export interface DerivUser {
  id: string;
  email: string;
  balance: number;
  currency: string;
  accountId: string;
  token: string;
  loginId: string;
}

export interface SessionData {
  user: DerivUser | null;
  isAuthenticated: boolean;
  createdAt: number;
}