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
  refreshToken?: string;
}

export interface SessionData {
  user: DerivUser | null;
  isAuthenticated: boolean;
  createdAt: number;
}

export type FollowerStatus = 'connected' | 'error' | 'disconnected';

export interface FollowerAccount {
  id: string;
  userId: string;
  email: string;
  loginId: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  scopes: string[];
  status: FollowerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TradeRecord {
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
  contractId?: number;
  followerId?: string;
}
