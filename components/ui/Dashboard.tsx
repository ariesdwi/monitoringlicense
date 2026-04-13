'use client';

import type { ApiRequest, ApiMetric, ApiActivity } from '@/lib/services';
import ActivityFeed from './ActivityFeed';
import QuotaPanel from './QuotaPanel';
import RequestsPanel from './RequestsPanel';
import { RoleKey } from './Sidebar';
import type { ApiQuota, ApiLicense, ApiAiTool } from '@/lib/services';

type MetricView = 'tl' | 'admin' | 'ciso' | 'iga' | 'idm';

interface DashboardProps {
  roleView: MetricView;
  roleKey: RoleKey;
  currentTL: string;
  requests: ApiRequest[];
  metrics: ApiMetric[];
  activities: ApiActivity[];
  licenses: ApiLicense[];
  quotas: ApiQuota[];
  aiTools: ApiAiTool[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

const ROLE_WELCOME: Record<RoleKey, { name: string; desc: string; color: string }> = {
  admin: { name: 'Admin View', desc: 'Full access — manage all licenses, approve requests, update quotas', color: 'var(--accent2)' },
  tl:    { name: 'TL View', desc: "Your team's licenses and quota — submit requests for your members", color: 'var(--info)' },
  ciso:  { name: 'CISO View', desc: 'Security oversight — create accounts, revoke access, audit history', color: 'var(--accent3)' },
  iga:   { name: 'IGA View', desc: 'Identity & Group Access — invite users to identity groups after account creation', color: 'var(--purple)' },
  idm:   { name: 'Head of IDM Report', desc: 'Department overview — executive report for license progress and allocation', color: 'var(--teal)' },
};

export default function Dashboard({ roleView, roleKey, currentTL, requests, metrics, activities, licenses, quotas, aiTools, onApprove, onReject }: DashboardProps) {
  const welcome = ROLE_WELCOME[roleKey];

  return (
    <>
      {/* Role context banner */}
      <div style={{
        padding: '12px 18px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${welcome.color}`,
        borderRadius: 'var(--radius)',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: welcome.color, fontFamily: 'var(--font-display)' }}>
            {welcome.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{welcome.desc}</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics">
        {metrics.map((m, i) => (
          <div key={i} className={`metric-card ${m.cls}`}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-sub">
              {m.delta && (
                <span className={`delta ${m.up ? 'delta-up' : 'delta-down'}`}>
                  {m.up ? '↑' : '↓'} {m.delta}
                </span>
              )}
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid-3-1" style={{ marginBottom: 14 }}>
        {roleKey !== 'ciso' && roleKey !== 'iga' && roleKey !== 'idm' ? (
          <RequestsPanel
            requests={requests}
            roleKey={roleKey}
            onApprove={onApprove}
            onReject={onReject}
            inline
          />
        ) : roleKey !== 'idm' ? (
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Your Workflow</span>
            </div>
            <div style={{ padding: '20px' }}>
              {roleKey === 'ciso' && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent3)', marginBottom: 4 }}>
                      ① SUBMITTED → Create Account
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                      When Admin approves a request, it moves to SUBMITTED. Go to <strong style={{ color: 'var(--text)' }}>Licenses</strong> and click <em>Create Acc</em> to provision the account.
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)', marginBottom: 4 }}>
                      ② Revoke Access
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                      Use the <strong style={{ color: 'var(--text)' }}>Licenses</strong> page to revoke any user&apos;s license — e.g. when they resign.
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)', marginBottom: 4 }}>
                      ③ Audit History
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                      Review all license actions in the <strong style={{ color: 'var(--text)' }}>History</strong> page.
                    </div>
                  </div>
                </>
              )}
              {roleKey === 'iga' && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)', marginBottom: 4 }}>
                      ① PENDING_IGA → Invite to Group
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                      After CISO creates the account, go to <strong style={{ color: 'var(--text)' }}>Licenses</strong> and click <em>Invite to Group</em> to add the user to the correct identity group.
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--info)', marginBottom: 4 }}>
                      ② Account Created
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                      Once invited, the license moves to ACCOUNT_CREATED and Admin can assign it to the user.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
        {roleKey === 'idm' && (
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="panel-header">
               <span className="panel-title">Executive Summary</span>
            </div>
            <div style={{ padding: 20, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
               This is a read-only executive view of the AI License progress. You can review the global metrics above or see the detailed activity feed on the right, and explore all license assignments in the Licenses tab.
            </div>
          </div>
        )}
        <ActivityFeed activities={activities} />
      </div>

      {/* Quota & AI Tools (not shown for CISO or IGA) */}
      {roleKey !== 'ciso' && roleKey !== 'iga' && roleKey !== 'idm' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14 }}>
          <QuotaPanel 
            roleKey={roleKey} 
            currentTL={currentTL} 
            quotas={quotas} 
            aiTools={aiTools}
            licenses={licenses}
            isCompact={true}
          />
          
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">AI Tools Status</span>
              <span className="td-mono">{aiTools.length} tools</span>
            </div>
            {aiTools.length === 0 && (
              <div className="empty-state">No AI Tools found.</div>
            )}
            <div style={{ padding: '0 0 10px 0' }}>
              {aiTools.map(t => {
                const used = t.usedQuota || 0;
                const total = t.totalQuota || 0;
                const pct = total > 0 ? used / total : 0;
                const barColor = pct >= 0.9 ? 'qfill-red' : pct >= 0.6 ? 'qfill-orange' : 'qfill-green';
                
                return (
                  <div key={t.id} className="quota-row">
                    <div>
                      <div className="quota-name">{t.name}</div>
                      <div className="quota-name-sub">Global Seat Usage</div>
                    </div>
                    <div className="quota-bar-track">
                      <div
                        className={`quota-bar-fill ${barColor}`}
                        style={{ width: `${Math.min(pct * 100, 100)}%` }}
                      />
                    </div>
                    <div className="quota-nums">{used}/{total === 0 ? '∞' : total}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
