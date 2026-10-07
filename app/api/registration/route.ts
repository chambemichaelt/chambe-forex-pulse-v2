import { NextRequest, NextResponse } from 'next/server';
import {
  createForexPulseUser,
  getForexPulseUserByEmail,
} from '@/lib/db';
import {
  createRegistrationState,
  type RegistrationRole,
} from '@/lib/registration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role = body.role as RegistrationRole;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required.' },
        { status: 400 }
      );
    }

    if (!['broadcaster', 'follower'].includes(role)) {
      return NextResponse.json(
        { error: 'Registration role must be broadcaster or follower.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const existing = getForexPulseUserByEmail(email);

    if (existing) {
      return NextResponse.json(
        {
          error: 'An account with this email already exists.',
          user: {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            role: existing.role,
            status: existing.status,
          },
        },
        { status: 409 }
      );
    }

    const user = createForexPulseUser({
      name,
      email,
      role,
    });

    const registrationState = createRegistrationState({
      userId: user.id,
      role: user.role as RegistrationRole,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          forexPulseId: user.forexPulseId,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      { status: 201 }
    );

    response.cookies.set('forex_pulse_registration', registrationState, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Unable to complete registration.' },
      { status: 500 }
    );
  }
}
