'use client';

import { useState } from 'react';
import { login, authUserToUser, ROLE_KEY_INDEX, AuthUser } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { ROLES } from '@/lib/mockData';
import type { User } from '@/lib/types';

interface LoginPageProps {
  onLogin: (roleIndex: number, user: User) => void;
}

// ─── Mock fallback credentials (for offline / dev use) ───────────────────────
const MOCK_CREDENTIALS: Record<string, { roleIndex: number; user: AuthUser }> = {
  'admin@corp.id':  { roleIndex: 0, user: { id: 1, email: 'admin@corp.id',  name: 'Ahmad Reza',   role: 'ADMIN', initials: 'AD', title: 'System Administrator' } },
  'farhan@corp.id': { roleIndex: 1, user: { id: 2, email: 'farhan@corp.id', name: 'Farhan Haq',   role: 'TL',    initials: 'TL', title: 'Technical Lead'       } },
  'sari@corp.id':   { roleIndex: 2, user: { id: 3, email: 'sari@corp.id',   name: 'Sari Dewi',    role: 'CISO',  initials: 'CS', title: 'CISO'                  } },
  'budi@corp.id':   { roleIndex: 3, user: { id: 4, email: 'budi@corp.id',   name: 'Budi Santoso', role: 'IGA',   initials: 'IG', title: 'IGA Team'              } },
};

const MOCK_PASSWORD = 'password123';

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode]       = useState<'form' | 'roleSelect'>('form');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // ── Real API login ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const authUser = await login({ email, password });
      const user     = authUserToUser(authUser);
      onLogin(ROLE_KEY_INDEX[user.role], user);
    } catch (err) {
      // ── Mock fallback (network unreachable or dev mode) ──────────────────
      if (err instanceof TypeError) {
        // Network error — try mock credentials
        const mock = MOCK_CREDENTIALS[email.toLowerCase()];
        if (mock && password === MOCK_PASSWORD) {
          const user = authUserToUser(mock.user);
          onLogin(mock.roleIndex, user);
          return;
        }
        setError('Cannot reach server. Use a demo account below, or check the backend.');
      } else if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          setError('Invalid email or password.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Role-select shortcut (dev / demo mode) ─────────────────────────────────
  const handleRolePick = (i: number) => {
    const mockEntry = Object.values(MOCK_CREDENTIALS)[i];
    const user      = authUserToUser(mockEntry.user);
    onLogin(i, user);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Brand */}
        <div className="logo" style={{ borderBottom: 'none', padding: 0, marginBottom: 36, textAlign: 'center' }}>
          <div className="logo-mark" style={{ fontSize: 26 }}>license·os</div>
          <div className="logo-sub" style={{ fontSize: 11, marginTop: 6 }}>AI License Manager</div>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 4 }}>
          <button
            onClick={() => { setMode('form'); setError(null); }}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display)',
              background: mode === 'form' ? 'rgba(212,245,74,0.15)' : 'transparent',
              color: mode === 'form' ? 'var(--accent)' : 'var(--muted)',
              transition: 'all 0.2s',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('roleSelect'); setError(null); }}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-display)',
              background: mode === 'roleSelect' ? 'rgba(212,245,74,0.15)' : 'transparent',
              color: mode === 'roleSelect' ? 'var(--accent)' : 'var(--muted)',
              transition: 'all 0.2s',
            }}
          >
            Demo Mode
          </button>
        </div>

        {/* ── Email / Password Form ─────────────────────────────────────── */}
        {mode === 'form' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                placeholder="admin@corp.id"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, fontSize: 13,
                background: 'rgba(255,72,72,0.1)', border: '1px solid rgba(255,72,72,0.25)',
                color: 'var(--danger)',
              }}>
                {error}
              </div>
            )}

            <button
              id="login-submit"
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: 4, justifyContent: 'center', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>

            {/* Hint */}
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              Demo: <code style={{ color: 'var(--accent)' }}>admin@corp.id</code> / <code style={{ color: 'var(--accent)' }}>password123</code>
            </p>
          </form>
        )}

        {/* ── Role Select (Demo Mode) ──────────────────────────────────── */}
        {mode === 'roleSelect' && (
          <>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 13, marginBottom: 16, textAlign: 'center', color: 'var(--muted)' }}>
              Select a role to sign in instantly
            </h2>
            <div className="login-roles">
              {ROLES.map((ro, i) => (
                <button
                  key={i}
                  id={`login-role-${ro.cls.replace('avatar-', '')}`}
                  className="role-pill login-pill"
                  onClick={() => handleRolePick(i)}
                >
                  <span className={`role-avatar ${ro.cls}`} style={{ width: 36, height: 36, fontSize: 13 }}>{ro.initials}</span>
                  <span className="role-info" style={{ marginLeft: 6 }}>
                    <div className="role-name" style={{ fontSize: 14 }}>{ro.name}</div>
                    <div className="role-title" style={{ fontSize: 12 }}>{ro.title}</div>
                  </span>
                  <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 18 }}>→</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
