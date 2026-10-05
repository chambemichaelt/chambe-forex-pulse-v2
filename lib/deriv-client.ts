/**
 * Real Deriv API Client
 * Handles OAuth token exchange, account data fetching, and trade execution
 * Production-ready with error handling, rate limiting, and token refresh
 */

export interface DerivAccount {
  id: string;
  email: string;
  balance: number;
  currency: string;
  loginId: string;
}

export interface DerivOAuthResponse {
  access_token: string;
  refresh_token?: string;
  account_id?: string;
  account_type?: string;
  scope?: string;
}

export interface TradeRequest {
  amount: number;
  barrier1?: string;
  basis?: string;
  contract_type: 'CALL' | 'PUT';
  currency?: string;
  duration: number;
  duration_unit: 'h' | 'm' | 's';
  symbol: string;
}

export interface TradeResponse {
  buy: {
    contract_id: number;
    payout: number;
    start_time: number;
  };
  echo_req: Record<string, unknown>;
  msg_type: string;
  req_id: number;
}

class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 60;
  private readonly windowMs = 60 * 1000;

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  getRemainingWaitTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = this.requests[0];
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}

class DerivClient {
  private apiUrl = 'https://api.deriv.com/api/v3';
  private oauthUrl = 'https://oauth.deriv.com/oauth2/token';
  private appId = process.env.NEXT_PUBLIC_DERIV_APP_ID ?? '34yYmvMto9OabbxhKj2Rz';
  private redirectUri = process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI ?? 'https://chambe-forex-pulse-v2.vercel.app';
  private rateLimiter = new RateLimiter();

  private getRedirectUri() {
    return `${this.redirectUri.replace(/\/$/, '')}/api/deriv/callback`;
  }

  async exchangeCodeForToken(code: string): Promise<DerivOAuthResponse> {
    if (!this.rateLimiter.canMakeRequest()) {
      throw new Error(`Rate limit exceeded. Wait ${this.rateLimiter.getRemainingWaitTime()}ms`);
    }

    try {
      const response = await fetch(this.oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          app_id: this.appId,
          redirect_uri: this.getRedirectUri(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error_description || data.error || 'Failed to exchange auth code');
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to exchange code for token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<DerivOAuthResponse> {
    if (!this.rateLimiter.canMakeRequest()) {
      throw new Error(`Rate limit exceeded. Wait ${this.rateLimiter.getRemainingWaitTime()}ms`);
    }

    try {
      const response = await fetch(this.oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          app_id: this.appId,
          redirect_uri: this.getRedirectUri(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error_description || data.error || 'Failed to refresh token');
      }

      return data;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAccountInfo(accessToken: string): Promise<DerivAccount> {
    if (!this.rateLimiter.canMakeRequest()) {
      throw new Error(`Rate limit exceeded. Wait ${this.rateLimiter.getRemainingWaitTime()}ms`);
    }

    try {
      const response = await fetch(`${this.apiUrl}/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          authorize: 1,
          req_id: Date.now(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to fetch account info');
      }

      const account = data.authorize;
      if (!account) {
        throw new Error('No account details returned by Deriv');
      }

      return {
        id: String(account.account_id || account.loginid || 'unknown'),
        email: String(account.email || 'unknown@deriv.com'),
        balance: Number(account.balance || 0),
        currency: String(account.currency || 'USD'),
        loginId: String(account.loginid || 'unknown'),
      };
    } catch (error) {
      throw new Error(`Failed to get account info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeTrade(accessToken: string, trade: TradeRequest): Promise<TradeResponse> {
    if (!this.rateLimiter.canMakeRequest()) {
      throw new Error(`Rate limit exceeded. Wait ${this.rateLimiter.getRemainingWaitTime()}ms`);
    }

    try {
      const response = await fetch(`${this.apiUrl}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          buy: 1,
          ...trade,
          req_id: Date.now(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Trade execution failed');
      }

      return data;
    } catch (error) {
      throw new Error(`Trade execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async closeContract(accessToken: string, contractId: number): Promise<{ sell: Record<string, unknown> }> {
    if (!this.rateLimiter.canMakeRequest()) {
      throw new Error(`Rate limit exceeded. Wait ${this.rateLimiter.getRemainingWaitTime()}ms`);
    }

    try {
      const response = await fetch(`${this.apiUrl}/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          sell: contractId,
          req_id: Date.now(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to close contract');
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to close contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getContractDetails(accessToken: string, contractId: number): Promise<Record<string, unknown>> {
    if (!this.rateLimiter.canMakeRequest()) {
      throw new Error(`Rate limit exceeded. Wait ${this.rateLimiter.getRemainingWaitTime()}ms`);
    }

    try {
      const response = await fetch(`${this.apiUrl}/contract_details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          contract_details: contractId,
          req_id: Date.now(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to get contract details');
      }

      return data.contract_details || {};
    } catch (error) {
      throw new Error(`Failed to get contract details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const derivClient = new DerivClient();
