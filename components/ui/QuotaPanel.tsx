'use client';

import { useState, useMemo } from 'react';
import type { ApiQuota, ApiAiTool, ApiLicense } from '@/lib/services';
import { updateQuota, createTeamLeader, allocateToolQuota, editAiTool } from '@/lib/services';
import { RoleKey } from './Sidebar';

interface QuotaPanelProps {
  roleKey?: RoleKey;
  currentTL?: string;
  quotas: ApiQuota[];
  aiTools: ApiAiTool[];
  licenses: ApiLicense[];
  onRefresh?: () => void;
  isCompact?: boolean;
}

function getFillClass(pct: number) {
  if (pct >= 0.9) return 'qfill-red';
  if (pct >= 0.6) return 'qfill-orange';
  return 'qfill-green';
}

// Derive a colour accent per AI tool name
function getToolAccent(name: string): { color: string; bg: string; glow: string } {
  const n = name.toLowerCase();
  if (n.includes('gemini'))  return { color: '#4285f4', bg: 'rgba(66,133,244,0.12)', glow: 'rgba(66,133,244,0.25)' };
  if (n.includes('copilot')) return { color: '#7c5cbf', bg: 'rgba(124,92,191,0.12)', glow: 'rgba(124,92,191,0.25)' };
  if (n.includes('claude'))  return { color: '#d4755f', bg: 'rgba(212,117,95,0.12)',  glow: 'rgba(212,117,95,0.25)' };
  if (n.includes('gpt') || n.includes('chatgpt')) return { color: '#19c37d', bg: 'rgba(25,195,125,0.12)', glow: 'rgba(25,195,125,0.25)' };
  return { color: 'var(--accent)', bg: 'rgba(48,127,226,0.12)', glow: 'rgba(48,127,226,0.25)' };
}

function getToolIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('gemini'))  return '✦';
  if (n.includes('copilot')) return '◈';
  if (n.includes('claude'))  return '◆';
  if (n.includes('gpt') || n.includes('chatgpt')) return '⬡';
  return '⬢';
}

export default function QuotaPanel({ 
  roleKey, currentTL, quotas, aiTools = [], licenses = [], onRefresh, isCompact 
}: QuotaPanelProps) {
  // ── Drill-down state ──────────────────────────────────────────────────────
  const [selectedTool, setSelectedTool] = useState<ApiAiTool | null>(null);

  // ── Edit/Add state ────────────────────────────────────────────────────────
  const [isEditing,      setIsEditing]      = useState(false);
  const [isEditingTools, setIsEditingTools] = useState(false);
  const [editValues,     setEditValues]     = useState<Record<number, number>>({});
  const [editToolValues, setEditToolValues] = useState<Record<number, number>>({});
  const [teamSearch,     setTeamSearch]     = useState('');
  const [toolFilter,     setToolFilter]     = useState<string>('all');
  const [showAddForm,    setShowAddForm]    = useState(false);
  const [form, setForm] = useState({
    tlName: '', email: '', teamName: '', departemen: '', aplikasi: '', maxQuota: 10,
  });

  const tlFirst = currentTL?.split(' ')[0] ?? '';

  // ── Compute per-tool usage from licenses ──────────────────────────────────
  const toolStats = useMemo(() => {
    if (!aiTools || !licenses) return [];
    return aiTools.map(tool => {
      const toolLicenses = licenses.filter(
        l => (l.aiTool || 'Gemini') === tool.name && l.status !== 'REVOKED' && l.status !== 'AVAILABLE',
      );
      const used = tool.usedQuota ?? toolLicenses.length;
      const total = tool.totalQuota ?? 0;
      const pct = total > 0 ? used / total : 0;
      return { tool, used, total, pct, licenses: toolLicenses };
    });
  }, [aiTools, licenses]);

  // ── Per-TL breakdown for selected tool ───────────────────────────────────
  const tlBreakdown = useMemo(() => {
    if (!selectedTool) return [];
    const toolName = selectedTool.name;

    interface TlRow { tl: string; team: string; quotaId: number; max: number; used: number }
    const tlMap: Record<string, TlRow> = {};
    
    // Initialize with tool-specific quotas if available, otherwise 0
    quotas.forEach(q => {
      const toolAlloc = q.toolQuotas?.find(tq => tq.tool === toolName);
      tlMap[q.tl] = { 
        tl: q.tl, 
        team: q.team, 
        quotaId: q.id, 
        max: toolAlloc ? toolAlloc.max : 0, 
        used: 0 
      };
    });

    // Count usage for the selected tool
    licenses
      .filter(l => (l.aiTool || 'Gemini') === toolName)
      .forEach(l => {
        const key = l.tlName;
        if (!tlMap[key]) {
          tlMap[key] = { tl: key, team: l.team?.name ?? '—', quotaId: -1, max: 0, used: 0 };
        }
        
        // Count as 'used' if status is DONE or ASSIGNED_TO_USER
        if (l.status === 'DONE' || l.status === 'ASSIGNED_TO_USER') {
          tlMap[key].used += 1;
        }
      });

    // Analysis of each TL's complete toolset across all active or available licenses
    const tlToolSets: Record<string, Set<string>> = {};
    licenses.forEach(l => {
      if (l.status === 'REVOKED') return; // Only exclude revoked licenses
      const tool = l.aiTool || 'Gemini';
      const tlKey = l.tlName.trim();
      if (!tlToolSets[tlKey]) tlToolSets[tlKey] = new Set();
      tlToolSets[tlKey].add(tool);
    });

    const rows = Object.values(tlMap);

    // Filter logic: In normal view, only show teams that have a non-zero allocation (max > 0)
    // for the currently selected AI tool. In "Edit Limits" mode, show all teams so allocations can be added.
    const filteredRows = (isEditing && roleKey === 'admin') ? rows : rows.filter(r => r.max > 0);

    // Further filter by team search string
    let finalRows = filteredRows;
    if (teamSearch) {
      const q = teamSearch.toLowerCase();
      finalRows = finalRows.filter(r => r.tl.toLowerCase().includes(q) || r.team.toLowerCase().includes(q));
    }

    if (roleKey === 'tl' && tlFirst) {
      return finalRows.filter(r => r.tl === tlFirst || r.tl === currentTL);
    }
    return finalRows.sort((a, b) => b.used - a.used);
  }, [selectedTool, quotas, licenses, roleKey, tlFirst, currentTL, isEditing, teamSearch]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleEditToggle = async () => {
    if (isEditing) {
      try {
        if (selectedTool) {
          // Update tool-specific quotas
          await Promise.all(
            Object.entries(editValues)
              .filter(([id, val]) => !isNaN(Number(id)))
              .map(([id, maxQuota]) => {
                const teamId = Number(id);
                return allocateToolQuota(teamId, selectedTool.name, maxQuota);
              }),
          );
        } else {
          // Update global quotas for teams
          await Promise.all(
            Object.entries(editValues)
              .filter(([id]) => !isNaN(Number(id)) && Number(id) > 0)
              .map(([id, maxQuota]) => updateQuota(Number(id), maxQuota)),
          );
        }
        setIsEditing(false);
        setEditValues({});
        if (onRefresh) onRefresh();
      } catch {
        alert('Gagal memperbarui kuota. Pastikan Backend berjalan.');
        setIsEditing(false);
      }
    } else {
      const initial: Record<number, number> = {};
      if (selectedTool) {
        tlBreakdown.forEach(r => { if (r.quotaId > 0) initial[r.quotaId] = r.max; });
      } else {
        quotas.forEach(q => { initial[q.id] = q.max; });
      }
      setEditValues(initial);
      setIsEditing(true);
    }
  };

  const handleToolEditToggle = async () => {
    if (isEditingTools) {
      try {
        await Promise.all(
          Object.entries(editToolValues).map(([id, totalQuota]) => 
            {
              const tool = aiTools.find(t => t.id === Number(id));
              return editAiTool(Number(id), { name: tool?.name || '', totalQuota });
            }
          )
        );
        setIsEditingTools(false);
        setEditToolValues({});
        if (onRefresh) onRefresh();
      } catch {
        alert('Gagal memperbarui kuota AI Tool.');
        setIsEditingTools(false);
      }
    } else {
      const initial: Record<number, number> = {};
      aiTools.forEach(t => { initial[t.id] = t.totalQuota; });
      setEditToolValues(initial);
      setIsEditingTools(true);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTeamLeader(form);
      setShowAddForm(false);
      setForm({ tlName: '', email: '', teamName: '', departemen: '', aplikasi: '', maxQuota: 10 });
      if (onRefresh) onRefresh();
    } catch {
      alert('Gagal menambahkan Leader. Pastikan Backend berjalan.');
    }
  };

  const filteredQuotas = useMemo(() => {
    let list = quotas;
    
    // Filter by tool if a specific tool is selected in summary
    if (toolFilter !== 'all') {
      list = list.filter(q => 
        q.toolQuotas?.some(tq => tq.tool === toolFilter && tq.max > 0) ||
        licenses.some(l => l.teamId === q.id && (l.aiTool || 'Gemini') === toolFilter && l.status !== 'REVOKED')
      );
    }

    // Filter by search
    if (teamSearch && !selectedTool) {
      const q = teamSearch.toLowerCase();
      list = list.filter(item => 
        item.tl.toLowerCase().includes(q) || 
        item.team.toLowerCase().includes(q)
      );
    }

    return list;
  }, [quotas, toolFilter, teamSearch, selectedTool, licenses]);

  // ── TL Role specific tool rows ──────────────────────────────────────────
  const tlToolRows = useMemo(() => {
    if (roleKey !== 'tl' || !tlFirst) return [];
    
    // Calculate tool-specific allocation (max) and usage (used) for this TL
    const myLicenses = licenses.filter(
      l => (l.tlName === tlFirst || l.tlName === currentTL)
    );
    
    return aiTools.map(tool => {
      const toolLics = myLicenses.filter(l => (l.aiTool || 'Gemini') === tool.name);
      
      const max = toolLics.filter(l => l.status !== 'REVOKED').length;
      const used = toolLics.filter(l => l.status === 'DONE' || l.status === 'ASSIGNED_TO_USER').length;
      
      return { tool, used, max };
    }).filter(r => r.max > 0);
  }, [roleKey, tlFirst, aiTools, licenses, currentTL]);

  // Render logic components
  const renderSummaryRow = (q: ApiQuota, i: number) => {
    const pct = q.max > 0 ? q.used / q.max : 0;
    
    return (
      <div className="quota-row" key={q.id ?? i}>
        <div style={{ minWidth: 150 }}>
          <div className="quota-name">{q.tl}</div>
          <div className="quota-name-sub" style={{ fontSize: 11 }}>{q.breakdownLabel || q.team}</div>
        </div>
        <div className="quota-bar-track">
          <div className={`quota-bar-fill ${getFillClass(pct)}`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
        </div>
        {isEditing && q.id > 0 && !selectedTool ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="td-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{q.used}/</span>
            <input type="number" min={q.used} className="form-input" style={{ width: 60, padding: '4px 6px', fontSize: 12 }} 
              value={editValues[q.id] ?? q.max}
              onChange={e => setEditValues(prev => ({ ...prev, [q.id]: parseInt(e.target.value) || 0 }))}
            />
          </div>
        ) : (
          <div className="quota-nums">{q.used}/{q.max}</div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (isCompact) {
      return (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Team Quota Summary</span>
            {roleKey === 'admin' && <button className="panel-action" onClick={() => setShowAddForm(true)}>+ Add Leader</button>}
          </div>
          {quotas.length === 0 && <div className="empty-state">No quota data available.</div>}
          {quotas.map(renderSummaryRow)}
        </div>
      );
    }

    if (selectedTool) {
      const accent = getToolAccent(selectedTool.name);
      const icon   = getToolIcon(selectedTool.name);
      const stat   = toolStats.find(s => s.tool.id === selectedTool.id);
      return (
        <div className="panel">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => { setSelectedTool(null); setIsEditing(false); }}
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '5px 12px', color: 'var(--muted)',
                  cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-mono)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >← Back</button>
              <span style={{ width: 28, height: 28, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: accent.bg, color: accent.color, fontSize: 14 }}>{icon}</span>
              <div>
                <div className="panel-title">{selectedTool.name} — TL Breakdown</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{stat?.used ?? 0} / {stat?.total ?? 0} seats</div>
              </div>
            </div>
            {roleKey === 'admin' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <input 
                  type="text" 
                  placeholder="Search team..." 
                  className="form-input" 
                  style={{ width: 150, padding: '4px 10px', fontSize: 12 }} 
                  value={teamSearch}
                  onChange={e => setTeamSearch(e.target.value)}
                />
                <button className="panel-action" onClick={() => { setShowAddForm(true); setTeamSearch(''); }}>+ Add Leader</button>
                <button className="panel-action" onClick={handleEditToggle} style={{ color: isEditing ? 'var(--info)' : '' }}>
                  {isEditing ? 'Save Limits' : 'Edit Limits'}
                </button>
              </div>
            )}
          </div>
          {stat && (
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.015)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Global Usage</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: accent.color }}>{stat.used} / {stat.total} ({Math.round(stat.pct * 100)}%)</span>
              </div>
              <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, width: `${Math.min(stat.pct * 100, 100)}%`, background: stat.pct >= 0.9 ? 'var(--danger)' : stat.pct >= 0.6 ? 'var(--accent3)' : accent.color }} />
              </div>
            </div>
          )}
          {tlBreakdown.length === 0 && <div className="empty-state">No team data for this tool.</div>}
          {tlBreakdown.map((row, i) => {
            const pct = row.max > 0 ? row.used / row.max : 0;
            return (
              <div className="quota-row" key={row.quotaId > 0 ? row.quotaId : `tl-${i}`}>
                <div style={{ minWidth: 130 }}>
                  <div className="quota-name">{row.tl}</div>
                  <div className="quota-name-sub">{row.team}</div>
                </div>
                <div className="quota-bar-track">
                  <div className={`quota-bar-fill ${getFillClass(pct)}`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
                </div>
                {isEditing && row.quotaId > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="td-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{row.used}/</span>
                    <input type="number" min={row.used} className="form-input" style={{ width: 60, padding: '4px 6px', fontSize: 12 }} 
                      value={editValues[row.quotaId] ?? row.max}
                      onChange={e => setEditValues(prev => ({ ...prev, [row.quotaId]: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                ) : (
                  <div className="quota-nums">{row.used}/{row.max > 0 ? row.max : '—'}</div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (roleKey === 'tl') {
      return (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">My Team — Tool Usage</span>
            <span className="td-mono">{currentTL}</span>
          </div>
          {tlToolRows.length === 0 && <div className="empty-state">No tool usage recorded.</div>}
          {tlToolRows.map(({ tool, used, max }) => {
            const stat = toolStats.find(s => s.tool.id === tool.id);
            const accent = getToolAccent(tool.name);
            const icon = getToolIcon(tool.name);
            const pct = max > 0 ? used / max : 0;
            return (
              <div className="quota-row" key={tool.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 150 }}>
                  <span style={{ width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, background: accent.bg, color: accent.color, fontSize: 13 }}>{icon}</span>
                  <div><div className="quota-name">{tool.name}</div><div className="quota-name-sub">Global: {stat?.used ?? 0}/{stat?.total ?? 0}</div></div>
                </div>
                <div className="quota-bar-track">
                  <div className={`quota-bar-fill ${getFillClass(pct)}`} style={{ width: `${Math.min(pct * 100, 100)}%`, background: accent.color }} />
                </div>
                <div className="quota-nums">{used}/{max} seats</div>
              </div>
            );
          })}
        </div>
      );
    }

    // Default: AI Tool Cards
    return (
      <>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>AI Tool Quota Overview</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Select a tool to view team breakdown</div>
          </div>
          {roleKey === 'admin' && (
            <button className="panel-action" onClick={handleToolEditToggle} style={{ color: isEditingTools ? 'var(--info)' : '' }}>
              {isEditingTools ? 'Save Global Quotas' : 'Edit Global Quotas'}
            </button>
          )}
        </div>
        {toolStats.length === 0 && <div className="panel"><div className="empty-state">No AI tools configured.</div></div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 24 }}>
          {toolStats.map(({ tool, used, total, pct }) => {
            const accent = getToolAccent(tool.name);
            const icon   = getToolIcon(tool.name);
            return (
              <div key={tool.id} className="card-btn"
                style={{ background: 'var(--surface)', border: `1px solid ${isEditingTools ? accent.color : 'var(--border)'}`, borderRadius: 16, padding: isEditingTools ? '22px 22px 14px' : 22, cursor: isEditingTools ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' }}
                onClick={() => !isEditingTools && setSelectedTool(tool)}
                onMouseEnter={e => { if (!isEditingTools) { e.currentTarget.style.borderColor = accent.color; e.currentTarget.style.boxShadow = `0 0 0 1px ${accent.glow}, 0 8px 24px rgba(0,0,0,0.3)`; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                onMouseLeave={e => { if (!isEditingTools) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; } }}
              >
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${accent.glow} 0%, transparent 70%)` }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ width: 40, height: 40, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: accent.bg, color: accent.color, fontSize: 20 }}>{icon}</span>
                  <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{tool.name}</div><div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{Math.max(0, total - used)} slots free</div></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div><div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: accent.color }}>{used}</div><div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>used</div></div>
                  <div style={{ textAlign: 'right' }}>
                    {isEditingTools ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <input 
                          type="number" 
                          min={used} 
                          className="form-input" 
                          style={{ width: 80, textAlign: 'right', fontSize: 18, fontWeight: 700, padding: '4px 8px' }}
                          value={editToolValues[tool.id] ?? total}
                          onChange={e => setEditToolValues(prev => ({ ...prev, [tool.id]: parseInt(e.target.value) || 0 }))}
                          onClick={e => e.stopPropagation()}
                        />
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>total</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{total}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>total</div>
                      </>
                    )}
                  </div>
                </div>
                {!isEditingTools && (
                  <>
                    <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 999, overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{ height: '100%', borderRadius: 999, width: `${Math.min(pct * 100, 100)}%`, background: pct >= 0.9 ? 'var(--danger)' : pct >= 0.6 ? 'var(--accent3)' : accent.color, transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{Math.round(pct * 100)}% util</span>
                      <span style={{ fontSize: 11, color: accent.color, fontFamily: 'var(--font-mono)' }}>Select Tool →</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="panel">
          <div className="panel-header" style={{ alignItems: 'center' }}>
             <span className="panel-title">All Teams Summary</span>
             <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Search team..." 
                  className="form-input" 
                  style={{ width: 140, padding: '4px 10px', fontSize: 12 }} 
                  value={teamSearch}
                  onChange={e => setTeamSearch(e.target.value)}
                />
                <select 
                  className="form-input" 
                  style={{ width: 110, padding: '4px 6px', fontSize: 12 }}
                  value={toolFilter}
                  onChange={e => setToolFilter(e.target.value)}
                >
                  <option value="all">All Tools</option>
                  {aiTools.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
                <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                {roleKey === 'admin' && (
                  <>
                    <button className="panel-action" onClick={() => { setShowAddForm(true); setTeamSearch(''); }}>+ Add Leader</button>
                    <button className="panel-action" onClick={handleEditToggle} style={{ color: isEditing ? 'var(--info)' : '' }}>
                      {isEditing ? 'Save Limits' : 'Edit Limits'}
                    </button>
                  </>
                )}
             </div>
          </div>
          {filteredQuotas.length === 0 && <div className="empty-state">No matching teams found.</div>}
          {filteredQuotas.map(renderSummaryRow)}
        </div>
      </>
    );
  };

  return (
    <>
      {renderContent()}
      
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Onboard New Leader</div>
            <div className="modal-sub">Create a new team and assign a Technical Lead.</div>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group"><label className="form-label">Leader Name</label><input required placeholder="e.g. Budi" className="form-input" value={form.tlName} onChange={e => setForm({ ...form, tlName: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Email</label><input required type="email" placeholder="e.g. budi@corp.id" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Team Name</label><input required placeholder="e.g. Tim Alpha" className="form-input" value={form.teamName} onChange={e => setForm({ ...form, teamName: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">Dept</label><input required placeholder="IT" className="form-input" value={form.departemen} onChange={e => setForm({ ...form, departemen: e.target.value })} /></div>
                <div className="form-group" style={{ flex: 1 }}><label className="form-label">App</label><input required placeholder="Qlola" className="form-input" value={form.aplikasi} onChange={e => setForm({ ...form, aplikasi: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Initial Max Quota</label><input required type="number" min={1} className="form-input" style={{ width: 100 }} value={form.maxQuota} onChange={e => setForm({ ...form, maxQuota: parseInt(e.target.value) || 0 })} /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
