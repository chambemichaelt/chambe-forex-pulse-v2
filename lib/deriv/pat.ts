const DERIV_API_URL = 'https://api.derivws.com';

function getPatAppId(): string {
  const appId = process.env.DERIV_PAT_APP_ID?.trim();

  if (!appId) {
    throw new Error('DERIV_PAT_APP_ID is not configured');
  }

  return appId;
}

interface DerivAccount {
  account_id: string;
  balance?: number;
  currency?: string;
  account_type?: string;
  status?: string;
  loginid?: string;
}

interface DerivAccountsResponse {
  data?: DerivAccount[];
  errors?: Array<{
    code?: string;
    message?: string;
  }>;
}

export interface PatAccountInfo {
  accountId: string;
  loginId: string;
  balance: number;
  currency: string;
}

export async function getPatAccountInfo(
  accessToken: string
): Promise<PatAccountInfo> {
  const token = accessToken.trim();

  if (!token) {
    throw new Error('Deriv API token is required');
  }

  const response = await fetch(
    `${DERIV_API_URL}/trading/v1/options/accounts`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Deriv-App-ID': getPatAppId(),
      },
      cache: 'no-store',
    }
  );

  const data = (await response.json()) as DerivAccountsResponse;

  if (!response.ok) {
    const message =
      data.errors?.[0]?.message ||
      'The Deriv API token could not be validated';

    throw new Error(message);
  }

  const accounts = data.data ?? [];

  if (accounts.length === 0) {
    throw new Error('No Deriv Options account was found for this token');
  }

  const account =
    accounts.find((item) => item.status === 'active') ||
    accounts[0];

  return {
    accountId: account.account_id,
    loginId: account.loginid || '',
    balance: Number(account.balance ?? 0),
    currency: account.currency || 'USD',
  };
}
