import { NextResponse } from 'next/server';
import { updateFollowerStatus, deleteFollowerAccount } from '@/lib/db';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const followerId = body.followerId?.toString();
    const status = body.status?.toString();

    if (!followerId || !status) {
      return NextResponse.json(
        { error: 'followerId and status are required' },
        { status: 400 }
      );
    }

    if (!['active', 'paused', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be active, paused, or inactive' },
        { status: 400 }
      );
    }

    const updated = updateFollowerStatus(followerId, status as 'active' | 'paused' | 'inactive');
    if (!updated) {
      return NextResponse.json({ error: 'Follower not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, follower: updated });
  } catch (error) {
    console.error('Failed to update follower status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update follower' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const followerId = body.followerId?.toString();

    if (!followerId) {
      return NextResponse.json(
        { error: 'followerId is required' },
        { status: 400 }
      );
    }

    const deleted = deleteFollowerAccount(followerId);
    if (!deleted) {
      return NextResponse.json({ error: 'Follower not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: 'Follower account deleted' });
  } catch (error) {
    console.error('Failed to delete follower:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete follower' },
      { status: 500 }
    );
  }
}
