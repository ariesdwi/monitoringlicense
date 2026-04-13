'use client';
import { useState, useMemo } from 'react';
import type { ApiLicense, ApiAiTool } from '@/lib/services';
import { StatusBadge } from './Badges';
import { RoleKey } from './Sidebar';

interface LicenseTableProps {
  licenses: ApiLicense[];
  search: string;
  roleKey: RoleKey;
  /** Full name of the logged-in TL (used to scope the view) */
  currentTL: string;
  aiTools: ApiAiTool[];
  onRevoke: (id: number) => void;
  onAssign: (id: number) => void;
  onCreateAcc: (id: number) => void;
  onConfirmUsage: (id: number) => void;
  onInviteGroup: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const STATUSES = ['ALL', 'SUBMITTED_TO_CISO', 'PENDING_IGA', 'ACCOUNT_CREATED', 'ASSIGNED_TO_USER', 'DONE', 'REVOKED', 'AVAILABLE'];
const DEPT     = ['ALL', 'DWP', 'DGR', 'COP', 'ESP'];
const APPS     = ['ALL', 'Qlola', 'BRIMo', 'NDS', 'Brispot'];
const USER_TYPES = ['ALL', 'Internal', 'Vendor'];

export default function LicenseTable({
  licenses, search, roleKey, currentTL, aiTools,
  onRevoke, onAssign, onCreateAcc, onConfirmUsage, onInviteGroup, onEdit, onDelete
}: LicenseTableProps) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter,   setDeptFilter]   = useState('ALL');
  const [appFilter,    setAppFilter]    = useState('ALL');
  const [userTypeFilter, setUserTypeFilter] = useState('ALL');
  const [aiToolFilter, setAiToolFilter] = useState('ALL');

  // TL only sees licenses where tlName matches (first name match for flexibility)
  const tlFirst = currentTL.split(' ')[0];
  
  const filtered = useMemo(() => {
    let list = roleKey === 'tl'
      ? licenses.filter(l => l.tlName === tlFirst || l.tlName === currentTL)
      : licenses;

    if (statusFilter !== 'ALL') {
      list = list.filter(l => l.status === statusFilter);
    }
    if (deptFilter !== 'ALL') {
      list = list.filter(l => l.departemen === deptFilter);
    }
    if (appFilter !== 'ALL') {
      list = list.filter(l => l.aplikasi === appFilter);
    }
    if (userTypeFilter !== 'ALL') {
      list = list.filter(l => l.userType === userTypeFilter);
    }
    if (aiToolFilter !== 'ALL') {
      list = list.filter(l => (l.aiTool || 'Gemini') === aiToolFilter);
    }

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(l =>
        [l.userName, l.email, l.departemen, l.aplikasi, l.squad, l.tlName, l.team?.name ?? '', l.status]
          .some(v => v.toLowerCase().includes(s))
      );
    }
    return list;
  }, [licenses, search, roleKey, currentTL, tlFirst, statusFilter, deptFilter, appFilter, userTypeFilter, aiToolFilter]);

  const activeFilterCount = [statusFilter, deptFilter, appFilter, userTypeFilter, aiToolFilter].filter(f => f !== 'ALL').length;
  const clearFilters = () => { setStatusFilter('ALL'); setDeptFilter('ALL'); setAppFilter('ALL'); setUserTypeFilter('ALL'); setAiToolFilter('ALL'); };

  const canRevoke  = roleKey === 'ciso';
  const canCreate  = roleKey === 'ciso';
  const canAssign  = roleKey === 'admin';
  const canConfirm = roleKey === 'tl';
  const canInvite  = roleKey === 'iga';
  const canEdit    = roleKey === 'admin';
  const canDelete  = roleKey === 'admin';

  const showActions = canRevoke || canCreate || canAssign || canConfirm || canInvite || canEdit || canDelete;

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">
          {roleKey === 'tl' ? `Licenses — ${currentTL}'s Team` : 'All Licenses'}
        </span>
        <span className="td-mono">{filtered.length} records</span>
      </div>

      {/* ── Professional Filter Toolbar ── */}
      <div className="filter-toolbar">
        <div className="filter-toolbar-left">
          <span className="filter-toolbar-icon">⊟</span>
          <span className="filter-toolbar-title">Filters</span>
          {activeFilterCount > 0 && (
            <span className="filter-active-badge">{activeFilterCount} active</span>
          )}
        </div>

        <div className="filter-toolbar-selects">
          <div className="filter-select-group">
            <label className="filter-select-label">Status</label>
            <select
              className={`filter-select ${statusFilter !== 'ALL' ? 'filter-select--active' : ''}`}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              {STATUSES.slice(1).map(s => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ').replace('PENDING IGA', 'IGA QUEUE')}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <label className="filter-select-label">Departemen</label>
            <select
              className={`filter-select ${deptFilter !== 'ALL' ? 'filter-select--active' : ''}`}
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="ALL">All Dept</option>
              {DEPT.slice(1).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <label className="filter-select-label">Project APP</label>
            <select
              className={`filter-select ${appFilter !== 'ALL' ? 'filter-select--active' : ''}`}
              value={appFilter}
              onChange={e => setAppFilter(e.target.value)}
            >
              <option value="ALL">All Apps</option>
              {APPS.slice(1).map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <label className="filter-select-label">User Type</label>
            <select
              className={`filter-select ${userTypeFilter !== 'ALL' ? 'filter-select--active' : ''}`}
              value={userTypeFilter}
              onChange={e => setUserTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              {USER_TYPES.slice(1).map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <label className="filter-select-label">AI Tool</label>
            <select
              className={`filter-select ${aiToolFilter !== 'ALL' ? 'filter-select--active' : ''}`}
              value={aiToolFilter}
              onChange={e => setAiToolFilter(e.target.value)}
            >
              <option value="ALL">All Tools</option>
              {aiTools.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <button className="filter-clear-btn" onClick={clearFilters}>
            ✕ Clear
          </button>
        )}
      </div>

      {roleKey === 'tl' && (
        <div style={{
          padding: '10px 20px', background: 'rgba(94,162,242,0.06)',
          borderBottom: '1px solid var(--border)', fontSize: 12,
          color: 'var(--info)', fontFamily: 'var(--font-mono)',
        }}>
          ◈ Team View — You must click &apos;Confirm Usage&apos; when a license is assigned to your member
        </div>
      )}

      {roleKey === 'ciso' && (
        <div style={{
          padding: '10px 20px', background: 'rgba(242,168,78,0.06)',
          borderBottom: '1px solid var(--border)', fontSize: 12,
          color: 'var(--accent3)', fontFamily: 'var(--font-mono)',
        }}>
          ◈ Security View — Only CISO can Create Accounts (on Provider Portal) and Revoke access
        </div>
      )}

      {roleKey === 'iga' && (
        <div style={{
          padding: '10px 20px', background: 'rgba(144, 202, 249, 0.06)',
          borderBottom: '1px solid var(--border)', fontSize: 12,
          color: '#90caf9', fontFamily: 'var(--font-mono)',
        }}>
          ◈ Identity View — Invite active accounts to the correct License Group
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="license-table">
          <colgroup>
            <col className="col-num" />
            <col className="col-user" />
            <col className="col-type" />
            <col className="col-app" />
            <col className="col-tool" />
            <col className="col-tl" />
            <col className="col-status" />
            <col className="col-date" />
            {showActions && <col className="col-actions" />}
          </colgroup>
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Type</th>
              <th>App / Squad</th>
              <th>AI Tool</th>
              <th>TL / Team</th>
              <th>Status</th>
              <th>Date</th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={showActions ? 9 : 8}>
                  <div className="empty-state">No licenses found.</div>
                </td>
              </tr>
            )}
            {filtered.map((l, index) => (
              <tr key={l.id}>
                <td className="td-mono">{(index + 1).toString().padStart(2, '0')}</td>
                <td className="cell-truncate">
                  <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.userName}
                  </div>
                  <div className="td-mono" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.email}</div>
                </td>
                <td>
                  <span style={{ fontSize: 10.5, padding: '2px 7px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 10, whiteSpace: 'nowrap' }}>{l.userType}</span>
                </td>
                <td className="cell-truncate">
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.departemen} / {l.aplikasi}
                  </div>
                  <div className="td-mono" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.squad}</div>
                </td>
                <td>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)' }}>{l.aiTool || 'Gemini'}</span>
                </td>
                <td className="cell-truncate">
                  <div style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.tlName}</div>
                  <div className="td-mono" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.team?.name ?? '—'}</div>
                </td>
                <td><StatusBadge status={l.status as any} /></td>
                <td className="td-mono" style={{ whiteSpace: 'nowrap', fontSize: 10.5 }}>{l.date}</td>
                {showActions && (
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {canRevoke && l.status !== 'REVOKED' && l.status !== 'AVAILABLE' && (
                        <button className="act-btn act-reject" onClick={() => onRevoke(l.id)}>Revoke</button>
                      )}
                      {canCreate && l.status === 'SUBMITTED_TO_CISO' && (
                        <button className="act-btn act-approve" onClick={() => onCreateAcc(l.id)}>Create Acc</button>
                      )}
                      {canAssign && (l.status === 'ACCOUNT_CREATED' || l.status === 'AVAILABLE') && (
                        <button className="act-btn act-approve" onClick={() => onAssign(l.id)}>Assign</button>
                      )}
                      {canInvite && l.status === 'PENDING_IGA' && (
                        <button className="act-btn act-approve" onClick={() => onInviteGroup(l.id)}>Invite Group</button>
                      )}
                      {canConfirm && l.status === 'ASSIGNED_TO_USER' && (
                        <button className="act-btn act-approve" onClick={() => onConfirmUsage(l.id)}>Confirm</button>
                      )}
                      {canEdit && (
                        <button className="act-btn" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={() => onEdit(l.id)}>Edit</button>
                      )}
                      {canDelete && (
                        <button className="act-btn act-reject" onClick={() => onDelete(l.id)}>Del</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
