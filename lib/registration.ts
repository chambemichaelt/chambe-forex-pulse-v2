import crypto from 'crypto';

export type RegistrationRole = 'broadcaster' | 'follower';

const REGISTRATION_STATE_TTL = 10 * 60 * 1000;

function getSecret(): string {
  return (
    process.env.DERIV_TOKEN_SECRET ||
    'forex-pulse-dev-registration-secret'
  );
}

function sign(value: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(value)
    .digest('base64url');
}

export function createRegistrationState(input: {
  userId: string;
  role: RegistrationRole;
}): string {
  const expiresAt = Date.now() + REGISTRATION_STATE_TTL;

  const payload = JSON.stringify({
    userId: input.userId,
    role: input.role,
    expiresAt,
  });

  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function readRegistrationState(
  value: string
): {
  userId: string;
  role: RegistrationRole;
} | null {
  const separator = value.indexOf('.');

  if (separator < 0) {
    return null;
  }

  const encodedPayload = value.slice(0, separator);
  const providedSignature = value.slice(separator + 1);
  const expectedSignature = sign(encodedPayload);

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    );

    if (
      typeof payload.userId !== 'string' ||
      !['broadcaster', 'follower'].includes(payload.role) ||
      typeof payload.expiresAt !== 'number' ||
      Date.now() > payload.expiresAt
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role as RegistrationRole,
    };
  } catch {
    return null;
  }
}
