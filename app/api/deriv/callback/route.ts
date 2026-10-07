import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSession } from '@/lib/session';
import { getDerivAccountInfo } from '@/lib/deriv/account';
import {
  activateForexPulseUser,
  getForexPulseUser,
  getFollowerAccountByAccountId,
  registerFollowerAccount,
} from '@/lib/db';
import {
  readRegistrationState,
  type RegistrationRole,
} from '@/lib/registration';

const CLIENT_ID =
  process.env.NEXT_PUBLIC_DERIV_APP_ID || '34y4evMto90zbbhkjKj2Rz';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://chambe-forex-pulse-v2.vercel.app';

const REDIRECT_URI =
  process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI ||
  `${APP_URL}/api/deriv/callback`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const returnedState = searchParams.get('state');
  const error = searchParams.get('error');

  const cookieStore = await cookies();

  const oauthCookie = cookieStore.get('deriv_oauth')?.value;
  const separator = oauthCookie?.indexOf('.') ?? -1;

  const savedState =
    separator >= 0 ? oauthCookie?.slice(0, separator) : undefined;

  const codeVerifier =
    separator >= 0 ? oauthCookie?.slice(separator + 1) : undefined;

  const registrationCookie =
    cookieStore.get('forex_pulse_registration')?.value;

  if (error) {
    return NextResponse.redirect(
      `${APP_URL}?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code received from Deriv' },
      { status: 400 }
    );
  }

  if (!returnedState || !savedState || returnedState !== savedState) {
    return NextResponse.json(
      { error: 'Invalid OAuth state' },
      { status: 400 }
    );
  }

  if (!codeVerifier) {
    return NextResponse.json(
      { error: 'Missing PKCE code verifier' },
      { status: 400 }
    );
  }

  try {
    const tokenResponse = await fetch(
      'https://auth.deriv.com/oauth2/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: CLIENT_ID,
          code,
          code_verifier: codeVerifier,
          redirect_uri: REDIRECT_URI,
        }).toString(),
        cache: 'no-store',
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Deriv token exchange failed:', tokenData);

      return NextResponse.redirect(
        `${APP_URL}?error=token_exchange_failed`
      );
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('Deriv returned no access token');

      return NextResponse.redirect(
        `${APP_URL}?error=no_access_token`
      );
    }

    /*
     * OAuth is successfully completed.
     * Retrieve the real Deriv account information.
     */
    const account = await getDerivAccountInfo(accessToken);

    /*
     * Owner is always determined independently from self-service
     * registration. A normal registration can never create an Owner.
     */
    const ownerAccountId =
      process.env.OWNER_DERIV_ACCOUNT_ID?.trim();

    const isOwner =
      Boolean(ownerAccountId) &&
      account.accountId === ownerAccountId;

    let role: RegistrationRole | 'owner' = 'follower';
    let registeredUserId: string | null = null;

    /*
     * If this OAuth flow started from registration, recover the
     * cryptographically signed registration identity and role.
     */
    if (registrationCookie) {
      const registrationState =
        readRegistrationState(registrationCookie);

      if (registrationState) {
        const registeredUser = await getForexPulseUser(
          registrationState.userId
        );

        if (
          registeredUser &&
          registeredUser.role === registrationState.role
        ) {
          registeredUserId = registeredUser.id;
          role = registeredUser.role;
        }
      }
    }

    /*
     * For an existing-account connection, recover the Forex Pulse
     * user from the already-linked Deriv account. Never use the
     * Deriv account ID itself as a Forex Pulse user ID.
     */
    if (!registeredUserId) {
      const existingAccount =
        await getFollowerAccountByAccountId(account.accountId);

      if (existingAccount) {
        registeredUserId = existingAccount.userId;
        role = existingAccount.role;
      }
    }

    /*
     * Owner identity is determined only by the configured Deriv
     * account ID. An Owner must already have a Forex Pulse profile.
     * Never use the Deriv account ID as the database user ID.
     */
    if (isOwner) {
      const existingOwnerAccount =
        await getFollowerAccountByAccountId(account.accountId);

      if (!existingOwnerAccount) {
        return NextResponse.redirect(
          `${APP_URL}?error=owner_profile_missing`
        );
      }

      const ownerUser = await getForexPulseUser(
        existingOwnerAccount.userId
      );

      if (!ownerUser || ownerUser.role !== 'owner') {
        return NextResponse.redirect(
          `${APP_URL}?error=owner_profile_missing`
        );
      }

      registeredUserId = ownerUser.id;
      role = 'owner';
    }

    /*
     * No registration and no existing account means this Deriv
     * account has not been onboarded into Forex Pulse yet.
     */
    if (!registeredUserId) {
      return NextResponse.redirect(
        `${APP_URL}?error=registration_required`
      );
    }

    /*
     * Activate self-service broadcaster/follower profiles.
     */
    if (role !== 'owner') {
      await activateForexPulseUser(registeredUserId, role);
    }

    /*
     * Register or refresh the connected Deriv account.
     * The access token is encrypted before storage and is never
     * returned to the browser.
     */
    await registerFollowerAccount({
      userId: registeredUserId,
      email: account.email,
      loginId: account.loginId,
      accountId: account.accountId,
      accessToken,
      refreshToken: tokenData.refresh_token,
      scopes: ['trade', 'application_read'],
      role,
    });

    const sessionId = await createSession({
      role,
      id: account.accountId,
      email: account.email,
      balance: account.balance,
      currency: account.currency,
      accountId: account.accountId,
      token: accessToken,
      loginId: account.loginId,
      refreshToken: tokenData.refresh_token,
    });

    const response = NextResponse.redirect(APP_URL);

    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    response.cookies.delete('deriv_oauth');
    response.cookies.delete('forex_pulse_registration');

    return response;
  } catch (err) {
    console.error('Deriv OAuth callback failed:', err);

    return NextResponse.redirect(
      `${APP_URL}?error=oauth_failed`
    );
  }
}
