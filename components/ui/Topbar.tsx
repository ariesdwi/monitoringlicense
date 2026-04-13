'use client';

import type { View } from '@/components/ui/Sidebar';

const TITLES: Record<View, string> = {
  dashboard: 'Dashboard',
  licenses:  'License Management',
  requests:  'License Requests',
  quota:     'Quota Management',
  impact:    'AI Impact Report',
  history:   'Audit History',
  tools:     'AI Tools Management',
  analytics: 'Copilot Analytics',
};

interface TopbarProps {
  view: View;
  search: string;
  setSearch: (s: string) => void;
  onAdd?: () => void;
  showAdd?: boolean;
}

export default function Topbar({ view, search, setSearch, onAdd, showAdd }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="page-title">{TITLES[view]}</div>
      <div className="topbar-actions">
        <div className="search-box">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', font: 'inherit', width: 160,
            }}
          />
        </div>
        {showAdd && (
          <button className="btn btn-primary" onClick={onAdd}>
            + New Request
          </button>
        )}
        <button className="btn btn-ghost" style={{ position: 'relative' }}>
          🔔 <span className="notif-dot" style={{ position: 'absolute', top: 6, right: 6 }} />
        </button>
      </div>
    </header>
  );
}
