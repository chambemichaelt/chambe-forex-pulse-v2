'use client';

import { useEffect, useState } from 'react';
import type { DerivUser } from '@/lib/types';

interface UserPanelProps {
  onLogout?: () => void;
}

export function UserPanel({ onLogout }: UserPanelProps) {
  const [user, setUser] = useState<DerivUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/user');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setError('Failed to load user info');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      onLogout?.();
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="user-panel-skeleton">
        <div className="user-skeleton-placeholder">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="user-panel glass-card">
      <div className="user-header">
        <div className="user-avatar">{user.email?.charAt(0).toUpperCase() || 'U'}</div>
        <div className="user-info">
          <div className="user-email">{user.email}</div>
          <div className="user-account">{user.accountId || 'Account'}</div>
        </div>
      </div>

      <div className="user-stats">
        <div className="user-stat">
          <span className="stat-label">Balance</span>
          <span className="stat-value">
            {user.currency} {user.balance.toFixed(2)}
          </span>
        </div>
        <div className="user-stat">
          <span className="stat-label">Currency</span>
          <span className="stat-value">{user.currency}</span>
        </div>
      </div>

      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>

      {error && <div className="user-error">{error}</div>}
    </div>
  );
}