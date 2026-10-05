/**
 * Logout and destroy session
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/session';

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  if (sessionId) {
    deleteSession(sessionId);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete('session_id');

  return response;
}