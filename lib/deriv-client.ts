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
  account_id: string;
  account_type: string;
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
  private readonly maxRequests = 60; // 60 requests per minute
  private readonly windowMs = 60 * 1000; // 1 minute

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
  private appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
  private rateLimiter = new RateLimiter();

  /**
   * Exchange OAuth code for access token
   */
  async exchangeCodeForToken(code: string): Promise<DerivOAuthResponse> {
    if (!this.rateLimiter.canMakeRequest()) {
      throw new Error(`Rate limit exceeded. Wait ${this.rateLimiter.getRemainingWaitTime()}ms`);
    }

    try {
      const response = await fetch(`${this.apiUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          app_id: this.appId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OAuth error: ${error.error_description || error.error}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to exchange code for token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh OAuth token
   */
  async refreshToken(refreshToken: string): Promise<DerivOAuthResponse> {
    if (!this.rateLimiter.canMakeRequest()) {
      throw new Error(`Rate limit exceeded. Wait ${this.rateLimiter.getRemainingWaitTime()}ms`);
    }

    try {
      const response = await fetch(`${this.apiUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          app_id: this.appId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch real account data from Deriv
   */
  async getAccountInfo(accessToken: string): Promise<DerivAccount> {
    if (!this.rateLimiter.canMakeRequest()) {
      throw new Error(`Rate limit exceeded. Wait ${this.rateLimiter.getRemainingWaitTime()}ms`);
    }

    try {
      const response = await fetch(`${this.apiUrl}/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorize: 1,
          req_id: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account info');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Account info error: ${data.error.message}`);
      }

      return {
        id: data.authorize.account_id,
        email: data.authorize.email,
        balance: data.authorize.balance,
        currency: data.authorize.currency,
        loginId: data.authorize.loginid,
      };
    } catch (error) {
      throw new Error(`Failed to get account info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a trade on broadcaster's account
   */
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
          price: 100, // 100 is minimum
          ...trade,
          req_id: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute trade');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Trade execution error: ${data.error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Trade execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Close an open contract
   */
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
          price: 0, // 0 = market price
          req_id: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to close contract');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Close contract error: ${data.error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to close contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get contract details
   */
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

      if (!response.ok) {
        throw new Error('Failed to get contract details');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Contract details error: ${data.error.message}`);
      }

      return data.contract_details;
    } catch (error) {
      throw new Error(`Failed to get contract details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const derivClient = new DerivClient();
