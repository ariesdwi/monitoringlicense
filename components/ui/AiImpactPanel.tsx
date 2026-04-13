'use client';
import { useState, useMemo } from 'react';
import type { ApiAiImpact, ApiImpactSummary, ApiAiTool } from '@/lib/services';
import type { RoleKey } from './Sidebar';

interface AiImpactPanelProps {
  impacts: ApiAiImpact[];
  summary: ApiImpactSummary;
  roleKey: RoleKey;
  currentTL: string;
  onSubmit: (data: any) => void;
  onEdit?: (id: number, data: any) => void;
  onDelete: (id: number) => void;
  aiTools: ApiAiTool[];
}

export default function AiImpactPanel({ impacts, summary, roleKey, currentTL, onSubmit, onEdit, onDelete, aiTools }: AiImpactPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    squad: '', aplikasi: 'Qlola', aiTool: aiTools[0]?.name || '', period: '',
    manCount: 1, daysWithAI: 0, daysWithoutAI: 0,
    sqBugs: 0, sqVulnerabilities: 0, sqCodeSmells: 0, sqCoverage: 0, sqDuplications: 0, sqRating: 'A',
    notes: '',
  });

  const canSubmit = roleKey === 'tl';
  const canDelete = roleKey === 'admin' || roleKey === 'tl';

  const scoped = useMemo(() => {
    if (roleKey === 'tl') {
      const first = currentTL.split(' ')[0];
      return impacts.filter(i => i.tlName === first || i.tlName === currentTL);
    }
    return impacts;
  }, [impacts, roleKey, currentTL]);

  const handleSubmit = () => {
    if (!form.squad || !form.period) return;
    if (editingId && onEdit) {
      onEdit(editingId, form);
    } else {
      onSubmit(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ squad: '', aplikasi: 'Qlola', aiTool: aiTools[0]?.name || '', period: '', manCount: 1, daysWithAI: 0, daysWithoutAI: 0, sqBugs: 0, sqVulnerabilities: 0, sqCodeSmells: 0, sqCoverage: 0, sqDuplications: 0, sqRating: 'A', notes: '' });
  };

  const handleEditClick = (r: ApiAiImpact) => {
    setForm({
      squad: r.squad, aplikasi: r.aplikasi, aiTool: r.aiTool || aiTools[0]?.name || '', period: r.period,
      manCount: r.manCount, daysWithAI: r.daysWithAI, daysWithoutAI: r.daysWithoutAI,
      sqBugs: r.sqBugs, sqVulnerabilities: r.sqVulnerabilities, sqCodeSmells: r.sqCodeSmells, sqCoverage: r.sqCoverage, sqDuplications: r.sqDuplications, sqRating: r.sqRating,
      notes: r.notes || '',
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  // ── Shareable Report View (PDF-Optimized, light background) ──
  if (showReport) {
    const reportDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // Inline styles for PDF reliability (not dependent on CSS vars)
    const S = {
      page:       { background: '#fff', color: '#1a1a2e', padding: '48px 56px', maxWidth: 900, margin: '0 auto', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: 13, lineHeight: 1.5 } as React.CSSProperties,
      header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '3px solid #1a1a2e', paddingBottom: 20, marginBottom: 36 } as React.CSSProperties,
      logo:       { fontSize: 24, fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.03em' } as React.CSSProperties,
      logoAccent: { color: '#2563eb' } as React.CSSProperties,
      subtitle:   { fontSize: 14, color: '#6b7280', marginTop: 4 } as React.CSSProperties,
      dateLine:   { fontSize: 12, color: '#6b7280', textAlign: 'right' as const },
      dateValue:  { fontSize: 13, fontWeight: 600, color: '#1a1a2e' } as React.CSSProperties,

      sectionTitle: { fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #e5e7eb' } as React.CSSProperties,
      section:      { marginBottom: 36 } as React.CSSProperties,

      kpiGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 } as React.CSSProperties,
      kpiCard:    (border: string, bg: string) => ({ border: `2px solid ${border}`, borderRadius: 10, padding: '18px 16px', textAlign: 'center' as const, background: bg }),
      kpiValue:   (color: string) => ({ fontSize: 30, fontWeight: 800, color, lineHeight: 1.1 }),
      kpiLabel:   { fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginTop: 6 } as React.CSSProperties,

      th:         { background: '#f3f4f6', borderBottom: '2px solid #d1d5db', padding: '10px 12px', textAlign: 'left' as const, fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.06em' } as React.CSSProperties,
      td:         { padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 12.5, color: '#374151' } as React.CSSProperties,
      tdMono:     { padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 12, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: '#374151' } as React.CSSProperties,
      tdBold:     { padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 12.5, fontWeight: 600, color: '#1a1a2e' } as React.CSSProperties,

      ratingBadge: (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, fontSize: 12, fontWeight: 800, background: bg, color, fontFamily: "'JetBrains Mono', monospace" }),

      footer:     { display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e5e7eb', paddingTop: 18, marginTop: 40, fontSize: 10, color: '#9ca3af' } as React.CSSProperties,
      actions:    { display: 'flex', gap: 10, marginTop: 24, justifyContent: 'center' } as React.CSSProperties,
    };

    const ratingStyle = (r: string) => {
      switch (r) {
        case 'A': return S.ratingBadge('#dcfce7', '#15803d');
        case 'B': return S.ratingBadge('#dbeafe', '#1d4ed8');
        case 'C': return S.ratingBadge('#fef3c7', '#b45309');
        case 'D': return S.ratingBadge('#fee2e2', '#b91c1c');
        default:  return S.ratingBadge('#fecaca', '#991b1b');
      }
    };

    return (
      <div>
        {/* Print-ready report (white bg) */}
        <div style={S.page} id="impact-report">
          {/* Header */}
          <div style={S.header}>
            <div>
              <div style={S.logo}>license<span style={S.logoAccent}>·</span>os</div>
              <div style={S.subtitle}>AI Impact Assessment Report</div>
            </div>
            <div style={S.dateLine}>
              <div style={S.dateValue}>{reportDate}</div>
              <div style={{ marginTop: 2 }}>Generated by {currentTL || 'System'}</div>
            </div>
          </div>

          {/* Executive Summary */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Executive Summary</div>
            <div style={S.kpiGrid}>
              <div style={S.kpiCard('#e5e7eb', '#f9fafb')}>
                <div style={S.kpiValue('#1a1a2e')}>{summary.totalReports}</div>
                <div style={S.kpiLabel}>Total Reports</div>
              </div>
              <div style={S.kpiCard('#93c5fd', '#eff6ff')}>
                <div style={S.kpiValue('#1d4ed8')}>{summary.avgProductivityGain.toFixed(1)}%</div>
                <div style={S.kpiLabel}>Productivity Gain</div>
              </div>
              <div style={S.kpiCard('#86efac', '#f0fdf4')}>
                <div style={S.kpiValue('#15803d')}>{summary.totalManDaysSaved.toFixed(0)}</div>
                <div style={S.kpiLabel}>Man-Days Saved</div>
              </div>
              <div style={S.kpiCard('#fdba74', '#fff7ed')}>
                <div style={S.kpiValue('#b45309')}>{summary.avgCoverage.toFixed(1)}%</div>
                <div style={S.kpiLabel}>SQ Coverage</div>
              </div>
            </div>
          </div>

          {/* Team Breakdown */}
          {summary.byTeam.length > 0 && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Performance by Team</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={S.th}>Team</th>
                    <th style={S.th}>TL</th>
                    <th style={S.th}>Reports</th>
                    <th style={S.th}>Avg Days Saved</th>
                    <th style={S.th}>Avg Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byTeam.map(t => (
                    <tr key={t.teamId}>
                      <td style={S.tdBold}>{t.teamName}</td>
                      <td style={S.td}>{t.tlName}</td>
                      <td style={S.tdMono}>{t.reports}</td>
                      <td style={S.tdMono}>{t.avgSavingsDays.toFixed(1)} days</td>
                      <td style={S.tdMono}>{t.avgCoverage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Detailed Records */}
          {scoped.length > 0 && (
            <div style={S.section}>
              <div style={S.sectionTitle}>Detailed Impact Records</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={S.th}>#</th>
                    <th style={S.th}>Squad</th>
                    <th style={S.th}>App</th>
                    <th style={S.th}>AI Tool</th>
                    <th style={S.th}>Period</th>
                    <th style={S.th}>Team</th>
                    <th style={S.th}>w/ AI</th>
                    <th style={S.th}>w/o AI</th>
                    <th style={S.th}>Saved</th>
                    <th style={S.th}>Cov.</th>
                    <th style={S.th}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {scoped.map((r, i) => {
                    const saved = r.daysWithoutAI - r.daysWithAI;
                    return (
                      <tr key={r.id}>
                        <td style={S.tdMono}>{(i + 1).toString().padStart(2, '0')}</td>
                        <td style={S.tdBold}>{r.squad}</td>
                        <td style={S.td}>{r.aplikasi}</td>
                        <td style={S.td}>{r.aiTool}</td>
                        <td style={S.tdMono}>{r.period}</td>
                        <td style={S.tdMono}>{r.manCount}</td>
                        <td style={S.tdMono}>{r.daysWithAI}</td>
                        <td style={S.tdMono}>{r.daysWithoutAI}</td>
                        <td style={{ ...S.tdMono, fontWeight: 700, color: saved > 0 ? '#15803d' : '#b91c1c' }}>
                          {saved > 0 ? `−${saved}d` : `+${Math.abs(saved)}d`}
                        </td>
                        <td style={S.tdMono}>{r.sqCoverage}%</td>
                        <td style={S.td}><span style={ratingStyle(r.sqRating)}>{r.sqRating}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div style={S.footer}>
            <div>license·os — AI License Management System</div>
            <div>Confidential · Internal Use Only · {reportDate}</div>
          </div>
        </div>

        {/* Action buttons (hidden on print via CSS class) */}
        <div className="impact-report-actions">
          <button className="btn btn-ghost" onClick={() => setShowReport(false)}>← Back to Impact</button>
          <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print / Save PDF</button>
        </div>
      </div>
    );
  }


  // ── Main Panel View ──
  return (
    <div>
      {/* ── Summary Metrics ── */}
      <div className="metrics" style={{ marginBottom: 20 }}>
        <div className="metric-card glow-green">
          <div className="metric-label">Total Reports</div>
          <div className="metric-value">{summary.totalReports}</div>
          <div className="metric-sub">from all teams</div>
        </div>
        <div className="metric-card glow-teal">
          <div className="metric-label">Productivity Gain</div>
          <div className="metric-value">{summary.avgProductivityGain.toFixed(1)}%</div>
          <div className="metric-sub">average improvement</div>
        </div>
        <div className="metric-card glow-orange">
          <div className="metric-label">Man-Days Saved</div>
          <div className="metric-value">{summary.totalManDaysSaved.toFixed(0)}</div>
          <div className="metric-sub">total across projects</div>
        </div>
        <div className="metric-card glow-red">
          <div className="metric-label">Avg SQ Coverage</div>
          <div className="metric-value">{summary.avgCoverage.toFixed(1)}%</div>
          <div className="metric-sub">SonarQube average</div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {canSubmit && (
          <button className="btn btn-primary" onClick={() => {
            setEditingId(null);
            setForm({ squad: '', aplikasi: 'Qlola', aiTool: aiTools[0]?.name || '', period: '', manCount: 1, daysWithAI: 0, daysWithoutAI: 0, sqBugs: 0, sqVulnerabilities: 0, sqCodeSmells: 0, sqCoverage: 0, sqDuplications: 0, sqRating: 'A', notes: '' });
            setShowForm(true);
          }}>
            + New Report
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => setShowReport(true)}>
          📄 View Report
        </button>
      </div>

      {/* ── Records Table ── */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">AI Impact Records</span>
          <span className="td-mono">{scoped.length} records</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Squad</th>
                <th>Project APP</th>
                <th>AI Tool</th>
                <th>Period</th>
                <th>Team Size</th>
                <th>Days w/ AI</th>
                <th>Days w/o AI</th>
                <th>Saved</th>
                <th>Coverage</th>
                <th>Rating</th>
                {canDelete && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {scoped.length === 0 && (
                <tr>
                  <td colSpan={12}>
                    <div className="empty-state">No AI Impact reports found. {canSubmit ? 'Click "+ New Report" to submit one.' : ''}</div>
                  </td>
                </tr>
              )}
              {scoped.map((r, i) => {
                const saved = r.daysWithoutAI - r.daysWithAI;
                return (
                  <tr key={r.id}>
                    <td className="td-mono">{(i + 1).toString().padStart(2, '0')}</td>
                    <td style={{ fontWeight: 500 }}>{r.squad}</td>
                    <td style={{ fontWeight: 500 }}>{r.aplikasi}</td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent1)' }}>{r.aiTool || ''}</span>
                    </td>
                    <td className="td-mono">{r.period}</td>
                    <td className="td-mono">{r.manCount}</td>
                    <td className="td-mono">{r.daysWithAI}</td>
                    <td className="td-mono">{r.daysWithoutAI}</td>
                    <td className="td-mono" style={{ color: saved > 0 ? 'var(--accent2)' : 'var(--danger)', fontWeight: 600 }}>
                      {saved > 0 ? `−${saved} days` : `+${Math.abs(saved)} days`}
                    </td>
                    <td className="td-mono">{r.sqCoverage}%</td>
                    <td><span className={`impact-rating impact-rating-${r.sqRating}`}>{r.sqRating}</span></td>
                    {canDelete && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="act-btn act-assign" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => handleEditClick(r)}>Edit</button>
                          <button className="act-btn act-reject" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => onDelete(r.id)}>Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── New Report Modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-title">{editingId ? 'Edit AI Impact Report' : 'New AI Impact Report'}</div>
            <div className="modal-sub">{editingId ? 'Update your team\'s AI-assisted development metrics.' : 'Record your team\'s AI-assisted development metrics for a sprint/period.'}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Squad</label>
                <input className="form-input" placeholder="e.g. Roxanne" value={form.squad} onChange={e => setForm({ ...form, squad: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Period</label>
                <input className="form-input" placeholder="e.g. Sprint 12 / Mar 2025" value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Project APP</label>
                <select className="form-input" value={form.aplikasi} onChange={e => setForm({ ...form, aplikasi: e.target.value })}>
                  <option>Qlola</option><option>BRIMo</option><option>NDS</option><option>Brispot</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">AI Tool</label>
                <select className="form-input" value={form.aiTool} onChange={e => setForm({ ...form, aiTool: e.target.value })}>
                  {aiTools.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Team Size</label>
                <input className="form-input" type="number" min={1} value={form.manCount} onChange={e => setForm({ ...form, manCount: +e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Days with AI</label>
                <input className="form-input" type="number" min={0} value={form.daysWithAI} onChange={e => setForm({ ...form, daysWithAI: +e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Days without AI</label>
                <input className="form-input" type="number" min={0} value={form.daysWithoutAI} onChange={e => setForm({ ...form, daysWithoutAI: +e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">SQ Coverage %</label>
                <input className="form-input" type="number" min={0} max={100} value={form.sqCoverage} onChange={e => setForm({ ...form, sqCoverage: +e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">SQ Rating</label>
                <select className="form-input" value={form.sqRating} onChange={e => setForm({ ...form, sqRating: e.target.value })}>
                  <option>A</option><option>B</option><option>C</option><option>D</option><option>E</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">SQ Bugs</label>
                <input className="form-input" type="number" min={0} value={form.sqBugs} onChange={e => setForm({ ...form, sqBugs: +e.target.value })} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Notes (Optional)</label>
              <input className="form-input" placeholder="e.g. Used Copilot for unit test generation" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editingId ? 'Save Changes' : 'Submit Report'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
