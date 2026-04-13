'use client';

import type { ApiHistory } from '@/lib/services';

interface HistoryTableProps {
  history: ApiHistory[];
}

const ACTION_CLS: Record<string, string> = {
  APPROVE:  'action-approve',
  CREATE:   'action-create',
  ASSIGN:   'action-assign',
  CONFIRM:  'action-confirm',
  REVOKE:   'action-revoke',
  REQUEST:  'action-request',
  QUOTA:    'action-quota',
};

export default function HistoryTable({ history }: HistoryTableProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Audit Log</span>
        <span className="td-mono">{history.length} entries</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Role</th>
              <th>Action</th>
              <th>Target</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">No history entries yet.</div>
                </td>
              </tr>
            )}
            {history.map((h, i) => (
              <tr key={h.id ?? i}>
                <td className="td-mono">{h.time}</td>
                <td style={{ fontWeight: 500 }}>{h.actor}</td>
                <td className="td-mono">{h.role}</td>
                <td>
                  <span className={`td-mono ${ACTION_CLS[h.action] ?? ''}`} style={{ fontWeight: 600 }}>
                    {h.action}
                  </span>
                </td>
                <td>{h.target}</td>
                <td style={{ color: 'var(--muted)', fontSize: 12 }}>{h.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
