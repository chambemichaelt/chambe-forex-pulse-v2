/**
 * Durable session management using Neon PostgreSQL.
 */

import { neon } from '@neondatabase/serverless';
import { SessionData, DerivUser } from './types';
import crypto from 'crypto';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL is not configured');
  }

  return url;
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
}

export async function createSession(user: DerivUser): Promise<string> {
  const sql = neon(getDatabaseUrl());
  const sessionId = generateSessionId();
  const now = Date.now();
  const expiresAt = new Date(now + 24 * 60 * 60 * 1000);

  const sessionData: SessionData = {
    user,
    isAuthenticated: true,
    createdAt: now,
  };

  await sql`
    INSERT INTO sessions (
      id,
      user_id,
      role,
      account_id,
      session_data,
      created_at,
      expires_at
    )
    VALUES (
      ${sessionId},
      ${user.id},
      ${user.role},
      ${user.accountId},
      ${JSON.stringify(sessionData)}::jsonb,
      NOW(),
      ${expiresAt.toISOString()}
    )
  `;

  return sessionId;
}

export async function getSession(
  sessionId: string
): Promise<SessionData | null> {
  const sql = neon(getDatabaseUrl());

  const rows = await sql`
    SELECT session_data, expires_at
    FROM sessions
    WHERE id = ${sessionId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await deleteSession(sessionId);
    return null;
  }

  return row.session_data as SessionData;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const sql = neon(getDatabaseUrl());

  await sql`
    DELETE FROM sessions
    WHERE id = ${sessionId}
  `;
}

export async function updateSession(
  sessionId: string,
  user: DerivUser
): Promise<void> {
  const sql = neon(getDatabaseUrl());

  const sessionData: SessionData = {
    user,
    isAuthenticated: true,
    createdAt: Date.now(),
  };

  await sql`
    UPDATE sessions
    SET
      role = ${user.role},
      account_id = ${user.accountId},
      session_data = ${JSON.stringify(sessionData)}::jsonb
    WHERE id = ${sessionId}
  `;
}
