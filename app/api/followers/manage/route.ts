import { NextResponse } from 'next/server';
import { getFollowerAccounts } from '@/lib/db';

export async function GET() {
  try {
    const followers = getFollowerAccounts();
    return NextResponse.json({ ok: true, followers });
  } catch (error) {
    console.error('Failed to list followers:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list followers' },
      { status: 500 }
    );
  }
}
