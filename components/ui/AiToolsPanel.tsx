import React, { useState } from 'react';
import type { ApiAiTool } from '@/lib/services';

interface AiToolsPanelProps {
  tools: ApiAiTool[];
  roleKey: string;
  onCreate: (name: string, totalQuota?: number) => Promise<void>;
  onEdit: (id: number, name: string, totalQuota?: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function getFillClass(pct: number) {
  if (pct >= 0.9) return 'qfill-red';
  if (pct >= 0.6) return 'qfill-orange';
  return 'qfill-green';
}

export default function AiToolsPanel({ tools, roleKey, onCreate, onEdit, onDelete }: AiToolsPanelProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingTool, setEditingTool] = useState<ApiAiTool | null>(null);
  const [name, setName] = useState('');
  const [totalQuota, setTotalQuota] = useState(0);

  if (roleKey !== 'admin') {
    return (
      <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
        <h2>Forbidden</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingTool(null);
    setName('');
    setTotalQuota(0);
    setShowModal(true);
  };

  const handleOpenEdit = (tool: ApiAiTool) => {
    setEditingTool(tool);
    setName(tool.name);
    setTotalQuota(tool.totalQuota || 0);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      if (editingTool) {
        await onEdit(editingTool.id, name, totalQuota);
      } else {
        await onCreate(name, totalQuota);
      }
      setShowModal(false);
    } catch (e) {
      // errors handled by page
    }
  };

  return (
    <div className="panel" style={{ padding: 24 }}>
      <div className="panel-header" style={{ marginBottom: 24 }}>
        <h2 className="panel-title">AI Tools Management</h2>
        <button className="btn btn-primary" onClick={handleOpenCreate}>+ New Tool</button>
      </div>

      <div style={{ overflowX: 'auto', background: 'var(--panel-bg)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Quota Usage</th>
              <th>Created At</th>
              <th className="th-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tools.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                  No AI Tools found. Create one.
                </td>
              </tr>
            ) : tools.map(t => {
              const used = t.usedQuota || 0;
              const total = t.totalQuota || 0;
              const pct = total > 0 ? used / total : 0;
              return (
                <tr key={t.id}>
                  <td className="td-mono">#{t.id}</td>
                  <td style={{ fontWeight: 500 }}>{t.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="quota-bar-track" style={{ width: 100, margin: 0 }}>
                        <div
                          className={`quota-bar-fill ${getFillClass(pct)}`}
                          style={{ width: `${Math.min(pct * 100, 100)}%` }}
                        />
                      </div>
                      <div className="td-mono" style={{ fontSize: 13 }}>{used}/{total === 0 ? '∞' : total}</div>
                    </div>
                  </td>
                  <td className="td-mono">{new Date(t.createdAt).toLocaleDateString('id-ID')}</td>
                  <td className="td-right">
                    <button className="btn btn-ghost" onClick={() => handleOpenEdit(t)}>Edit</button>
                    <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => onDelete(t.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editingTool ? 'Edit AI Tool' : 'New AI Tool'}</div>
            <div className="modal-sub">
               Specify the name and total allowed quota of the AI tool. Set to 0 for unlimited.
            </div>

            <div className="form-group">
              <label className="form-label">Tool Name</label>
              <input
                className="form-input"
                placeholder="e.g. GitHub Copilot"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Total Quota (Seats)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="e.g. 50"
                value={totalQuota}
                onChange={e => setTotalQuota(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingTool ? 'Save Changes' : 'Create Tool'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
