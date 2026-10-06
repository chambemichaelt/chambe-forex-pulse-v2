'use client';

import { useEffect, useMemo, useState } from 'react';
import { UserPanel } from './user-panel';
import type { ConnectionMode } from '@/lib/types';

type TradeDirection = 'CALL' | 'PUT';

type Trade = {
  id: string;
  symbol: string;
  direction: TradeDirection;
  amount: number;
  price: number;
  commission: number;
  status: 'open' | 'closed';
  createdAt: string;
  broadcaster: string;
  followerCount: number;
};

type Summary = {
  totalVolume: number;
  totalCommission: number;
  openTrades: number;
  commissionRate: number;
};

type ForexPulseRole = 'owner' | 'broadcaster' | 'follower';

type CurrentUser = {
  id: string;
  role: ForexPulseRole;
  email: string;
  balance: number;
  currency: string;
  accountId: string;
  loginId: string;
};

const defaultForm = {
  symbol: 'EURUSD',
  direction: 'CALL' as TradeDirection,
  amount: 100,
};

export type { ConnectionMode };

export function TradeDashboard() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [mode, setMode] = useState<ConnectionMode>('independent');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalVolume: 0,
    totalCommission: 0,
    openTrades: 0,
    commissionRate: 0.03,
  });
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication and load the Forex Pulse role.
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/user');

        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user ?? null);
          setLoggedIn(Boolean(data.user));
        } else {
          setCurrentUser(null);
          setLoggedIn(false);
        }
      } catch {
        setCurrentUser(null);
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!loggedIn) return;

    const load = async () => {
      try {
        const res = await fetch('/api/trades');
        const data = await res.json();
        setTrades(data.trades ?? []);
      } catch {
        setTrades([]);
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;

    const loadSummary = async () => {
      try {
        const res = await fetch('/api/commission');
        const data = await res.json();
        setSummary({
          totalVolume: data.totalVolume ?? 0,
          totalCommission: data.totalCommission ?? 0,
          openTrades: data.openTrades ?? 0,
          commissionRate: data.commissionRate ?? 0.03,
        });
      } catch {
        setSummary({ totalVolume: 0, totalCommission: 0, openTrades: 0, commissionRate: 0.03 });
      }
    };

    loadSummary();
    const interval = setInterval(loadSummary, 5000);
    return () => clearInterval(interval);
  }, [loggedIn]);

  const canBroadcast =
    currentUser?.role === 'owner' ||
    currentUser?.role === 'broadcaster';

  const roleLabel =
    currentUser?.role === 'owner'
      ? 'Owner / Admin'
      : currentUser?.role === 'broadcaster'
        ? 'Broadcaster'
        : 'Follower';

  const statCards = useMemo(
    () => [
      { label: 'Open Trades', value: String(summary.openTrades), accent: '#60a5fa' },
      { label: 'Role', value: roleLabel, accent: '#34d399' },
      { label: 'Volume', value: `$${summary.totalVolume.toFixed(2)}`, accent: '#fbbf24' },
      { label: '3% Fee', value: `$${summary.totalCommission.toFixed(2)}`, accent: '#f87171' },
    ],
    [summary]
  );

  const handleCreateTrade = async () => {
    if (!canBroadcast) return;

    const payload = {
      symbol: form.symbol,
      direction: form.direction,
      amount: form.amount,
      price: form.direction === 'CALL' ? 1.09 : 1.08,
    };

    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.trade) {
        setTrades((current) => [data.trade, ...current]);
      }
    } catch {
      // no-op for prototype deployment
    }
  };

  if (loading) {
    return (
      <main className="page-shell">
        <div className="app-frame">
          <header className="topbar">
            <div>
              <div className="eyebrow">Copy Trader</div>
              <h1>Forex Pulse</h1>
            </div>
          </header>
          <div className="auth-card">
            <p>Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="app-frame">
        <header className="topbar">
          <div>
            <div className="eyebrow">Copy Trader</div>
            <h1>Forex Pulse</h1>
          </div>

          <div className="header-actions">
            <div className="badge pill-success">3% commission on close</div>
          </div>
        </header>

        {!loggedIn ? (
          <section className="glass-card auth-card">
            <h2>Welcome to the trading desk</h2>
            <p>Connect your Deriv account and start trading or follow the master signal feed.</p>
            <a href="/api/deriv/login" className="primary-button full button-link">
              Connect Deriv Account
            </a>
          </section>
        ) : (
          <>
            <section className="stats-grid">
              {statCards.map((card) => (
                <div key={card.label} className="glass-card stat-card" style={{ borderTop: `2px solid ${card.accent}` }}>
                  <div className="tiny-label">{card.label}</div>
                  <div className="stat-value">{card.value}</div>
                </div>
              ))}
            </section>

            <section className="mode-row glass-card">
              <div>
                <div className="mode-label">Forex Pulse role</div>
                <div className="feed-meta">{roleLabel}</div>
              </div>

              <div className="mode-switches">
                {(
                  canBroadcast
                    ? (['broadcast', 'read-only', 'independent'] as ConnectionMode[])
                    : (['read-only', 'independent'] as ConnectionMode[])
                ).map((item) => (
                  <button
                    key={item}
                    className={mode === item ? 'mode-button active' : 'mode-button'}
                    onClick={() => setMode(item)}
                  >
                    {item === 'broadcast'
                      ? 'Broadcast'
                      : item === 'read-only'
                        ? 'Read only'
                        : 'Independent'}
                  </button>
                ))}
              </div>
            </section>

            <section className="main-grid">
              <div className="glass-card panel">
                <div className="panel-header">
                  <h3>{canBroadcast ? 'Broadcast command centre' : 'Follower trading panel'}</h3>
                  <span className="live-pill">Live</span>
                </div>

                <div className="trade-form-grid">
                  <label>
                    <span>Symbol</span>
                    <select value={form.symbol} onChange={(event) => setForm({ ...form, symbol: event.target.value })}>
                      <option value="EURUSD">EURUSD</option>
                      <option value="USDJPY">USDJPY</option>
                      <option value="GBPUSD">GBPUSD</option>
                      <option value="XAUUSD">XAUUSD</option>
                    </select>
                  </label>

                  <label>
                    <span>Direction</span>
                    <select value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value as TradeDirection })}>
                      <option value="CALL">CALL</option>
                      <option value="PUT">PUT</option>
                    </select>
                  </label>

                  <label>
                    <span>Stake</span>
                    <input type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) || 0 })} />
                  </label>
                </div>

                {canBroadcast ? (
                  <button className="success-button full" onClick={handleCreateTrade}>
                    Broadcast Trade to Followers
                  </button>
                ) : (
                  <div className="feed-meta">
                    Broadcasting is available to authorised broadcaster accounts.
                  </div>
                )}

                <div className="feed-block">
                  <h4>Recent trade feed</h4>
                  <div className="feed-list">
                    {trades.slice(0, 6).map((trade) => (
                      <div key={trade.id} className="feed-item">
                        <div>
                          <div className="feed-symbol">{trade.symbol}</div>
                          <div className="feed-meta">{trade.direction} • {new Date(trade.createdAt).toLocaleTimeString()}</div>
                        </div>
                        <div className="feed-side">
                          <div>{trade.amount}</div>
                          <div className={trade.direction === 'CALL' ? 'gain' : 'loss'}>{trade.direction}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="side-stack">
                <UserPanel onLogout={() => setLoggedIn(false)} />

                {canBroadcast ? (
                  <div className="glass-card panel">
                    <div className="panel-header compact">
                      <h3>Follower accounts</h3>
                      <span className="tiny-label">Registry</span>
                    </div>

                    <div className="feed-meta">
                      Connected follower accounts will appear here once the
                      secure account registry is connected to the dashboard.
                    </div>
                  </div>
                ) : (
                  <div className="glass-card panel">
                    <div className="panel-header compact">
                      <h3>Copy status</h3>
                      <span className="tiny-label">Your account</span>
                    </div>

                    <div className="feed-meta">
                      Your Deriv account is connected. Copy controls and
                      account-specific risk settings will appear here.
                    </div>
                  </div>
                )}

                <div className="glass-card panel">
                  <h3>Commission rules</h3>
                  <ul className="rules-list">
                    <li>3% commission charged on closed positions</li>
                    <li>Applies to follower trade execution</li>
                    <li>Independent follower trades still tracked</li>
                    <li>Master trade feed broadcasts to all followers</li>
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}