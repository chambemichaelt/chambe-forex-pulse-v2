'use client';

import { useEffect, useMemo, useState } from 'react';

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

export function TraderDashboard() {
  const [loggedIn, setLoggedIn] = useState(true);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [summary, setSummary] = useState({ totalVolume: 0, totalCommission: 0, openTrades: 0, commissionRate: 0.03 });
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/trades');
      const data = await res.json();
      setTrades(data.trades ?? []);
    };

    load();

    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      const res = await fetch('/api/commission');
      const data = await res.json();
      setSummary({
        totalVolume: data.totalVolume ?? 0,
        totalCommission: data.totalCommission ?? 0,
        openTrades: data.openTrades ?? 0,
        commissionRate: data.commissionRate ?? 0.03,
      });
    };

    loadSummary();
    const interval = setInterval(loadSummary, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalFollowers = followers.length;

  const statCards = useMemo(
    () => [
      { label: 'Open Trades', value: String(summary.openTrades) },
      { label: 'Followers', value: String(totalFollowers) },
      { label: 'Volume', value: `$${summary.totalVolume.toFixed(2)}` },
      { label: '3% Fee', value: `$${summary.totalCommission.toFixed(2)}` },
    ],
    [summary, totalFollowers]
  );

  const handleCreateTrade = async () => {
    const payload = {
      symbol: form.symbol,
      direction: form.direction,
      amount: form.amount,
      price: form.direction === 'CALL' ? 1.09 : 1.08,
    };

    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.trade) {
      setTrades((current) => [data.trade, ...current]);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#e2e8f0', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 1.5 }}>Copy Trader</div>
            <h1 style={{ margin: 0, fontSize: 34 }}>Forex Pulse</h1>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ border: '1px solid rgba(148,163,184,0.2)', background: '#111827', borderRadius: 999, padding: '8px 16px' }}>
              3% commission on close
            </div>
            <button
              onClick={() => setLoggedIn((current) => !current)}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 18px', cursor: 'pointer' }}
            >
              {loggedIn ? 'Log out' : 'Log in'}
            </button>
          </div>
        </header>

        {!loggedIn ? (
          <section style={{ maxWidth: 460, margin: '80px auto', background: '#111827', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 18, padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Welcome to the trading desk</h2>
            <p style={{ color: '#94a3b8', marginBottom: 24 }}>Connect your Deriv account and start trading or copy the master signal feed.</p>
            <button
              onClick={() => setLoggedIn(true)}
              style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', fontWeight: 700 }}
            >
              Connect Deriv Account
            </button>
          </section>
        ) : (
          <>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
              {statCards.map((card) => (
                <div key={card.label} style={{ background: '#111827', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{card.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700 }}>{card.value}</div>
                </div>
              ))}
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
              <div style={{ background: '#111827', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 18, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                  <h3 style={{ margin: 0 }}>Master trade panel</h3>
                  <span style={{ color: '#22c55e' }}>Live</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 18 }}>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>Symbol</span>
                    <select
                      value={form.symbol}
                      onChange={(event) => setForm({ ...form, symbol: event.target.value })}
                      style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, padding: '10px 12px' }}
                    >
                      <option value="EURUSD">EURUSD</option>
                      <option value="USDJPY">USDJPY</option>
                      <option value="GBPUSD">GBPUSD</option>
                      <option value="XAUUSD">XAUUSD</option>
                    </select>
                  </label>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>Direction</span>
                    <select
                      value={form.direction}
                      onChange={(event) => setForm({ ...form, direction: event.target.value as TradeDirection })}
                      style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, padding: '10px 12px' }}
                    >
                      <option value="CALL">CALL</option>
                      <option value="PUT">PUT</option>
                    </select>
                  </label>

                  <label style={{ display: 'grid', gap: 8 }}>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>Stake</span>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(event) => setForm({ ...form, amount: Number(event.target.value) || 0 })}
                      style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 10, padding: '10px 12px' }}
                    />
                  </label>
                </div>

                <button
                  onClick={handleCreateTrade}
                  style={{ width: '100%', background: '#22c55e', color: '#03140b', border: 'none', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', fontWeight: 700 }}
                >
                  Broadcast Trade to Followers
                </button>

                <div style={{ marginTop: 24 }}>
                  <h4 style={{ margin: '0 0 12px' }}>Recent trade feed</h4>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {trades.slice(0, 6).map((trade) => (
                      <div key={trade.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#0f172a', borderRadius: 12, border: '1px solid rgba(148,163,184,0.2)' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{trade.symbol}</div>
                          <div style={{ color: '#94a3b8', fontSize: 12 }}>{trade.direction} • {new Date(trade.createdAt).toLocaleTimeString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div>{trade.amount}</div>
                          <div style={{ color: trade.direction === 'CALL' ? '#22c55e' : '#ef4444', fontSize: 12 }}>{trade.direction}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 20 }}>
                <div style={{ background: '#111827', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 18, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0 }}>Follower accounts</h3>
                    <span style={{ color: '#94a3b8' }}>{followers.length} linked</span>
                  </div>

                  <div style={{ display: 'grid', gap: 12 }}>
                    {followers.map((follower) => (
                      <div key={follower.account} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(148,163,184,0.2)' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{follower.name}</div>
                          <div style={{ color: '#94a3b8', fontSize: 12 }}>{follower.account}</div>
                        </div>
                        <div style={{ color: '#22c55e', fontWeight: 700 }}>$ {follower.balance.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#111827', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 18, padding: 20 }}>
                  <h3 style={{ marginTop: 0 }}>Commission rules</h3>
                  <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5e1', lineHeight: 1.8 }}>
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
