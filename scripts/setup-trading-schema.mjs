import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

await sql`
CREATE TABLE IF NOT EXISTS broadcaster_followers (
  id TEXT PRIMARY KEY,
  broadcaster_user_id TEXT NOT NULL REFERENCES forex_pulse_users(id) ON DELETE CASCADE,
  follower_user_id TEXT NOT NULL REFERENCES forex_pulse_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active','paused','inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (broadcaster_user_id, follower_user_id)
)`;

await sql`
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('CALL','PUT')),
  amount NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  commission NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('open','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  broadcaster TEXT NOT NULL,
  follower_count INTEGER NOT NULL DEFAULT 0,
  contract_id BIGINT,
  follower_id TEXT
)`;

await sql`
CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY,
  trade_id TEXT NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  follower_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  rate NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

await sql`
CREATE INDEX IF NOT EXISTS idx_bf_broadcaster
ON broadcaster_followers(broadcaster_user_id)`;

await sql`
CREATE INDEX IF NOT EXISTS idx_bf_follower
ON broadcaster_followers(follower_user_id)`;

await sql`
CREATE INDEX IF NOT EXISTS idx_trades_created
ON trades(created_at DESC)`;

await sql`
CREATE INDEX IF NOT EXISTS idx_commissions_created
ON commissions(created_at DESC)`;

console.log('Trading schema ready.');
