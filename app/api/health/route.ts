import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'healthy',
    service: 'forex-pulse-copy-trading',
    timestamp: new Date().toISOString(),
  });
}
