'use client';

import { useState, useEffect } from 'react';
import { 
  fetchCopilotMemberActivity, 
  fetchCopilotUsage, 
  fetchCopilotRecommendations, 
  syncCopilotData,
  fetchCopilotOrgMetrics,
  importUserBillingCsv,
  importUserBillingImage,
  ApiCopilotMemberActivity,
  ApiCopilotUsage,
  ApiCopilotUsageModel,
  ApiCopilotRecommendationsRes,
  ApiCopilotOrgMetrics,
  UserBillingImportResult,
} from '@/lib/services';
import type { RoleKey } from '@/components/ui/Sidebar';

interface CopilotAnalyticsProps {
  roleKey: RoleKey;
  currentTL: string;
}

export default function CopilotAnalytics({ roleKey, currentTL }: CopilotAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'member' | 'usage' | 'recommendations'>('member');
  const [memberActivity, setMemberActivity] = useState<ApiCopilotMemberActivity[]>([]);
  const [copilotUsage, setCopilotUsage] = useState<ApiCopilotUsage[]>([]);
  const [actionRecommendations, setActionRecommendations] = useState<ApiCopilotRecommendationsRes['recommendations']>([]);
  const [summary, setSummary] = useState<ApiCopilotRecommendationsRes['summary']>({
    totalSeats: 0, totalFlagged: 0, healthySeats: 0, wastagePercent: 0,
    bySeverity: { high: 0, medium: 0, low: 0 },
    byType: {
      revoke: { count: 0, savingsUsd: 0 },
      review: { count: 0, savingsUsd: 0 },
      low_productivity: { count: 0 },
      training: { count: 0 },
      sync: { count: 0 },
    },
    totalPotentialSavingsUsd: 0,
    totalPotentialSavingsLabel: '$0',
  });
  const [orgMetrics, setOrgMetrics] = useState<ApiCopilotOrgMetrics | null>(null);
  const [expandedUsageRow, setExpandedUsageRow] = useState<string | null>(null);

  // ── Import billing modal state ──
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'csv' | 'image'>('csv');
  const [importCsvText, setImportCsvText] = useState('');
  const [importMonth, setImportMonth] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<UserBillingImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [memberRes, usageRes, recsRes, orgMetricsRes] = await Promise.all([
        fetchCopilotMemberActivity(),
        fetchCopilotUsage(),
        fetchCopilotRecommendations(),
        fetchCopilotOrgMetrics(),
      ]);
      setMemberActivity(memberRes);
      setCopilotUsage(usageRes);
      setSummary(recsRes.summary);
      setActionRecommendations(recsRes.recommendations);
      setOrgMetrics(orgMetricsRes);
    } catch (error) {
      console.error("Gagal menarik data Copilot Analytics", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncCopilotData();
      await fetchData();
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setSyncing(false);
    }
  };

  const showSyncBtn = roleKey === 'admin' || roleKey === 'ciso';

  const handleImport = async () => {
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      let result: UserBillingImportResult;
      const month = importMonth || undefined;
      if (importMode === 'csv') {
        if (!importCsvText.trim()) {
          setImportError('Paste CSV data terlebih dahulu.');
          setImporting(false);
          return;
        }
        result = await importUserBillingCsv(importCsvText, month);
      } else {
        if (!importFile) {
          setImportError('Pilih file gambar terlebih dahulu.');
          setImporting(false);
          return;
        }
        result = await importUserBillingImage(importFile, month);
      }
      setImportResult(result);
      // Refresh usage data after successful import
      if (result.imported > 0) {
        await fetchData();
      }
    } catch (err: any) {
      setImportError(err?.message ?? 'Import gagal');
    } finally {
      setImporting(false);
    }
  };

  const resetImportModal = () => {
    setShowImportModal(false);
    setImportCsvText('');
    setImportFile(null);
    setImportResult(null);
    setImportError(null);
    setImportMonth('');
  };

  function exportUsagePDF(rows: ApiCopilotUsage[]) {
    const win = window.open('', '_blank', 'width=1200,height=850');
    if (!win) return;

    const generatedAt = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
    const usersWithReal = rows.filter(r => r.hasRealBillingData);
    const totalReq   = usersWithReal.reduce((s, r) => s + (r.usageBreakdown?.includedRequests ?? 0), 0);
    const totalBilled = usersWithReal.reduce((s, r) => s + (r.usageBreakdown?.billedRequests ?? 0), 0);
    const totalGross = usersWithReal.reduce((s, r) => s + (r.usageBreakdown?.grossAmount ?? 0), 0);
    const totalBilledAmt = usersWithReal.reduce((s, r) => s + (r.usageBreakdown?.billedAmount ?? 0), 0);

    const prodColor = (c: string) => c === 'green' ? '#4ba895' : c === 'yellow' ? '#f2a84e' : c === 'gray' ? '#9ca3af' : '#e26161';

    const tableRows = rows.map((row, idx) => {
      const bd = row.usageBreakdown;
      const hasReal = row.hasRealBillingData;
      const usedPct = bd && bd.includedRequestsMax > 0 ? Math.min(100, (bd.includedRequests / bd.includedRequestsMax) * 100) : (row.usageEfficiency ?? 0);
      const barColor = usedPct >= 80 ? '#f2a84e' : usedPct >= 40 ? '#4ba895' : '#9ca3af';

      const actCell = row.daysSinceActivity !== null && row.daysSinceActivity !== undefined
        ? `${row.lastLoginLabel}<br><small style="color:#9ca3af">${row.daysSinceActivity === 0 ? 'Aktif hari ini' : `${row.daysSinceActivity}h lalu`}</small>`
        : `<span style="color:#9ca3af">${row.lastLoginLabel || '—'}</span>`;

      const progressBar = `
        <div style="display:flex;justify-content:space-between;font-size:0.68rem;margin-bottom:3px">
          <span>${bd ? bd.includedRequests.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—'} req</span>
          <span style="color:#9ca3af">/ ${bd ? bd.includedRequestsMax.toLocaleString() : '1,000'}</span>
        </div>
        <div style="height:4px;border-radius:4px;background:#f3f4f6;overflow:hidden">
          <div style="height:100%;width:${usedPct.toFixed(1)}%;background:${barColor};border-radius:4px"></div>
        </div>
        <div style="font-size:0.65rem;color:#9ca3af;margin-top:2px">Gross: <strong style="color:#111">$${(bd?.grossAmount ?? 0).toFixed(2)}</strong>${bd && bd.billedAmount > 0 ? ` <span style="color:#e26161">+$${bd.billedAmount.toFixed(2)}</span>` : ''}</div>`;

      return `
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="text-align:center;color:#9ca3af;padding:9px 6px;font-size:0.78rem">${idx + 1}</td>
          <td style="padding:9px 8px">
            <strong style="font-size:0.88rem">${row.name}</strong>${hasReal ? ' <span style="display:inline-block;padding:1px 5px;border-radius:99px;font-size:0.6rem;font-weight:700;background:#dbeafe;color:#3b82f6">REAL</span>' : ''}
            <br><span style="font-size:0.72rem;color:#6b7280;font-family:monospace">@${row.githubLogin || row.email}</span>
            <br><span style="font-size:0.7rem;color:#9ca3af">${row.email}</span>
          </td>
          <td style="padding:9px 8px;font-size:0.82rem">
            ${row.editor || '—'}<br>
            <span style="font-size:0.7rem;color:#9ca3af;font-family:monospace">${row.editorVersion || ''}</span>
            ${row.copilotExtension ? `<br><span style="font-size:0.68rem;color:#f2a84e">ext ${row.copilotExtension}</span>` : ''}
          </td>
          <td style="padding:9px 8px;font-size:0.82rem">${actCell}</td>
          <td style="padding:9px 8px;font-size:0.8rem">${progressBar}</td>
          <td style="padding:9px 8px;text-align:center">
            <span style="display:inline-block;padding:3px 9px;border-radius:99px;font-size:0.78rem;font-weight:600;background:${prodColor(row.produktivitasColor ?? '')}22;color:${prodColor(row.produktivitasColor ?? '')}">
              ${row.produktivitas || '—'}
            </span>
            <div style="font-size:0.68rem;color:#9ca3af;margin-top:3px">${row.usageEfficiency ?? 0}% efisiensi</div>
          </td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Copilot Usage Analytics — ${generatedAt}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #111827; background: #fff; padding: 32px 40px; }
    h1 { font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .meta { font-size: 0.75rem; color: #6b7280; margin-bottom: 24px; }
    .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 28px; }
    .summary-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; }
    .summary-card .lbl { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; }
    .summary-card .val { font-size: 1.35rem; font-weight: 700; color: #111827; }
    .summary-card .sub { font-size: 0.7rem; color: #9ca3af; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f9fafb; }
    th { padding: 10px 8px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; text-align: left; border-bottom: 2px solid #e5e7eb; }
    tr:hover td { background: #f9fafb; }
    .footer { margin-top: 24px; font-size: 0.72rem; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
    @media print {
      body { padding: 16px; }
      @page { margin: 16mm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <h1>Copilot Usage Analytics — Per User</h1>
  <div class="meta">Digenerate pada ${generatedAt} &nbsp;·&nbsp; ${rows.length} pengguna · ${usersWithReal.length} real billing data</div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="lbl">Total Users</div>
      <div class="val">${rows.length}</div>
      <div class="sub">${usersWithReal.length} dengan data real</div>
    </div>
    <div class="summary-card">
      <div class="lbl">Total Requests</div>
      <div class="val">${totalReq.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
      <div class="sub">dari data import</div>
    </div>
    <div class="summary-card" style="border-color:${totalBilled > 0 ? '#fca5a5' : '#e5e7eb'}">
      <div class="lbl">Billed Requests</div>
      <div class="val" style="color:${totalBilled > 0 ? '#dc2626' : '#111'}">${totalBilled.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
      <div class="sub">${totalBilled > 0 ? 'Ada overage!' : 'Tidak ada overage'}</div>
    </div>
    <div class="summary-card">
      <div class="lbl">Gross Cost</div>
      <div class="val" style="color:#f59e0b">$${totalGross.toFixed(2)}</div>
      <div class="sub">total dari semua user</div>
    </div>
    <div class="summary-card" style="border-color:${totalBilledAmt > 0 ? '#fca5a5' : '#e5e7eb'}">
      <div class="lbl">Total Billed</div>
      <div class="val" style="color:${totalBilledAmt > 0 ? '#dc2626' : '#9ca3af'}">$${totalBilledAmt.toFixed(2)}</div>
      <div class="sub">${totalBilledAmt > 0 ? 'Overage cost' : 'Tidak ada extra'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:36px;text-align:center">#</th>
        <th>Pengguna</th>
        <th>Editor</th>
        <th>Terakhir Aktif</th>
        <th>Request Quota</th>
        <th style="text-align:center">Produktivitas</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="footer">
    License OS · Copilot Usage Analytics · Data ini bersifat konfidensial dan hanya untuk keperluan internal.
  </div>

  <script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`;

    win.document.write(html);
    win.document.close();
  }

  function exportRecommendationsPDF(
    recs: ApiCopilotRecommendationsRes['recommendations'],
    sum: ApiCopilotRecommendationsRes['summary'],
  ) {
    const win = window.open('', '_blank', 'width=1100,height=800');
    if (!win) return;

    const generatedAt = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

    const severityBadge = (s: string) => {
      const map: Record<string, string> = { high: '#e26161', medium: '#f2a84e', low: '#4ba895' };
      return `<span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:0.72rem;font-weight:700;background:${map[s] ?? '#888'}22;color:${map[s] ?? '#888'};text-transform:capitalize">${s}</span>`;
    };

    const issueBadge = (label: string, color: string) => {
      const map: Record<string, string> = { red: '#e26161', yellow: '#f2a84e', green: '#4ba895' };
      const c = map[color] ?? '#888';
      return `<span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:0.72rem;font-weight:700;background:${c}22;color:${c}">${label}</span>`;
    };

    const rows = recs.map((rec, idx) => {
      const actCell = rec.activity.lastActivityAt
        ? `${rec.activity.editorParsed ?? '—'}<br><small style="color:#888">${rec.activity.daysSinceActivity} hari lalu</small>${rec.activity.copilotExtension ? `<br><small style="color:#f2a84e">${rec.activity.copilotExtension}</small>` : ''}`
        : `<span style="color:#888">Belum pernah aktif</span><br><small style="color:#888">Seat dibuat ${rec.activity.daysSinceSeatCreated} hari lalu</small>`;

      return `
        <tr style="border-bottom:1px solid #e5e7eb">
          <td style="text-align:center;color:#9ca3af;padding:10px 8px">${idx + 1}</td>
          <td style="padding:10px 8px">
            <strong>${rec.user.name}</strong><br>
            <span style="font-size:0.75rem;color:#6b7280;font-family:monospace">@${rec.user.githubLogin || rec.user.email}</span><br>
            <span style="font-size:0.72rem;color:#9ca3af">${rec.user.email}</span>
          </td>
          <td style="padding:10px 8px;font-size:0.82rem">${actCell}</td>
          <td style="padding:10px 8px">
            ${issueBadge(rec.issue.label, rec.issue.badgeColor)}<br>
            <span style="font-size:0.72rem;color:#6b7280;display:block;margin-top:4px;max-width:220px">${rec.issue.description}</span>
          </td>
          <td style="padding:10px 8px">
            <strong style="font-size:0.85rem">${rec.recommendation.label}</strong><br>
            <span style="font-size:0.72rem;color:#6b7280;display:block;margin-top:3px;max-width:220px">${rec.recommendation.description}</span>
          </td>
          <td style="text-align:center;padding:10px 8px">${severityBadge(rec.severity)}</td>
          <td style="text-align:right;padding:10px 8px;font-weight:700;color:${rec.potentialSavingsUsd > 0 ? '#dc2626' : '#9ca3af'}">${rec.potentialSavingsLabel}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Copilot Seat Recommendations — ${generatedAt}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #111827; background: #fff; padding: 32px 40px; }
    h1 { font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .meta { font-size: 0.75rem; color: #6b7280; margin-bottom: 24px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
    .summary-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; }
    .summary-card .lbl { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; }
    .summary-card .val { font-size: 1.4rem; font-weight: 700; color: #111827; }
    .summary-card .sub { font-size: 0.7rem; color: #9ca3af; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f9fafb; }
    th { padding: 10px 8px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; text-align: left; border-bottom: 2px solid #e5e7eb; }
    tr:hover td { background: #f9fafb; }
    .footer { margin-top: 24px; font-size: 0.72rem; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
    @media print {
      body { padding: 16px; }
      @page { margin: 16mm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <h1>Copilot Seat Recommendations</h1>
  <div class="meta">Digenerate pada ${generatedAt} &nbsp;·&nbsp; ${recs.length} rekomendasi aktif</div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="lbl">Total Seats</div>
      <div class="val">${sum.totalSeats}</div>
      <div class="sub">${sum.healthySeats} sehat · ${sum.totalFlagged} bermasalah</div>
    </div>
    <div class="summary-card" style="border-color:#fca5a5">
      <div class="lbl">Potensi Hemat</div>
      <div class="val" style="color:#dc2626">${sum.totalPotentialSavingsLabel}</div>
      <div class="sub">$${sum.totalPotentialSavingsUsd} USD / bulan</div>
    </div>
    <div class="summary-card">
      <div class="lbl">Revoke / Review</div>
      <div class="val">${sum.byType.revoke.count + sum.byType.review.count}</div>
      <div class="sub">${sum.byType.revoke.count} revoke · ${sum.byType.review.count} review</div>
    </div>
    <div class="summary-card">
      <div class="lbl">Wastage</div>
      <div class="val" style="color:#f59e0b">${sum.wastagePercent.toFixed(1)}%</div>
      <div class="sub">dari total ${sum.totalSeats} seat aktif</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:36px;text-align:center">#</th>
        <th>User</th>
        <th>Aktivitas Terakhir</th>
        <th>Issue</th>
        <th>Rekomendasi</th>
        <th style="text-align:center">Severity</th>
        <th style="text-align:right">Potensi Hemat</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    License OS · Copilot Enterprise Focus · Data ini bersifat konfidensial dan hanya untuk keperluan internal.
  </div>

  <script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`;

    win.document.write(html);
    win.document.close();
  }

  if (loading) {
    return (
      <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Loading GitHub Data...</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="panel-title">Copilot Analytics Dashboard</div>
        <div className="topbar-actions">
          {showSyncBtn && (
            <>
              <button
                className="btn btn-outline"
                onClick={() => setShowImportModal(true)}
              >
                📤 Import Billing
              </button>
              <button 
                className="btn btn-outline" 
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? 'Syncing...' : 'Sync Data'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="filter-toolbar">
        <div className="role-switcher" style={{ marginBottom: 0, border: 'none', background: 'transparent', padding: 0 }}>
          <button 
            className={`role-tab ${activeTab === 'member' ? 'active' : ''}`}
            onClick={() => setActiveTab('member')}
          >
            Member & Aktivitas
          </button>
          <button 
            className={`role-tab ${activeTab === 'usage' ? 'active' : ''}`}
            onClick={() => setActiveTab('usage')}
          >
            Usage Analytics
          </button>
          <button 
            className={`role-tab ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            Rekomendasi
          </button>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {activeTab === 'member' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Last Active</th>
                  <th>Copilot Seat</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {memberActivity.map((row, idx) => (
                  <tr key={row.email}>
                    <td style={{ color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'center' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{row.name}</div>
                    </td>
                    <td>{row.email}</td>
                    <td>{row.lastActiveLabel}</td>
                    
                    <td style={{ color: row.copilotSeatActive ? 'var(--accent2)' : 'var(--danger)', fontWeight: 500 }}>
                      {row.copilotSeat}
                    </td>
                    
                    <td>
                      <span className={`badge`} style={{
                        background: row.statusColor === 'green' ? 'rgba(75, 168, 149, 0.15)' : 
                                  row.statusColor === 'yellow' ? 'rgba(242, 168, 78, 0.12)' : 
                                  'rgba(226, 97, 97, 0.15)',
                        color: row.statusColor === 'green' ? 'var(--accent2)' : 
                               row.statusColor === 'yellow' ? 'var(--accent3)' : 
                               'var(--danger)'
                      }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ color: row.aksi.includes('Revoke') ? 'var(--danger)' : 'var(--muted)', cursor: 'pointer', fontWeight: 500 }}>
                      {row.aksi}
                    </td>
                  </tr>
                ))}
                {memberActivity.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'usage' && (() => {
          // ── Compute totals from per-user data (only real imported data) ──
          const usersWithRealData = copilotUsage.filter((r) => r.hasRealBillingData);
          const entTotalReq    = usersWithRealData.reduce((s, r) => s + (r.usageBreakdown?.includedRequests ?? 0), 0);
          const entTotalBilled = usersWithRealData.reduce((s, r) => s + (r.usageBreakdown?.billedRequests ?? 0), 0);
          const entGross       = usersWithRealData.reduce((s, r) => s + (r.usageBreakdown?.grossAmount ?? 0), 0);
          const entBilled      = usersWithRealData.reduce((s, r) => s + (r.usageBreakdown?.billedAmount ?? 0), 0);
          const entMaxReq      = usersWithRealData.reduce((s, r) => s + (r.usageBreakdown?.includedRequestsMax ?? 0), 0);
          const entUsedPct     = entMaxReq > 0 ? Math.min(100, (entTotalReq / entMaxReq) * 100) : 0;

          return (
          <div>

            {/* ── Ringkasan dari Import Data Per User ──────────────────── */}
            {copilotUsage.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 16,
                padding: '14px 16px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Total Users</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                    {copilotUsage.length}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 2 }}>pengguna aktif</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Total Requests</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                    {entTotalReq.toLocaleString()}
                  </div>
                  <div style={{ height: 3, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 6 }}>
                    <div style={{ height: '100%', width: `${entUsedPct}%`, background: entUsedPct >= 80 ? 'var(--accent3)' : 'var(--accent2)', borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 3 }}>{entUsedPct.toFixed(1)}% dari {entMaxReq.toLocaleString()} maks</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Billed Requests</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: entTotalBilled > 0 ? 'var(--danger)' : 'var(--muted)' }}>
                    {entTotalBilled.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: entTotalBilled > 0 ? 'var(--danger)' : 'var(--muted)', marginTop: 2 }}>
                    {entTotalBilled > 0 ? 'Ada overage!' : 'Tidak ada overage'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Gross Cost</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent3)' }}>
                    ${entGross.toFixed(2)}
                  </div>
                  {entBilled > 0 && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--danger)', marginTop: 2 }}>
                      +${entBilled.toFixed(2)} billed extra
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: usersWithRealData.length > 0 ? 'var(--accent2)' : 'var(--accent3)', fontWeight: 600 }}>
                    {usersWithRealData.length > 0 ? '✅ Data per User' : '⚠️ Belum ada data import'}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 3 }}>
                    {usersWithRealData.length > 0
                      ? `${usersWithRealData.length}/${copilotUsage.length} user real data`
                      : 'Import CSV/Image untuk data aktual'}
                  </div>
                </div>
              </div>
            )}

            {/* ── Per-User Usage Table ────────────────────────────────── */}
            <div>
              {/* Table toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {copilotUsage.length} pengguna
                  {usersWithRealData.length > 0 && (
                    <> · <span style={{ color: '#3b82f6' }}>{usersWithRealData.length} real data</span></>
                  )}
                </div>
                {copilotUsage.length > 0 && (
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.78rem', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => exportUsagePDF(copilotUsage)}
                  >
                    ⬇ Export PDF
                  </button>
                )}
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr 1fr 1fr 1fr 1fr 32px',
                gap: '0 8px',
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid var(--border)',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                <span style={{ textAlign: 'center' }}>#</span>
                <span>Pengguna</span>
                <span>Editor / Extension</span>
                <span>Terakhir Aktif</span>
                <span>Request Quota</span>
                <span>Produktivitas</span>
                <span></span>
              </div>

              {copilotUsage.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  Tidak ada data tersedia
                </div>
              )}

              {copilotUsage.map((row, idx) => {
                const isExpanded = expandedUsageRow === row.email;
                const bd = row.usageBreakdown;
                const hasReal = row.hasRealBillingData || bd?.hasRealData;
                const usedPct = bd ? Math.min(100, (bd.includedRequests / (bd.includedRequestsMax || 1000)) * 100) : (row.usageEfficiency ?? 0);
                const prodBg  = row.produktivitasColor === 'green' ? 'rgba(75,168,149,0.15)' : row.produktivitasColor === 'yellow' ? 'rgba(242,168,78,0.12)' : row.produktivitasColor === 'gray' ? 'rgba(128,128,128,0.1)' : 'rgba(226,97,97,0.15)';
                const prodClr = row.produktivitasColor === 'green' ? 'var(--accent2)' : row.produktivitasColor === 'yellow' ? 'var(--accent3)' : row.produktivitasColor === 'gray' ? 'var(--muted)' : 'var(--danger)';
                const barClr  = usedPct >= 80 ? 'var(--accent3)' : usedPct >= 40 ? 'var(--accent2)' : 'var(--muted)';

                return (
                  <div key={row.email} style={{ borderBottom: idx < copilotUsage.length - 1 || isExpanded ? '1px solid var(--border)' : 'none' }}>
                    {/* Main Row */}
                    <div
                      onClick={() => setExpandedUsageRow(isExpanded ? null : row.email)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '36px 1fr 1fr 1fr 1fr 1fr 32px',
                        gap: '0 8px',
                        padding: '12px 16px',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        background: isExpanded ? 'rgba(75,168,149,0.04)' : 'transparent',
                      }}
                      onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)'; }}
                      onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      {/* # */}
                      <span style={{ color: 'var(--muted)', fontSize: '0.78rem', textAlign: 'center' }}>{idx + 1}</span>

                      {/* User */}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{row.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                          @{row.githubLogin || row.email}
                        </div>
                        {row.planType && (
                          <span style={{
                            display: 'inline-block', marginTop: 3,
                            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em',
                            padding: '1px 6px', borderRadius: '99px',
                            background: 'rgba(75,168,149,0.12)', color: 'var(--accent2)',
                            textTransform: 'uppercase',
                          }}>{row.planType}</span>
                        )}
                        {hasReal && (
                          <span style={{
                            display: 'inline-block', marginTop: 3, marginLeft: 4,
                            fontSize: '0.6rem', fontWeight: 700,
                            padding: '1px 5px', borderRadius: '99px',
                            background: 'rgba(59,130,246,0.12)', color: '#3b82f6',
                          }}>REAL</span>
                        )}
                      </div>

                      {/* Editor */}
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{row.editor}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                          {row.editorVersion || '—'}
                        </div>
                        {row.copilotExtension && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent3)', marginTop: 1 }}>ext {row.copilotExtension}</div>
                        )}
                      </div>

                      {/* Last Active */}
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{row.lastLoginLabel}</div>
                        {row.daysSinceActivity !== null && row.daysSinceActivity !== undefined ? (
                          <div style={{ fontSize: '0.7rem', color: row.daysSinceActivity === 0 ? 'var(--accent2)' : row.daysSinceActivity > 7 ? 'var(--accent3)' : 'var(--muted)', marginTop: 1 }}>
                            {row.daysSinceActivity === 0 ? '🟢 Aktif hari ini' : `${row.daysSinceActivity}h sejak aktivitas`}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 1 }}>Tidak ada data seat</div>
                        )}
                        {row.licenseDays > 0 && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 1 }}>
                            Est. aktif: <strong style={{ color: 'var(--text)' }}>{row.estimatedActiveDays ?? '—'}</strong> / {row.licenseDays} hari
                          </div>
                        )}
                      </div>

                      {/* Request Quota Progress */}
                      <div style={{ paddingRight: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 4 }}>
                          <span style={{ color: hasReal ? 'var(--text)' : 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                            {(bd?.includedRequests ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} req
                          </span>
                          <span style={{ color: 'var(--muted)' }}>/ {(bd?.includedRequestsMax ?? 1000).toLocaleString()}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${usedPct}%`, background: hasReal ? barClr : 'rgba(128,128,128,0.3)', borderRadius: 4, transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 3 }}>
                          Gross: <strong style={{ color: hasReal ? 'var(--text)' : 'var(--muted)' }}>${(bd?.grossAmount ?? 0).toFixed(2)}</strong>
                          {bd && bd.billedAmount > 0 && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>+${bd.billedAmount.toFixed(2)} billed</span>}
                        </div>
                      </div>

                      {/* Produktivitas */}
                      <div>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px',
                          borderRadius: '99px', fontSize: '0.78rem', fontWeight: 600,
                          background: prodBg, color: prodClr,
                        }}>
                          {row.produktivitas}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>{row.usageEfficiency}% efisiensi</div>
                      </div>

                      {/* Expand chevron */}
                      <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                        ▾
                      </div>
                    </div>

                    {/* Expanded — Per-User Billing Detail */}
                    {isExpanded && bd && (
                      <div style={{
                        padding: '0 16px 16px 52px',
                        background: 'rgba(75,168,149,0.02)',
                        borderTop: '1px solid rgba(75,168,149,0.1)',
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: hasReal ? '#3b82f6' : 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, marginTop: 14 }}>
                          {hasReal ? '📊 BILLING DATA — Import Per User' : '📊 BILLING DATA'}
                        </div>

                        {/* Billing detail grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: bd.models.length > 0 ? 14 : 0 }}>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 12px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 3 }}>Included Requests</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{bd.includedRequests.toFixed(1)}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>/ {bd.includedRequestsMax} maks</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 12px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 3 }}>Billed Requests</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: bd.billedRequests > 0 ? 'var(--danger)' : 'var(--muted)' }}>{bd.billedRequests}</div>
                            <div style={{ fontSize: '0.65rem', color: bd.billedRequests > 0 ? 'var(--danger)' : 'var(--muted)' }}>{bd.billedRequests > 0 ? 'Overage!' : 'Tidak ada overage'}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 12px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 3 }}>Gross Amount</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent3)' }}>${bd.grossAmount.toFixed(2)}</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 12px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 3 }}>Billed Amount</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: bd.billedAmount > 0 ? 'var(--danger)' : 'var(--muted)' }}>
                              {bd.billedAmount > 0 ? `$${bd.billedAmount.toFixed(2)}` : '$0.00'}
                            </div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 12px' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 3 }}>Usage</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{usedPct.toFixed(1)}%</div>
                            <div style={{ height: 3, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 4 }}>
                              <div style={{ height: '100%', width: `${usedPct}%`, background: barClr, borderRadius: 4 }} />
                            </div>
                          </div>
                        </div>

                        {/* Model breakdown if available */}
                        {bd.models.length > 0 && (
                          <>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Model Breakdown</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 100px', gap: '0 8px', fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 6 }}>
                              <span>Model</span>
                              <span style={{ textAlign: 'right' }}>Incl. Req</span>
                              <span style={{ textAlign: 'right' }}>Billed Req</span>
                              <span style={{ textAlign: 'right' }}>Gross $</span>
                              <span style={{ textAlign: 'right' }}>Billed $</span>
                            </div>
                            {bd.models.map((m: ApiCopilotUsageModel, mi: number) => (
                              <div key={mi} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 100px', gap: '0 8px', fontSize: '0.8rem', padding: '5px 0', borderBottom: mi < bd.models.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}>
                                <span style={{ fontWeight: 500 }}>{m.modelName}</span>
                                <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{m.includedRequests.toFixed(2)}</span>
                                <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: m.billedRequests > 0 ? 'var(--danger)' : 'var(--muted)' }}>{m.billedRequests.toFixed(2)}</span>
                                <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent3)' }}>${m.grossAmount.toFixed(2)}</span>
                                <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: m.billedAmount > 0 ? 'var(--danger)' : 'var(--muted)' }}>
                                  {m.billedAmount > 0 ? `$${m.billedAmount.toFixed(2)}` : '—'}
                                </span>
                              </div>
                            ))}
                          </>
                        )}

                        {/* Data source indicator */}
                        <div style={{ marginTop: 10, fontSize: '0.65rem', color: 'var(--muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
                          {hasReal ? (
                            <>✅ Data ini dari <strong style={{ color: '#3b82f6' }}>import CSV/Image</strong> (data aktual dari GitHub billing page)</>
                          ) : (
                            <>⚠️ Belum ada data billing untuk user ini. <strong>Import data</strong> via CSV/Image untuk melihat usage per user.</>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          </div>
          );
        })()}

        {activeTab === 'recommendations' && (
          <div>
            {/* ── Summary metric cards ───────────────────────────────── */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div className="metric-card" style={{ flex: '1 1 140px', border: '1px solid rgba(226,97,97,0.35)', background: 'rgba(226,97,97,0.07)' }}>
                <div className="metric-label">Potensi Hemat / Bulan</div>
                <div className="metric-value" style={{ color: 'var(--danger)' }}>{summary.totalPotentialSavingsLabel}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 2 }}>${summary.totalPotentialSavingsUsd} USD</div>
              </div>
              <div className="metric-card" style={{ flex: '1 1 140px', border: '1px solid rgba(226,97,97,0.3)', background: 'rgba(226,97,97,0.05)' }}>
                <div className="metric-label">Revoke 🔴</div>
                <div className="metric-value">{summary.byType.revoke.count}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 2 }}>hemat ${summary.byType.revoke.savingsUsd}/bln</div>
              </div>
              <div className="metric-card" style={{ flex: '1 1 140px', border: '1px solid rgba(242,168,78,0.3)', background: 'rgba(242,168,78,0.06)' }}>
                <div className="metric-label">Review 🟡</div>
                <div className="metric-value" style={{ color: 'var(--accent3)' }}>{summary.byType.review.count}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 2 }}>hemat ${summary.byType.review.savingsUsd}/bln</div>
              </div>
              <div className="metric-card" style={{ flex: '1 1 140px', border: '1px solid rgba(242,168,78,0.3)', background: 'rgba(242,168,78,0.06)' }}>
                <div className="metric-label">Produktivitas Rendah 🟡</div>
                <div className="metric-value" style={{ color: 'var(--accent3)' }}>{summary.byType.low_productivity.count}</div>
              </div>
              <div className="metric-card" style={{ flex: '1 1 140px' }}>
                <div className="metric-label">Seat Sehat</div>
                <div className="metric-value" style={{ color: 'var(--accent2)' }}>{summary.healthySeats}<span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>/{summary.totalSeats}</span></div>
                <div style={{ fontSize: '0.68rem', color: summary.wastagePercent > 20 ? 'var(--danger)' : 'var(--muted)', marginTop: 2 }}>{summary.wastagePercent.toFixed(1)}% wastage</div>
              </div>
            </div>

            {/* ── Table header row with export button ───────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                {summary.totalFlagged} seat bermasalah · <span style={{ color: 'var(--danger)' }}>{summary.bySeverity.high} high</span> · <span style={{ color: 'var(--accent3)' }}>{summary.bySeverity.medium} medium</span> · <span style={{ color: 'var(--accent2)' }}>{summary.bySeverity.low} low</span>
              </div>
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.78rem', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => exportRecommendationsPDF(actionRecommendations, summary)}
              >
                ⬇ Export PDF
              </button>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                    <th>User</th>
                    <th>Aktivitas Terakhir</th>
                    <th>Issue</th>
                    <th>Rekomendasi</th>
                    <th style={{ textAlign: 'center' }}>Severity</th>
                    <th>Potensi Hemat</th>
                  </tr>
                </thead>
                <tbody>
                  {actionRecommendations.map((row, idx) => {
                    const badgeColor = row.issue.badgeColor === 'red'
                      ? { bg: 'rgba(226,97,97,0.15)', color: 'var(--danger)' }
                      : row.issue.badgeColor === 'yellow'
                      ? { bg: 'rgba(242,168,78,0.12)', color: 'var(--accent3)' }
                      : { bg: 'rgba(75,168,149,0.12)', color: 'var(--accent2)' };

                    const severityStyle = row.severity === 'high'
                      ? { bg: 'rgba(226,97,97,0.15)', color: 'var(--danger)' }
                      : row.severity === 'medium'
                      ? { bg: 'rgba(242,168,78,0.12)', color: 'var(--accent3)' }
                      : { bg: 'rgba(75,168,149,0.1)', color: 'var(--accent2)' };

                    return (
                      <tr key={`${row.user.email}-${idx}`}>
                        <td style={{ color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'center' }}>{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{row.user.name}</div>
                          <div className="td-mono" style={{ fontSize: '0.72rem' }}>@{row.user.githubLogin || row.user.email}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 1 }}>{row.user.email}</div>
                        </td>
                        <td>
                          {row.activity.lastActivityAt ? (
                            <>
                              <div style={{ fontSize: '0.83rem' }}>{row.activity.editorParsed ?? row.activity.lastActivityEditor}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 1 }}>
                                {row.activity.daysSinceActivity !== null
                                  ? `${row.activity.daysSinceActivity} hari yang lalu`
                                  : new Date(row.activity.lastActivityAt).toLocaleDateString('id-ID')}
                              </div>
                              {row.activity.copilotExtension && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent3)', marginTop: 1 }}>
                                  {row.activity.copilotExtension}
                                </div>
                              )}
                            </>
                          ) : (
                            <div style={{ fontSize: '0.83rem', color: 'var(--muted)' }}>
                              Belum pernah aktif
                              <div style={{ fontSize: '0.7rem', marginTop: 2 }}>
                                Seat dibuat {row.activity.daysSinceSeatCreated} hari lalu
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge" style={{ background: badgeColor.bg, color: badgeColor.color, whiteSpace: 'nowrap', marginBottom: 4, display: 'inline-block' }}>
                            {row.issue.label}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4, maxWidth: 280 }}>{row.issue.description}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{row.recommendation.label}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 3, maxWidth: 260 }}>{row.recommendation.description}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge" style={{ background: severityStyle.bg, color: severityStyle.color, textTransform: 'capitalize' }}>
                            {row.severity}
                          </span>
                        </td>
                        <td style={{ color: row.potentialSavingsUsd > 0 ? 'var(--danger)' : 'var(--muted)', fontWeight: row.potentialSavingsUsd > 0 ? 600 : 400 }}>
                          {row.potentialSavingsLabel}
                        </td>
                      </tr>
                    );
                  })}
                  {actionRecommendations.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>No recommendations</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Import Billing Modal ──────────────────────────────────── */}
      {showImportModal && (
        <div className="modal-overlay" onClick={resetImportModal}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>📤 Import User Billing Data</h3>
              <button className="modal-close" onClick={resetImportModal}>✕</button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {/* Mode Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  className={`btn ${importMode === 'csv' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, fontSize: '0.82rem' }}
                  onClick={() => setImportMode('csv')}
                >
                  📋 Paste CSV
                </button>
                <button
                  className={`btn ${importMode === 'image' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, fontSize: '0.82rem' }}
                  onClick={() => setImportMode('image')}
                >
                  🖼️ Upload Image
                </button>
              </div>

              {/* Month selector */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Bulan (opsional)</label>
                <input
                  type="month"
                  className="form-input"
                  value={importMonth}
                  onChange={(e) => setImportMonth(e.target.value)}
                  placeholder="Auto-detect (bulan ini)"
                  style={{ fontSize: '0.85rem' }}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>
                  Kosongkan untuk menggunakan bulan berjalan
                </div>
              </div>

              {/* CSV Mode */}
              {importMode === 'csv' && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>CSV Data</label>
                  <textarea
                    className="form-input"
                    rows={10}
                    value={importCsvText}
                    onChange={(e) => setImportCsvText(e.target.value)}
                    placeholder={`User,Included requests,Billed requests,Gross amount,Billed amount\n90168772_derrydes,"485.60/1,000",0,$19.42,$0.00\n90185156_derrydes,"219/1,000",0,$8.76,$0.00`}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      lineHeight: 1.5,
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>
                    Paste langsung dari GitHub Copilot billing page. Header baris pertama akan di-skip otomatis.
                  </div>
                </div>
              )}

              {/* Image Mode */}
              {importMode === 'image' && (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Screenshot Billing</label>
                  <div
                    style={{
                      border: '2px dashed var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '24px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: importFile ? 'rgba(75,168,149,0.04)' : 'transparent',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => document.getElementById('billing-image-input')?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const f = e.dataTransfer.files[0];
                      if (f && f.type.startsWith('image/')) setImportFile(f);
                    }}
                  >
                    <input
                      id="billing-image-input"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setImportFile(f);
                      }}
                    />
                    {importFile ? (
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent2)' }}>
                          ✓ {importFile.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
                          {(importFile.size / 1024).toFixed(1)} KB · Klik untuk ganti
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🖼️</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                          Klik atau drag & drop screenshot billing
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
                          Mendukung PNG, JPG, WEBP (maks 10 MB)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {importError && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(226,97,97,0.1)',
                  border: '1px solid rgba(226,97,97,0.3)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--danger)',
                  fontSize: '0.82rem',
                  marginTop: 12,
                }}>
                  ❌ {importError}
                </div>
              )}

              {/* Success Result */}
              {importResult && (
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(75,168,149,0.08)',
                  border: '1px solid rgba(75,168,149,0.3)',
                  borderRadius: 'var(--radius)',
                  marginTop: 12,
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent2)', marginBottom: 6 }}>
                    ✅ Import Berhasil!
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text)' }}>
                    <strong>{importResult.imported}</strong> user diimport
                    {importResult.skipped > 0 && (
                      <span style={{ color: 'var(--accent3)', marginLeft: 8 }}>
                        · {importResult.skipped} di-skip
                      </span>
                    )}
                    <span style={{ color: 'var(--muted)', marginLeft: 8 }}>
                      · Bulan: {importResult.month}
                    </span>
                  </div>
                  {importResult.ocrPreview && (
                    <details style={{ marginTop: 8 }}>
                      <summary style={{ fontSize: '0.72rem', color: 'var(--muted)', cursor: 'pointer' }}>
                        OCR Preview
                      </summary>
                      <pre style={{
                        fontSize: '0.7rem',
                        color: 'var(--muted)',
                        background: 'rgba(0,0,0,0.15)',
                        padding: 8,
                        borderRadius: 'var(--radius)',
                        marginTop: 4,
                        maxHeight: 120,
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {importResult.ocrPreview}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              padding: '12px 20px',
              borderTop: '1px solid var(--border)',
            }}>
              <button className="btn btn-outline" onClick={resetImportModal}>
                {importResult ? 'Tutup' : 'Batal'}
              </button>
              {!importResult && (
                <button
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? 'Importing...' : '📤 Import'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
