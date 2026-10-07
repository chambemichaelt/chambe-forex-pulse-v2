/**
 * Shared in-memory persistence layer for followers, trades, and commissions.
 * This keeps the app working without an external database while staying organized
 * for a future move to PostgreSQL / Redis.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { sql } from '@/lib/neon';

export type FollowerStatus = 'active' | 'paused' | 'inactive';
export type ForexPulseAccountRole = 'owner' | 'broadcaster' | 'follower';
export type ForexPulseUserStatus = 'pending' | 'active' | 'suspended' | 'disabled';
export type TradeDirection = 'CALL' | 'PUT';

export interface ForexPulseUser {
  id: string;
  forexPulseId: string;
  email: string;
  name: string;
  role: ForexPulseAccountRole;
  status: ForexPulseUserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FollowerAccount {
  role: ForexPulseAccountRole;
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

const users = new Map<string, ForexPulseUser>();
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

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', deriveKey(), iv);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (error) {
    return encrypted;
  }
}

async function generateForexPulseId(): Promise<string> {
  while (true) {
    const number = Math.floor(100000 + Math.random() * 900000);
    const id = `FP-${number}`;

    const rows = await sql`
      SELECT 1
      FROM forex_pulse_users
      WHERE forex_pulse_id = ${id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return id;
    }
  }
}

export async function createForexPulseUser(input: {
  email: string;
  name: string;
  role: Exclude<ForexPulseAccountRole, 'owner'>;
}): Promise<ForexPulseUser> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const existing = await getForexPulseUserByEmail(normalizedEmail);

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const forexPulseId = await generateForexPulseId();

  const rows = await sql`
    INSERT INTO forex_pulse_users (
      id,
      forex_pulse_id,
      email,
      name,
      role,
      status,
      created_at,
      updated_at
    )
    VALUES (
      ${id},
      ${forexPulseId},
      ${normalizedEmail},
      ${input.name.trim()},
      ${input.role},
      'pending',
      ${now},
      ${now}
    )
    RETURNING
      id,
      forex_pulse_id,
      email,
      name,
      role,
      status,
      created_at,
      updated_at
  `;

  const row = rows[0];

  return {
    id: row.id,
    forexPulseId: row.forex_pulse_id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getForexPulseUser(
  id: string
): Promise<ForexPulseUser | null> {
  const rows = await sql`
    SELECT
      id,
      forex_pulse_id,
      email,
      name,
      role,
      status,
      created_at,
      updated_at
    FROM forex_pulse_users
    WHERE id = ${id}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  return {
    id: row.id,
    forexPulseId: row.forex_pulse_id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getForexPulseUserByEmail(
  email: string
): Promise<ForexPulseUser | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const rows = await sql`
    SELECT
      id,
      forex_pulse_id,
      email,
      name,
      role,
      status,
      created_at,
      updated_at
    FROM forex_pulse_users
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  return {
    id: row.id,
    forexPulseId: row.forex_pulse_id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getForexPulseUserByForexPulseId(
  forexPulseId: string
): Promise<ForexPulseUser | null> {
  const normalizedId = forexPulseId.trim().toUpperCase();

  const rows = await sql`
    SELECT
      id,
      forex_pulse_id,
      email,
      name,
      role,
      status,
      created_at,
      updated_at
    FROM forex_pulse_users
    WHERE forex_pulse_id = ${normalizedId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  return {
    id: row.id,
    forexPulseId: row.forex_pulse_id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export function getForexPulseUsers(): ForexPulseUser[] {
  return Array.from(users.values());
}

export async function activateForexPulseUser(
  id: string,
  role: Exclude<ForexPulseAccountRole, 'owner'>
): Promise<ForexPulseUser | null> {
  const rows = await sql`
    UPDATE forex_pulse_users
    SET
      status = 'active',
      updated_at = NOW()
    WHERE id = ${id}
      AND role = ${role}
    RETURNING
      id,
      forex_pulse_id,
      email,
      name,
      role,
      status,
      created_at,
      updated_at
  `;

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  return {
    id: row.id,
    forexPulseId: row.forex_pulse_id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export function updateForexPulseUserStatus(
  id: string,
  status: ForexPulseUserStatus
): ForexPulseUser | null {
  const user = users.get(id);

  if (!user) {
    return null;
  }

  const updated: ForexPulseUser = {
    ...user,
    status,
    updatedAt: new Date().toISOString(),
  };

  users.set(id, updated);

  return updated;
}

export function saveFollowerAccount(
  input: Omit<FollowerAccount, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }
): FollowerAccount {
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

export async function registerFollowerAccount(input: {
  userId: string;
  email: string;
  loginId: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  scopes: string[];
  role?: ForexPulseAccountRole;
}): Promise<FollowerAccount> {
  const existing = await getFollowerAccountByAccountId(input.accountId);
  const now = new Date().toISOString();

  const role = existing?.role ?? input.role ?? 'follower';
  const id =
    existing?.id ??
    `follower_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const encryptedAccessToken = encryptToken(input.accessToken);
  const encryptedRefreshToken = input.refreshToken
    ? encryptToken(input.refreshToken)
    : existing?.refreshToken
      ? encryptToken(existing.refreshToken)
      : undefined;

  const rows = await sql`
    INSERT INTO deriv_accounts (
      id,
      user_id,
      role,
      email,
      login_id,
      account_id,
      access_token,
      refresh_token,
      scopes,
      status,
      created_at,
      updated_at
    )
    VALUES (
      ${id},
      ${input.userId},
      ${role},
      ${input.email},
      ${input.loginId},
      ${input.accountId},
      ${encryptedAccessToken},
      ${encryptedRefreshToken ?? null},
      ${input.scopes},
      'active',
      ${existing?.createdAt ?? now},
      ${now}
    )
    ON CONFLICT (account_id)
    DO UPDATE SET
      user_id = EXCLUDED.user_id,
      role = EXCLUDED.role,
      email = EXCLUDED.email,
      login_id = EXCLUDED.login_id,
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      scopes = EXCLUDED.scopes,
      status = 'active',
      updated_at = EXCLUDED.updated_at
    RETURNING
      id,
      user_id,
      role,
      email,
      login_id,
      account_id,
      access_token,
      refresh_token,
      scopes,
      status,
      created_at,
      updated_at
  `;

  const row = rows[0];

  return {
    role: row.role,
    id: row.id,
    userId: row.user_id,
    email: row.email,
    loginId: row.login_id,
    accountId: row.account_id,
    accessToken: '[stored securely]',
    refreshToken: row.refresh_token ? '[stored securely]' : undefined,
    scopes: row.scopes ?? [],
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function updateFollowerRole(
  id: string,
  role: ForexPulseAccountRole
): Promise<FollowerAccount | null> {
  const rows = await sql`
    UPDATE deriv_accounts
    SET
      role = ${role},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING
      id,
      user_id,
      role,
      email,
      login_id,
      account_id,
      access_token,
      refresh_token,
      scopes,
      status,
      created_at,
      updated_at
  `;

  if (rows.length === 0) return null;

  const row = rows[0];

  return {
    role: row.role,
    id: row.id,
    userId: row.user_id,
    email: row.email,
    loginId: row.login_id,
    accountId: row.account_id,
    accessToken: '[stored securely]',
    refreshToken: row.refresh_token ? '[stored securely]' : undefined,
    scopes: row.scopes ?? [],
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
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

export async function getFollowerAccounts(): Promise<FollowerAccount[]> {
  const rows = await sql`
    SELECT
      id,
      user_id,
      role,
      email,
      login_id,
      account_id,
      access_token,
      refresh_token,
      scopes,
      status,
      created_at,
      updated_at
    FROM deriv_accounts
    ORDER BY created_at ASC
  `;

  return rows.map((row) => ({
    role: row.role,
    id: row.id,
    userId: row.user_id,
    email: row.email,
    loginId: row.login_id,
    accountId: row.account_id,
    accessToken: decryptToken(row.access_token),
    refreshToken: row.refresh_token
      ? decryptToken(row.refresh_token)
      : undefined,
    scopes: row.scopes ?? [],
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));
}

export async function getActiveFollowerAccounts(): Promise<FollowerAccount[]> {
  const rows = await sql`
    SELECT
      id,
      user_id,
      role,
      email,
      login_id,
      account_id,
      access_token,
      refresh_token,
      scopes,
      status,
      created_at,
      updated_at
    FROM deriv_accounts
    WHERE status = 'active'
    ORDER BY created_at ASC
  `;

  return rows.map((row) => ({
    role: row.role,
    id: row.id,
    userId: row.user_id,
    email: row.email,
    loginId: row.login_id,
    accountId: row.account_id,
    accessToken: decryptToken(row.access_token),
    refreshToken: row.refresh_token
      ? decryptToken(row.refresh_token)
      : undefined,
    scopes: row.scopes ?? [],
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));
}

export async function getFollowerAccountByAccountId(
  accountId: string
): Promise<FollowerAccount | null> {
  const rows = await sql`
    SELECT
      id,
      user_id,
      role,
      email,
      login_id,
      account_id,
      access_token,
      refresh_token,
      scopes,
      status,
      created_at,
      updated_at
    FROM deriv_accounts
    WHERE account_id = ${accountId}
    LIMIT 1
  `;

  if (rows.length === 0) return null;

  const row = rows[0];

  return {
    role: row.role,
    id: row.id,
    userId: row.user_id,
    email: row.email,
    loginId: row.login_id,
    accountId: row.account_id,
    accessToken: decryptToken(row.access_token),
    refreshToken: row.refresh_token
      ? decryptToken(row.refresh_token)
      : undefined,
    scopes: row.scopes ?? [],
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getFollowerAccountByUserId(
  userId: string
): Promise<FollowerAccount | null> {
  const rows = await sql`
    SELECT
      id,
      user_id,
      role,
      email,
      login_id,
      account_id,
      access_token,
      refresh_token,
      scopes,
      status,
      created_at,
      updated_at
    FROM deriv_accounts
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) return null;

  const row = rows[0];

  return {
    role: row.role,
    id: row.id,
    userId: row.user_id,
    email: row.email,
    loginId: row.login_id,
    accountId: row.account_id,
    accessToken: decryptToken(row.access_token),
    refreshToken: row.refresh_token
      ? decryptToken(row.refresh_token)
      : undefined,
    scopes: row.scopes ?? [],
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getFollowerAccountByEmail(
  email: string
): Promise<FollowerAccount | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const rows = await sql`
    SELECT
      id,
      user_id,
      role,
      email,
      login_id,
      account_id,
      access_token,
      refresh_token,
      scopes,
      status,
      created_at,
      updated_at
    FROM deriv_accounts
    WHERE LOWER(email) = ${normalizedEmail}
    LIMIT 1
  `;

  if (rows.length === 0) return null;

  const row = rows[0];

  return {
    role: row.role,
    id: row.id,
    userId: row.user_id,
    email: row.email,
    loginId: row.login_id,
    accountId: row.account_id,
    accessToken: decryptToken(row.access_token),
    refreshToken: row.refresh_token
      ? decryptToken(row.refresh_token)
      : undefined,
    scopes: row.scopes ?? [],
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function linkBroadcasterFollower(
  broadcasterUserId: string,
  followerUserId: string
): Promise<void> {
  if (broadcasterUserId === followerUserId) {
    throw new Error('A user cannot follow themselves');
  }

  await sql`
    INSERT INTO broadcaster_followers (
      id,
      broadcaster_user_id,
      follower_user_id,
      status,
      created_at,
      updated_at
    )
    VALUES (
      ${`bf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`},
      ${broadcasterUserId},
      ${followerUserId},
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (broadcaster_user_id, follower_user_id)
    DO UPDATE SET
      status = 'active',
      updated_at = NOW()
  `;
}

export async function getBroadcasterFollowers(
  broadcasterUserId: string
): Promise<FollowerAccount[]> {
  const rows = await sql`
    SELECT
      da.id,
      da.user_id,
      da.role,
      da.email,
      da.login_id,
      da.account_id,
      da.access_token,
      da.refresh_token,
      da.scopes,
      da.status,
      da.created_at,
      da.updated_at
    FROM broadcaster_followers bf
    INNER JOIN deriv_accounts da
      ON da.user_id = bf.follower_user_id
    WHERE bf.broadcaster_user_id = ${broadcasterUserId}
      AND bf.status = 'active'
    ORDER BY bf.created_at ASC
  `;

  return rows.map((row) => ({
    role: row.role,
    id: row.id,
    userId: row.user_id,
    email: row.email,
    loginId: row.login_id,
    accountId: row.account_id,
    accessToken: decryptToken(row.access_token),
    refreshToken: row.refresh_token
      ? decryptToken(row.refresh_token)
      : undefined,
    scopes: row.scopes ?? [],
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));
}

export async function getFollowerBroadcaster(
  followerUserId: string
): Promise<ForexPulseUser | null> {
  const rows = await sql`
    SELECT
      u.id,
      u.forex_pulse_id,
      u.email,
      u.name,
      u.role,
      u.status,
      u.created_at,
      u.updated_at
    FROM broadcaster_followers bf
    INNER JOIN forex_pulse_users u
      ON u.id = bf.broadcaster_user_id
    WHERE bf.follower_user_id = ${followerUserId}
      AND bf.status = 'active'
    ORDER BY bf.created_at ASC
    LIMIT 1
  `;

  if (rows.length === 0) return null;

  const row = rows[0];

  return {
    id: row.id,
    forexPulseId: row.forex_pulse_id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function updateBroadcasterFollowerStatus(
  broadcasterUserId: string,
  followerUserId: string,
  status: FollowerStatus
): Promise<boolean> {
  const rows = await sql`
    UPDATE broadcaster_followers
    SET
      status = ${status},
      updated_at = NOW()
    WHERE broadcaster_user_id = ${broadcasterUserId}
      AND follower_user_id = ${followerUserId}
    RETURNING id
  `;

  return rows.length > 0;
}

export async function updateFollowerStatus(
  id: string,
  status: FollowerStatus
): Promise<FollowerAccount | null> {
  const rows = await sql`
    UPDATE deriv_accounts
    SET
      status = ${status},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING
      id,
      user_id,
      role,
      email,
      login_id,
      account_id,
      access_token,
      refresh_token,
      scopes,
      status,
      created_at,
      updated_at
  `;

  if (rows.length === 0) return null;

  const row = rows[0];

  return {
    role: row.role,
    id: row.id,
    userId: row.user_id,
    email: row.email,
    loginId: row.login_id,
    accountId: row.account_id,
    accessToken: decryptToken(row.access_token),
    refreshToken: row.refresh_token
      ? decryptToken(row.refresh_token)
      : undefined,
    scopes: row.scopes ?? [],
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function deleteFollowerAccount(id: string): Promise<boolean> {
  const rows = await sql`
    DELETE FROM deriv_accounts
    WHERE id = ${id}
    RETURNING id
  `;

  return rows.length > 0;
}

export async function saveTrade(trade: TradeRecord): Promise<TradeRecord> {
  await sql`
    INSERT INTO trades (
      id, symbol, direction, amount, price, commission, status,
      created_at, broadcaster, follower_count, contract_id, follower_id
    )
    VALUES (
      ${trade.id},
      ${trade.symbol},
      ${trade.direction},
      ${trade.amount},
      ${trade.price},
      ${trade.commission},
      ${trade.status},
      ${trade.createdAt},
      ${trade.broadcaster},
      ${trade.followerCount},
      ${trade.contractId ?? null},
      ${trade.followerId ?? null}
    )
    ON CONFLICT (id)
    DO UPDATE SET
      symbol = EXCLUDED.symbol,
      direction = EXCLUDED.direction,
      amount = EXCLUDED.amount,
      price = EXCLUDED.price,
      commission = EXCLUDED.commission,
      status = EXCLUDED.status,
      broadcaster = EXCLUDED.broadcaster,
      follower_count = EXCLUDED.follower_count,
      contract_id = EXCLUDED.contract_id,
      follower_id = EXCLUDED.follower_id
  `;
  return trade;
}

export async function getTrades(): Promise<TradeRecord[]> {
  const rows = await sql`
    SELECT
      id, symbol, direction, amount, price, commission, status,
      created_at, broadcaster, follower_count, contract_id, follower_id
    FROM trades
    ORDER BY created_at DESC
  `;

  return rows.map((row) => ({
    id: row.id,
    symbol: row.symbol,
    direction: row.direction,
    amount: Number(row.amount),
    price: Number(row.price),
    commission: Number(row.commission),
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    broadcaster: row.broadcaster,
    followerCount: Number(row.follower_count),
    contractId: row.contract_id == null ? undefined : Number(row.contract_id),
    followerId: row.follower_id ?? undefined,
  }));
}

export async function addCommission(
  record: Omit<CommissionRecord, 'id' | 'createdAt'>
): Promise<CommissionRecord> {
  const commission: CommissionRecord = {
    ...record,
    id: `commission_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  await sql`
    INSERT INTO commissions (
      id, trade_id, follower_id, amount, rate, created_at
    )
    VALUES (
      ${commission.id},
      ${commission.tradeId},
      ${commission.followerId},
      ${commission.amount},
      ${commission.rate},
      ${commission.createdAt}
    )
  `;

  return commission;
}

export async function getCommissions(): Promise<CommissionRecord[]> {
  const rows = await sql`
    SELECT
      id, trade_id, follower_id, amount, rate, created_at
    FROM commissions
    ORDER BY created_at DESC
  `;

  return rows.map((row) => ({
    id: row.id,
    tradeId: row.trade_id,
    followerId: row.follower_id,
    amount: Number(row.amount),
    rate: Number(row.rate),
    createdAt: new Date(row.created_at).toISOString(),
  }));
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

  void Promise.all(demoTrades.map((trade) => saveTrade(trade)));
}
