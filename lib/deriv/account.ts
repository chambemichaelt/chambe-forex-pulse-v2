const DERIV_API_URL = 'https://api.derivws.com';

export interface DerivAccountInfo {
  accountId: string;
  loginId: string;
  balance: number;
  currency: string;
  email: string;
}

interface DerivAccount {
  account_id: string;
  balance: number;
  currency: string;
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

interface DerivOtpResponse {
  data?: {
    url?: string;
  };
  errors?: Array<{
    code?: string;
    message?: string;
  }>;
}

interface DerivBalanceResponse {
  balance?: {
    balance?: number;
    currency?: string;
  };
  error?: {
    message?: string;
  };
}

async function getAccounts(
  accessToken: string
): Promise<DerivAccount[]> {
  const response = await fetch(
    `${DERIV_API_URL}/trading/v1/options/accounts`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    }
  );

  const data = (await response.json()) as DerivAccountsResponse;

  if (!response.ok) {
    throw new Error(
      data.errors?.[0]?.message ||
        'Failed to retrieve Deriv accounts'
    );
  }

  return data.data || [];
}

async function getWebSocketUrl(
  accessToken: string,
  accountId: string
): Promise<string> {
  const response = await fetch(
    `${DERIV_API_URL}/trading/v1/options/accounts/${encodeURIComponent(accountId)}/otp`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    }
  );

  const data = (await response.json()) as DerivOtpResponse;

  if (!response.ok || !data.data?.url) {
    throw new Error(
      data.errors?.[0]?.message ||
        'Failed to obtain Deriv WebSocket URL'
    );
  }

  return data.data.url;
}

function requestWebSocket<T>(
  websocketUrl: string,
  request: Record<string, unknown>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const WebSocketImpl = globalThis.WebSocket;

    if (!WebSocketImpl) {
      reject(
        new Error('WebSocket is not available in this runtime')
      );
      return;
    }

    const socket = new WebSocketImpl(websocketUrl);

    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error('Deriv WebSocket request timed out'));
    }, 15_000);

    socket.onopen = () => {
      socket.send(JSON.stringify(request));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as T & {
          error?: {
            message?: string;
          };
        };

        clearTimeout(timeout);
        socket.close();

        if (data.error) {
          reject(
            new Error(
              data.error.message || 'Deriv API error'
            )
          );
          return;
        }

        resolve(data);
      } catch {
        clearTimeout(timeout);
        socket.close();
        reject(
          new Error('Invalid response received from Deriv')
        );
      }
    };

    socket.onerror = () => {
      clearTimeout(timeout);
      socket.close();
      reject(
        new Error('Deriv WebSocket connection failed')
      );
    };
  });
}

export async function getDerivAccountInfo(
  accessToken: string
): Promise<DerivAccountInfo> {
  if (!accessToken) {
    throw new Error('Deriv access token is required');
  }

  /*
   * Get all Options accounts belonging to this OAuth user.
   */
  const accounts = await getAccounts(accessToken);

  if (accounts.length === 0) {
    throw new Error('No Deriv Options account was found');
  }

  /*
   * Use the first active account for the initial connection.
   */
  const account =
    accounts.find((item) => item.status === 'active') ||
    accounts[0];

  const websocketUrl = await getWebSocketUrl(
    accessToken,
    account.account_id
  );

  /*
   * Request the live balance through the authenticated
   * WebSocket connection.
   */
  const balance = await requestWebSocket<DerivBalanceResponse>(
    websocketUrl,
    {
      balance: 1,
    }
  );

  return {
    accountId: account.account_id,
    loginId: account.loginid || '',
    balance: Number(
      balance.balance?.balance ?? account.balance ?? 0
    ),
    currency:
      balance.balance?.currency ||
      account.currency ||
      'USD',
    email: '',
  };
}
