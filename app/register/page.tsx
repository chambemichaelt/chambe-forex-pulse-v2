'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type RegistrationRole = 'broadcaster' | 'follower';

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<RegistrationRole>('follower');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [broadcasterForexPulseId, setBroadcasterForexPulseId] = useState('');
  const [message, setMessage] = useState('');
  const [forexPulseId, setForexPulseId] = useState('');
  const [registeredRole, setRegisteredRole] =
    useState<RegistrationRole | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPat, setShowPat] = useState(false);
  const [pat, setPat] = useState('');
  const [patSubmitting, setPatSubmitting] = useState(false);

  const handleContinue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage('');
    setForexPulseId('');
    setRegisteredRole(null);
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          role,
          broadcasterForexPulseId:
            role === 'follower' ? broadcasterForexPulseId : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Registration could not be completed.');
        return;
      }

      setForexPulseId(data.user.forexPulseId);
      setRegisteredRole(data.user.role);
      setMessage('Your Forex Pulse profile has been created.');
    } catch {
      setError('Unable to connect to Forex Pulse. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePatConnect = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError('');
    setPatSubmitting(true);

    try {
      const response = await fetch('/api/deriv/pat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pat }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to connect the Deriv account.');
        return;
      }

      setPat('');
      router.push('/');
    } catch {
      setError('Unable to connect to Forex Pulse. Please try again.');
    } finally {
      setPatSubmitting(false);
    }
  };

  if (forexPulseId && registeredRole) {
    return (
      <main className="page-shell">
        <div className="app-frame">
          <section className="glass-card auth-card">
            <div className="eyebrow">Chambe Forex Pulse</div>

            <h1>Profile Created</h1>

            <p>{message}</p>

            <div className="feed-meta">
              <strong>Forex Pulse ID</strong>

              <div
                style={{
                  fontSize: '1.7rem',
                  fontWeight: 700,
                  marginTop: '0.4rem',
                  letterSpacing: '0.04em',
                }}
              >
                {forexPulseId}
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                {registeredRole === 'broadcaster'
                  ? 'Broadcaster'
                  : 'Follower'}
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                className="primary-button full"
                onClick={() => router.push('/api/deriv/login')}
              >
                Connect with Deriv
              </button>
            </div>

            <div
              style={{
                textAlign: 'center',
                margin: '1rem 0',
                opacity: 0.7,
              }}
            >
              or
            </div>

            {!showPat ? (
              <button
                type="button"
                className="button-link secondary-link"
                onClick={() => {
                  setShowPat(true);
                  setError('');
                }}
              >
                Connect with Deriv API Token
              </button>
            ) : (
              <form
                onSubmit={handlePatConnect}
                className="registration-form"
              >
                <label>
                  <span>Deriv API Token</span>
                  <input
                    type="password"
                    value={pat}
                    onChange={(event) => setPat(event.target.value)}
                    placeholder="Paste your Deriv API token"
                    autoComplete="off"
                    required
                  />
                  <small>
                    Your token is sent securely to Forex Pulse for validation
                    and encrypted storage. It is never displayed back to you.
                  </small>
                </label>

                <button
                  type="submit"
                  className="primary-button full"
                  disabled={patSubmitting}
                >
                  {patSubmitting
                    ? 'Connecting...'
                    : 'Connect API Token'}
                </button>

                <button
                  type="button"
                  className="button-link secondary-link"
                  onClick={() => {
                    setShowPat(false);
                    setPat('');
                    setError('');
                  }}
                >
                  Use Deriv OAuth instead
                </button>
              </form>
            )}

            {error ? (
              <div className="feed-meta" style={{ marginTop: '1rem' }}>
                {error}
              </div>
            ) : null}

            <div className="feed-meta" style={{ marginTop: '1rem' }}>
              Your Deriv account remains your own account. Forex Pulse uses
              your connection to provide the services associated with your
              profile.
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="app-frame">
        <section className="glass-card auth-card">
          <div className="eyebrow">Chambe Forex Pulse</div>

          <h1>Create your Forex Pulse profile</h1>

          <p>
            Choose your role and create your Forex Pulse profile.
          </p>

          <div className="role-choice-grid">
            <button
              type="button"
              className={
                role === 'broadcaster'
                  ? 'role-card active'
                  : 'role-card'
              }
              onClick={() => setRole('broadcaster')}
            >
              <strong>Broadcaster</strong>
              <span>Broadcast your trading activity.</span>
            </button>

            <button
              type="button"
              className={
                role === 'follower' ? 'role-card active' : 'role-card'
              }
              onClick={() => setRole('follower')}
            >
              <strong>Follower</strong>
              <span>
                Follow a broadcaster using your own Deriv account.
              </span>
            </button>
          </div>

          <form onSubmit={handleContinue} className="registration-form">
            <label>
              <span>Full name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your full name"
                required
              />
            </label>

            <label>
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            {role === 'follower' ? (
              <label>
                <span>Broadcaster Forex Pulse ID</span>
                <input
                  value={broadcasterForexPulseId}
                  onChange={(event) =>
                    setBroadcasterForexPulseId(
                      event.target.value.toUpperCase()
                    )
                  }
                  placeholder="Example: FP-123456"
                  required
                />
                <small>
                  Enter the Forex Pulse ID of the broadcaster you want to
                  follow.
                </small>
              </label>
            ) : null}

            <button
              type="submit"
              className="primary-button full"
              disabled={submitting}
            >
              {submitting
                ? 'Creating profile...'
                : `Create ${
                    role === 'broadcaster'
                      ? 'Broadcaster'
                      : 'Follower'
                  } Profile`}
            </button>

            {error ? (
              <div className="feed-meta">
                {error}
              </div>
            ) : null}
          </form>

          <button
            type="button"
            className="button-link secondary-link"
            onClick={() => router.push('/')}
          >
            Back to Forex Pulse
          </button>
        </section>
      </div>
    </main>
  );
}
