import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { updateFollowerStatus, updateFollowerRole, deleteFollowerAccount } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function requireManager() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return {
      response: NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      ),
    };
  }

  const session = await getSession(sessionId);

  if (!session || !session.user) {
    return {
      response: NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      ),
    };
  }

  const role = session.user.role;

  if (role !== 'owner' && role !== 'broadcaster') {
    return {
      response: NextResponse.json(
        { error: 'Follower management requires broadcaster permission' },
        { status: 403 }
      ),
    };
  }

  return {
    session,
    user: session.user,
  };
}

export async function PATCH(req: Request) {
  try {
    const authorization = await requireManager();

    if (authorization.response) {
      return authorization.response;
    }

    const body = await req.json();
    const followerId = body.followerId?.toString();
    const status = body.status?.toString();
    const requestedRole = body.role?.toString();

    if (!followerId) {
      return NextResponse.json(
        { error: 'followerId is required' },
        { status: 400 }
      );
    }

    /*
     * Role changes are Owner-only.
     * The Owner role cannot be assigned through this endpoint.
     */
    if (requestedRole !== undefined) {
      if (authorization.user.role !== 'owner') {
        return NextResponse.json(
          { error: 'Only the owner can change account roles' },
          { status: 403 }
        );
      }

      if (!['broadcaster', 'follower'].includes(requestedRole)) {
        return NextResponse.json(
          { error: 'role must be broadcaster or follower' },
          { status: 400 }
        );
      }

      const updated = await updateFollowerRole(
        followerId,
        requestedRole as 'broadcaster' | 'follower'
      );

      if (!updated) {
        return NextResponse.json(
          { error: 'Follower not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        follower: {
          id: updated.id,
          userId: updated.userId,
          email: updated.email,
          loginId: updated.loginId,
          accountId: updated.accountId,
          role: updated.role,
          status: updated.status,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      });
    }

    /*
     * Status changes remain available to Owners and Broadcasters.
     */
    if (!status) {
      return NextResponse.json(
        { error: 'status or role is required' },
        { status: 400 }
      );
    }

    if (!['active', 'paused', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be active, paused, or inactive' },
        { status: 400 }
      );
    }

    const updated = await updateFollowerStatus(
      followerId,
      status as 'active' | 'paused' | 'inactive'
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Follower not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      follower: {
        id: updated.id,
        userId: updated.userId,
        email: updated.email,
        loginId: updated.loginId,
        accountId: updated.accountId,
        role: updated.role,
        status: updated.status,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to update follower status:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update follower',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const authorization = await requireManager();

    if (authorization.response) {
      return authorization.response;
    }

    if (authorization.user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only the owner can delete follower accounts' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const followerId = body.followerId?.toString();

    if (!followerId) {
      return NextResponse.json(
        { error: 'followerId is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteFollowerAccount(followerId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Follower not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Follower account deleted',
    });
  } catch (error) {
    console.error('Failed to delete follower:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete follower',
      },
      { status: 500 }
    );
  }
}
