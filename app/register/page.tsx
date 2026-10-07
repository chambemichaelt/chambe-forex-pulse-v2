'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type RegistrationRole = 'broadcaster' | 'follower';

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<RegistrationRole>('follower');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [forexPulseId, setForexPulseId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage('');
    setForexPulseId('');
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Registration could not be completed.');
        return;
      }

      setForexPulseId(data.user.forexPulseId);
      setMessage(
        `Registration created. Your Forex Pulse profile is pending activation as a ${role}.`
      );
    } catch {
      setError('Unable to connect to Forex Pulse. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="app-frame">
        <section className="glass-card auth-card">
          <div className="eyebrow">Chambe Forex Pulse</div>

          <h1>Create your Forex Pulse profile</h1>

          <p>
            Choose how you want to participate in the Forex Pulse network.
            You can connect your Deriv account after registration.
          </p>

          <div className="role-choice-grid">
            <button
              type="button"
              className={role === 'broadcaster' ? 'role-card active' : 'role-card'}
              onClick={() => setRole('broadcaster')}
            >
              <strong>Register as Broadcaster</strong>
              <span>
                Build your own trading feed and broadcast signals to your
                followers.
              </span>
            </button>

            <button
              type="button"
              className={role === 'follower' ? 'role-card active' : 'role-card'}
              onClick={() => setRole('follower')}
            >
              <strong>Register as Follower</strong>
              <span>
                Follow a broadcaster and manage your own Deriv trading
                account.
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

            <button
              type="submit"
              className="primary-button full"
              disabled={submitting}
            >
              {submitting
                ? 'Creating profile...'
                : `Continue as ${role === 'broadcaster' ? 'Broadcaster' : 'Follower'}`}
            </button>

            {message ? <div className="feed-meta">{message}</div> : null}

            {forexPulseId ? (
              <div className="feed-meta">
                <strong>Your Forex Pulse ID</strong>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.35rem' }}>
                  {forexPulseId}
                </div>
                <div style={{ marginTop: '0.35rem' }}>
                  Keep this ID safe. It identifies your Forex Pulse profile.
                </div>
              </div>
            ) : null}

            {error ? <div className="feed-meta">{error}</div> : null}
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
