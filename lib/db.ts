/**
 * Shared in-memory persistence layer for followers, trades, and commissions.
 * This keeps the app working without an external database while staying organized
 * for a future move to PostgreSQL / Redis.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

export type FollowerStatus = 'active' | 'paused' | 'inactive';
export type TradeDirection = 'CALL' | 'PUT';

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

export interface CommissionRecord {
  id: string;
  tradeId: string;
  followerId: string;
  amount: number;
  rate: number;
  createdAt: string;
}

const followers = new Map<string, FollowerAccount>();
const trades = new Map<string, TradeRecord>();
const commissions = new Map<string, CommissionRecord>();

const TOKEN_SECRET = process.env.DERIV_TOKEN_SECRET ?? 'forex-pulse-dev-secret';
const IV_LENGTH = 16;

function deriveKey(): Buffer {
  return createHash('sha256').update(TOKEN_SECRET).digest();
}

export function encryptToken(value: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-cbc', deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptToken(encrypted: string): string {
  const [ivHex, encryptedHex] = encrypted.split(':');
  if (!ivHex || !encryptedHex) {
    return encrypted;
  }

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', deriveKey(), iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function saveFollowerAccount(input: Omit<FollowerAccount, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }): FollowerAccount {
  const now = new Date().toISOString();
  const account: FollowerAccount = {
    ...input,
    accessToken: encryptToken(input.accessToken),
    refreshToken: input.refreshToken ? encryptToken(input.refreshToken) : undefined,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };

  followers.set(account.id, account);
  return {
    ...account,
    accessToken: decryptToken(account.accessToken),
    refreshToken: account.refreshToken ? decryptToken(account.refreshToken) : undefined,
  };
}

export function getFollowerAccount(id: string): FollowerAccount | null {
  const account = followers.get(id);
  if (!account) return null;

  return {
    ...account,
    accessToken: decryptToken(account.accessToken),
    refreshToken: account.refreshToken ? decryptToken(account.refreshToken) : undefined,
  };
}

export function getFollowerAccounts(): FollowerAccount[] {
  return Array.from(followers.values()).map((account) => ({
    ...account,
    accessToken: decryptToken(account.accessToken),
    refreshToken: account.refreshToken ? decryptToken(account.refreshToken) : undefined,
  }));
}

export function getActiveFollowerAccounts(): FollowerAccount[] {
  return getFollowerAccounts().filter((account) => account.status === 'active');
}

export function saveTrade(trade: TradeRecord): TradeRecord {
  trades.set(trade.id, trade);
  return trade;
}

export function getTrades(): TradeRecord[] {
  return Array.from(trades.values());
}

export function addCommission(record: Omit<CommissionRecord, 'id' | 'createdAt'>): CommissionRecord {
  const commission: CommissionRecord = {
    ...record,
    id: `commission_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  commissions.set(commission.id, commission);
  return commission;
}

export function getCommissions(): CommissionRecord[] {
  return Array.from(commissions.values());
}

export function resetDb(): void {
  followers.clear();
  trades.clear();
  commissions.clear();
}

export function seedDemoData(): void {
  const demoTrades: TradeRecord[] = [
    {
      id: 'trade_1001',
      symbol: 'EURUSD',
      direction: 'CALL',
      amount: 100,
      price: 1.0896,
      commission: 3,
      status: 'open',
      createdAt: new Date().toISOString(),
      broadcaster: 'You',
      followerCount: 4,
    },
    {
      id: 'trade_1002',
      symbol: 'USDJPY',
      direction: 'PUT',
      amount: 120,
      price: 156.24,
      commission: 3.6,
      status: 'open',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      broadcaster: 'You',
      followerCount: 4,
    },
  ];

  demoTrades.forEach((trade) => saveTrade(trade));
}

export function getFollowerAccountByEmail(email: string): FollowerAccount | null {
  const account = Array.from(followers.values()).find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!account) return null;

  return {
    ...account,
    accessToken: decryptToken(account.accessToken),
    refreshToken: account.refreshToken ? decryptToken(account.refreshToken) : undefined,
  };
}

export function updateFollowerStatus(id: string, status: FollowerStatus): FollowerAccount | null {
  const account = followers.get(id);
  if (!account) return null;

  const updated = {
    ...account,
    status,
    updatedAt: new Date().toISOString(),
  };

  followers.set(id, updated);
  return {
    ...updated,
    accessToken: decryptToken(updated.accessToken),
    refreshToken: updated.refreshToken ? decryptToken(updated.refreshToken) : undefined,
  };
}

export function deleteFollowerAccount(id: string): boolean {
  return followers.delete(id);
}
