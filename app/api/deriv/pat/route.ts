import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSession } from '@/lib/session';
import {
  activateForexPulseUser,
  getForexPulseUser,
  registerFollowerAccount,
} from '@/lib/db';
import {
  readRegistrationState,
} from '@/lib/registration';
import { getPatAccountInfo } from '@/lib/deriv/pat';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const registrationCookie =
      cookieStore.get('forex_pulse_registration')?.value;

    if (!registrationCookie) {
      return NextResponse.json(
        { error: 'Registration session expired. Please start again.' },
        { status: 401 }
      );
    }

    const registrationState =
      readRegistrationState(registrationCookie);

    if (!registrationState) {
      return NextResponse.json(
        { error: 'Invalid or expired registration session.' },
        { status: 401 }
      );
    }

    const user = await getForexPulseUser(
      registrationState.userId
    );

    if (!user || user.role !== registrationState.role) {
      return NextResponse.json(
        { error: 'Forex Pulse profile could not be found.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const pat =
      typeof body.pat === 'string' ? body.pat.trim() : '';

    if (!pat) {
      return NextResponse.json(
        { error: 'Deriv API token is required.' },
        { status: 400 }
      );
    }

    const account = await getPatAccountInfo(pat);

    await activateForexPulseUser(
      user.id,
      user.role
    );

    await registerFollowerAccount({
      userId: user.id,
      email: user.email,
      loginId: account.loginId,
      accountId: account.accountId,
      accessToken: pat,
      scopes: ['trade'],
      role: user.role,
      connectionType: 'pat',
    });

    const sessionId = await createSession({
      role: user.role,
      id: user.id,
      email: user.email,
      balance: account.balance,
      currency: account.currency,
      accountId: account.accountId,
      token: pat,
      loginId: account.loginId,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        forexPulseId: user.forexPulseId,
        role: user.role,
        accountId: account.accountId,
        balance: account.balance,
        currency: account.currency,
        connectionType: 'pat',
      },
    });

    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    response.cookies.delete('forex_pulse_registration');

    return response;
  } catch (error) {
    console.error('Deriv PAT connection failed:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to connect the Deriv account.',
      },
      { status: 500 }
    );
  }
}
