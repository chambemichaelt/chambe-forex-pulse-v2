'use client';

import { useEffect, useMemo, useState } from 'react';

export type ConnectionMode = 'broadcast' | 'read-only' | 'independent';

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

const followers = [
  { name: 'Ava', account: 'CR123', balance: 12000 },
  { name: 'Leo', account: 'CR456', balance: 9000 },
  { name: 'Mina', account: 'CR789', balance: 15000 },
  { name: 'Ike', account: 'CR901', balance: 11000 },
];

const defaultForm = {
  symbol: 'EURUSD',
  direction: 'CALL' as TradeDirection,
  amount: 100,
};

export function TradeDashboard() {
  const [loggedIn, setLoggedIn] = useState(true);
  const [mode, setMode] = useState<ConnectionMode>('broadcast');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalVolume: 0,
    totalCommission: 0,
    openTrades: 0,
    commissionRate: 0.03,
  });
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
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
  }, []);

  const statCards = useMemo(
    () => [
      { label: 'Open Trades', value: String(summary.openTrades), accent: '#60a5fa' },
      { label: 'Followers', value: String(followers.length), accent: '#34d399' },
      { label: 'Volume', value: `$${summary.totalVolume.toFixed(2)}`, accent: '#fbbf24' },
      { label: '3% Fee', value: `$${summary.totalCommission.toFixed(2)}`, accent: '#f87171' },
    ],
    [summary]
  );

  const handleCreateTrade = async () => {
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
            <button className="primary-button" onClick={() => setLoggedIn((current) => !current)}>
              {loggedIn ? 'Log out' : 'Log in'}
            </button>
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
              <div className="mode-label">Connection mode</div>
              <div className="mode-switches">
                {(['broadcast', 'read-only', 'independent'] as ConnectionMode[]).map((item) => (
                  <button
                    key={item}
                    className={mode === item ? 'mode-button active' : 'mode-button'}
                    onClick={() => setMode(item)}
                  >
                    {item === 'broadcast' ? 'Broadcast' : item === 'read-only' ? 'Read only' : 'Independent'}
                  </button>
                ))}
              </div>
            </section>

            <section className="main-grid">
              <div className="glass-card panel">
                <div className="panel-header">
                  <h3>Master trade panel</h3>
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

                <button className="success-button full" onClick={handleCreateTrade}>Broadcast Trade to Followers</button>

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
                <div className="glass-card panel">
                  <div className="panel-header compact">
                    <h3>Follower accounts</h3>
                    <span className="tiny-label">{followers.length} linked</span>
                  </div>

                  <div className="follower-list">
                    {followers.map((follower) => (
                      <div key={follower.account} className="follower-item">
                        <div>
                          <div className="follower-name">{follower.name}</div>
                          <div className="feed-meta">{follower.account}</div>
                        </div>
                        <div className="follower-balance">$ {follower.balance.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>

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
