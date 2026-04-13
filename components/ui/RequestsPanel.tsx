'use client';

import type { ApiRequest } from '@/lib/services';
import { AppSquadTag } from './Badges';
import { RoleKey } from './Sidebar';

interface RequestsPanelProps {
  requests: ApiRequest[];
  roleKey: RoleKey;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  inline?: boolean;
}

export default function RequestsPanel({ requests, roleKey, onApprove, onReject, inline }: RequestsPanelProps) {
  const canApprove = roleKey === 'admin';

  if (requests.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header"><span className="panel-title">Pending Requests</span></div>
        <div className="empty-state">No pending requests 🎉</div>
      </div>
    );
  }

  return (
    <div className="panel" style={inline ? {} : { maxWidth: 760 }}>
      <div className="panel-header">
        <span className="panel-title">Pending Requests</span>
        <span className="td-mono">{requests.length} pending</span>
      </div>

      {roleKey === 'tl' && (
        <div style={{
          padding: '10px 20px',
          background: 'rgba(94,162,242,0.06)',
          borderBottom: '1px solid var(--border)',
          fontSize: 12,
          color: 'var(--info)',
          fontFamily: 'var(--font-mono)',
        }}>
          ◎ TL — You can submit new requests. Approval is done by Admin.
        </div>
      )}

      {requests.map(r => (
        <div className="request-row" key={r.id}>
          <div className="req-avatar">
            {r.userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
          </div>
          <div className="req-info">
            <div className="req-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {r.userName}
              <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--border)', color: 'var(--text)', borderRadius: 4, fontWeight: 'normal' }}>{r.userType}</span>
            </div>
            <div className="req-detail">
              {r.tlName} · {r.team?.name ?? '—'} · <AppSquadTag departemen={r.departemen} aplikasi={r.aplikasi} squad={r.squad} /> · {r.date}
            </div>
            <div className="req-detail" style={{ marginTop: 4, fontStyle: 'italic' }}>
              &quot;{r.reason}&quot;
            </div>
          </div>
          {canApprove && (
            <div className="req-actions">
              <button className="act-btn act-approve" onClick={() => onApprove(r.id)}>Approve</button>
              <button className="act-btn act-reject" onClick={() => onReject(r.id)}>Reject</button>
            </div>
          )}
          {!canApprove && (
            <span className="td-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>Awaiting Admin</span>
          )}
        </div>
      ))}
    </div>
  );
}
