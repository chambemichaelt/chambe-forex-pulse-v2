export const DERIV_APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID ?? '34yYmvMto9OabbxhKj2Rz';
export const DERIV_REDIRECT_URI =
  process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI ?? 'https://chambe-forex-pulse-v2.vercel.app';

export function buildDerivAuthUrl() {
  const params = new URLSearchParams({
    app_id: DERIV_APP_ID,
    redirect_uri: DERIV_REDIRECT_URI,
    brand: 'deriv',
    scope: 'read,trade',
    state: `${Date.now()}`,
  });

  return `https://oauth.deriv.com/oauth2/authorize?${params.toString()}`;
}
