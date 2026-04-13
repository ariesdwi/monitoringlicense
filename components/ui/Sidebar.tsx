'use client';

import { ROLES } from '@/lib/mockData';
import type { User } from '@/lib/types';

export type View = 'dashboard' | 'licenses' | 'requests' | 'quota' | 'history' | 'impact' | 'tools' | 'analytics';
export type RoleKey = 'admin' | 'tl' | 'ciso' | 'iga' | 'idm';

interface SidebarProps {
  view: View;
  setView: (v: View) => void;
  role: number;
  setRole: (i: number) => void;
  requestCount: number;
  roleKey: RoleKey;
  /** Real user from JWT — when provided, overrides ROLES[role] display */
  currentUser?: User | null;
  onLogout: () => void;
}

const ALL_NAV = [
  { id: 'dashboard',  icon: '⬡', label: 'Dashboard',  roles: ['admin','tl','ciso','iga','idm'] as string[] },
  { id: 'licenses',   icon: '◈', label: 'Licenses',   roles: ['admin','tl','ciso','iga','idm'] as string[] },
  { id: 'requests',   icon: '◎', label: 'Requests',   roles: ['admin','tl']        as string[] },
  { id: 'quota',      icon: '◳', label: 'Quota',      roles: ['admin','tl']        as string[] },
  { id: 'impact',     icon: '◆', label: 'AI Impact',  roles: ['admin','tl','idm']  as string[] },
  { id: 'tools',      icon: '⚙', label: 'AI Tools',   roles: ['admin']             as string[] },
  { id: 'analytics',  icon: '◰', label: 'Copilot',    roles: ['admin','ciso','tl']      as string[] },
  { id: 'history',    icon: '◷', label: 'History',    roles: ['admin','ciso']      as string[] },
] as const;

const ROLE_LABELS: Record<RoleKey, string> = {
  admin: 'Full Access',
  tl: 'Team View',
  ciso: 'Security View',
  iga: 'Identity View',
  idm: 'Report Dashboard',
};

export default function Sidebar({ view, setView, role, setRole, requestCount, roleKey, currentUser, onLogout }: SidebarProps) {
  const r = ROLES[role];
  // Use real user data when available, fall back to mock ROLES
  const displayName     = currentUser?.name        ?? r.name;
  const displayTitle    = currentUser?.title       ?? r.title;
  const displayInitials = currentUser?.initials    ?? r.initials;
  const displayCls      = currentUser?.avatarClass ?? r.cls;

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-mark">license·os</div>
        <div className="logo-sub">AI License Manager</div>
      </div>

      <nav className="nav">
        <div className="nav-section">Navigation</div>
        {ALL_NAV.filter(n => n.roles.includes(roleKey)).map(n => (
          <button
            key={n.id}
            className={`nav-item${view === n.id ? ' active' : ''}`}
            onClick={() => setView(n.id as View)}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.label}
            {n.id === 'requests' && requestCount > 0 && (
              <span className="nav-badge">{requestCount}</span>
            )}
          </button>
        ))}
        <div className="nav-section" style={{ marginTop: 16 }}>Access Level</div>
        <div style={{
          margin: '4px 10px',
          padding: '6px 10px',
          borderRadius: 6,
          background: 'rgba(212,245,74,0.06)',
          border: '1px solid rgba(212,245,74,0.15)',
          fontSize: 12,
          color: 'var(--accent)',
          fontFamily: 'var(--font-mono)',
        }}>
          {ROLE_LABELS[roleKey]}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="role-pill" style={{ cursor: 'default', border: 'none', background: 'transparent', padding: '10px 0', marginBottom: 16 }}>
          <span className={`role-avatar ${displayCls}`}>{displayInitials}</span>
          <span className="role-info">
            <div className="role-name">{displayName}</div>
            <div className="role-title">{displayTitle}</div>
          </span>
        </div>
        <button 
          className="nav-item" 
          onClick={onLogout} 
          style={{ color: 'var(--danger)', padding: '10px' }}
        >
          <span className="nav-icon" style={{ transform: 'rotate(180deg)' }}>⎋</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
