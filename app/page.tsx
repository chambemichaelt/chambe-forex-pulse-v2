'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="page-shell">
      <div className="app-frame">
        <section className="glass-card auth-card">
          <div className="eyebrow">Chambe Forex Pulse</div>

          <h1>Trade. Broadcast. Follow.</h1>

          <p>
            Forex Pulse is a trading network that connects broadcasters and
            followers while each participant manages their own Deriv account.
          </p>

          <div className="role-choice-grid">
            <div className="role-card active">
              <strong>Broadcaster</strong>
              <span>
                Build your trading following and broadcast your trading
                activity through Forex Pulse.
              </span>
            </div>

            <div className="role-card">
              <strong>Follower</strong>
              <span>
                Choose a broadcaster and follow their trading activity using
                your own Deriv account.
              </span>
            </div>
          </div>

          <div className="registration-form">
            <button
              type="button"
              className="primary-button full"
              onClick={() => router.push('/register')}
            >
              Create Forex Pulse Profile
            </button>

            <button
              type="button"
              className="button-link secondary-link"
              onClick={() => router.push('/api/deriv/login')}
            >
              Connect Existing Deriv Account
            </button>
          </div>

          <div className="feed-meta">
            <strong>How it works</strong>
            <div style={{ marginTop: '0.5rem' }}>
              1. Create your Forex Pulse profile.
              <br />
              2. Receive your unique Forex Pulse ID.
              <br />
              3. Connect your own Deriv account.
              <br />
              4. Participate as a Broadcaster or Follower.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
