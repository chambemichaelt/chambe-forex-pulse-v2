/**
 * Session management utilities
 * In production, replace with Redis or database-backed sessions
 */

import { SessionData, DerivUser } from './types';

// In-memory session store (replace with Redis in production)
const sessions = new Map<string, SessionData>();

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function createSession(user: DerivUser): string {
  const sessionId = generateSessionId();
  sessions.set(sessionId, {
    user,
    isAuthenticated: true,
    createdAt: Date.now(),
  });
  return sessionId;
}

export function getSession(sessionId: string): SessionData | null {
  const session = sessions.get(sessionId);

  if (!session) return null;

  // Check if session expired (24 hours)
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function updateSession(sessionId: string, user: DerivUser): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.user = user;
  }
}