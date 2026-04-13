// ─── Domain API Services ──────────────────────────────────────────────────────
// All calls use apiFetch which automatically attaches the Bearer JWT.
// On network errors, each function falls back to mock data so the UI
// stays functional during offline / dev sessions.

import { apiFetch, apiUpload, ApiError } from '@/lib/api';
import {
  METRICS, ACTIVITIES, INITIAL_LICENSES, INITIAL_REQUESTS,
  QUOTA, HISTORY, TEAM_APP_ALLOC
} from '@/lib/mockData';

// ─── Shared API response types (mirrors the backend API doc) ─────────────────

export interface ApiMetric {
  label: string;
  value: string;
  sub: string;
  delta: string;
  up: boolean;
  cls: string;
}

export interface ApiActivity {
  id: number;
  icon: string;
  cls: string;
  text: string;
  time: string;
  createdAt: string;
}

export interface ApiTeam {
  id: number;
  name: string;
  tlName: string;
  maxQuota: number;
}

export interface ApiRequest {
  id: number;
  userName: string;
  userType: string;
  tlName: string;
  teamId: number;
  departemen: string;
  aplikasi: string;
  squad: string;
  date: string;
  reason: string;
  aiTool: string;
  team: ApiTeam;
}

export interface ApiLicense {
  id: number;
  userName: string;
  email: string;
  userType: string;
  departemen: string;
  aplikasi: string;
  squad: string;
  aiTool: string;
  tlName: string;
  teamId: number;
  status: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  team: ApiTeam;
}

export interface ApiQuota {
  id: number;
  tl: string;
  team: string;
  used: number;
  max: number;
  breakdownLabel?: string;
  toolQuotas?: { tool: string; max: number }[];
}

export interface ApiHistory {
  id: number;
  time: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  note: string;
  createdAt: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchMetrics(view: string): Promise<ApiMetric[]> {
  try {
    return await apiFetch<ApiMetric[]>(`/dashboard/metrics/${view}`);
  } catch (err) {
    if (err instanceof TypeError) {
      // Network error — return mock
      const key = view as keyof typeof METRICS;
      return (METRICS[key] ?? METRICS.admin) as ApiMetric[];
    }
    throw err;
  }
}

export async function fetchActivities(): Promise<ApiActivity[]> {
  try {
    return await apiFetch<ApiActivity[]>('/dashboard/activities');
  } catch (err) {
    if (err instanceof TypeError) {
      return ACTIVITIES.map((a, i) => ({
        id: i,
        icon: a.icon,
        cls: a.cls,
        text: a.text,
        time: a.time,
        createdAt: new Date().toISOString(),
      }));
    }
    throw err;
  }
}

// ─── License Requests ─────────────────────────────────────────────────────────

export async function fetchRequests(): Promise<ApiRequest[]> {
  try {
    return await apiFetch<ApiRequest[]>('/requests');
  } catch (err) {
    if (err instanceof TypeError) {
      return INITIAL_REQUESTS.map(r => ({
        id: r.id,
        userName: r.user,
        userType: 'Internal',
        tlName: r.tl,
        teamId: 1,
        departemen: r.departemen,
        aplikasi: r.aplikasi,
        squad: r.squad,
        date: r.date,
        reason: r.reason,
        aiTool: 'Gemini',
        team: { id: 1, name: r.team, tlName: r.tl, maxQuota: 10 },
      }));
    }
    throw err;
  }
}

export async function createRequest(payload: {
  userName: string;
  email: string;
  userType: string;
  departemen: string;
  aplikasi: string;
  squad: string;
  reason: string;
  aiTool: string;
}): Promise<ApiRequest> {
  return apiFetch<ApiRequest>('/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function approveRequest(id: number): Promise<ApiLicense> {
  return apiFetch<ApiLicense>(`/requests/${id}/approve`, { method: 'PATCH' });
}

export async function rejectRequest(id: number): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/requests/${id}/reject`, { method: 'PATCH' });
}

// ─── Licenses ─────────────────────────────────────────────────────────────────

export async function fetchLicenses(): Promise<ApiLicense[]> {
  try {
    return await apiFetch<ApiLicense[]>('/licenses');
  } catch (err) {
    if (err instanceof TypeError) {
      return INITIAL_LICENSES.map(l => ({
        id: l.id,
        userName: l.user,
        email: l.email,
        userType: 'Internal',
        departemen: l.departemen,
        aplikasi: l.aplikasi,
        squad: l.squad,
        aiTool: (l as any).aiTool || '',
        tlName: l.tl,
        teamId: 1,
        status: l.status,
        date: l.date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        team: { id: 1, name: l.team, tlName: l.tl, maxQuota: 10 },
      }));
    }
    throw err;
  }
}

export async function createAccount(id: number): Promise<ApiLicense> {
  return apiFetch<ApiLicense>(`/licenses/${id}/create-account`, { method: 'PATCH' });
}

export async function inviteGroup(id: number): Promise<ApiLicense> {
  return apiFetch<ApiLicense>(`/licenses/${id}/invite-group`, { method: 'PATCH' });
}

export async function assignLicense(id: number, userName?: string): Promise<ApiLicense> {
  return apiFetch<ApiLicense>(`/licenses/${id}/assign`, {
    method: 'PATCH',
    body: userName ? JSON.stringify({ userName }) : undefined,
  });
}

export async function confirmUsage(id: number): Promise<ApiLicense> {
  return apiFetch<ApiLicense>(`/licenses/${id}/confirm-usage`, { method: 'PATCH' });
}

export async function revokeLicense(id: number): Promise<ApiLicense> {
  return apiFetch<ApiLicense>(`/licenses/${id}/revoke`, { method: 'PATCH' });
}

export async function editLicense(id: number, payload: Partial<Omit<ApiLicense, 'id' | 'team' | 'createdAt' | 'updatedAt'>>): Promise<ApiLicense> {
  return apiFetch<ApiLicense>(`/licenses/${id}/edit`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteLicense(id: number): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/licenses/${id}`, { method: 'DELETE' });
}

// ─── Quotas ───────────────────────────────────────────────────────────────────

export async function fetchQuotas(): Promise<ApiQuota[]> {
  try {
    return await apiFetch<ApiQuota[]>('/quotas');
  } catch (err) {
    if (err instanceof TypeError) {
      return QUOTA.map((q, i) => ({ id: i + 1, tl: q.tl, team: q.team, used: q.used, max: q.max }));
    }
    throw err;
  }
}

export async function updateQuota(id: number, maxQuota: number): Promise<{ success: boolean; team?: any }> {
  try {
    return await apiFetch<{ success: boolean; team?: any }>(`/quotas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ maxQuota }),
    });
  } catch (err) {
    if (err instanceof TypeError) {
      if (QUOTA[id - 1]) QUOTA[id - 1].max = maxQuota;
      return { success: true, team: { id, maxQuota } };
    }
    throw err;
  }
}

export async function allocateToolQuota(id: number, aiTool: string, maxQuota: number): Promise<{ success: boolean; team?: any }> {
  return await apiFetch<{ success: boolean; team?: any }>(`/quotas/${id}/allocate`, {
    method: 'PATCH',
    body: JSON.stringify({ aiTool, maxQuota }),
  });
}

// ─── Teams (Leader Onboarding) ────────────────────────────────────────────────

export async function createTeamLeader(payload: {
  teamName: string;
  tlName: string;
  email: string;
  departemen: string;
  aplikasi: string;
  maxQuota: number;
}): Promise<{ id: number; name?: string; tlName?: string; maxQuota?: number }> {
  try {
    return await apiFetch<{ id: number; name?: string; tlName?: string; maxQuota?: number }>('/teams', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err instanceof TypeError) {
      QUOTA.push({
        tl: payload.tlName,
        team: payload.teamName,
        used: 0,
        max: payload.maxQuota,
      });
      TEAM_APP_ALLOC.push({
        team: payload.teamName,
        tl: payload.tlName,
        departemen: payload.departemen,
        aplikasi: [payload.aplikasi],
      });
      return { id: QUOTA.length, name: payload.teamName, tlName: payload.tlName, maxQuota: payload.maxQuota };
    }
    throw err;
  }
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function fetchHistory(): Promise<ApiHistory[]> {
  try {
    return await apiFetch<ApiHistory[]>('/history');
  } catch (err) {
    if (err instanceof TypeError) {
      return HISTORY.map((h, i) => ({
        id: i,
        time: h.time,
        actor: h.actor,
        role: h.role,
        action: h.action,
        target: h.target,
        note: h.note,
        createdAt: new Date().toISOString(),
      }));
    }
    throw err;
  }
}

// ─── AI Impact ────────────────────────────────────────────────────────────────

export interface ApiAiImpact {
  id: number;
  teamId: number;
  tlName: string;
  squad: string;
  aplikasi: string;
  aiTool: string;
  period: string;
  manCount: number;
  daysWithAI: number;
  daysWithoutAI: number;
  sqBugs: number;
  sqVulnerabilities: number;
  sqCodeSmells: number;
  sqCoverage: number;
  sqDuplications: number;
  sqRating: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  team: ApiTeam;
}

export interface ApiImpactSummary {
  totalReports: number;
  avgProductivityGain: number;
  totalManDaysSaved: number;
  avgCoverage: number;
  avgRating: string;
  byTeam: {
    teamId: number;
    teamName: string;
    tlName: string;
    reports: number;
    avgSavingsDays: number;
    avgCoverage: number;
  }[];
}

export async function fetchImpacts(): Promise<ApiAiImpact[]> {
  try {
    return await apiFetch<ApiAiImpact[]>('/ai-impact');
  } catch (err) {
    if (err instanceof TypeError) return [];
    throw err;
  }
}

export async function fetchImpactSummary(): Promise<ApiImpactSummary> {
  try {
    return await apiFetch<ApiImpactSummary>('/ai-impact/summary');
  } catch (err) {
    if (err instanceof TypeError) {
      return { totalReports: 0, avgProductivityGain: 0, totalManDaysSaved: 0, avgCoverage: 0, avgRating: '-', byTeam: [] };
    }
    throw err;
  }
}

export async function createImpact(payload: {
  squad: string;
  aplikasi: string;
  aiTool?: string;
  period: string;
  manCount: number;
  daysWithAI: number;
  daysWithoutAI: number;
  sqBugs?: number;
  sqVulnerabilities?: number;
  sqCodeSmells?: number;
  sqCoverage?: number;
  sqDuplications?: number;
  sqRating?: string;
  notes?: string;
}): Promise<ApiAiImpact> {
  return apiFetch<ApiAiImpact>('/ai-impact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteImpact(id: number): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/ai-impact/${id}`, { method: 'DELETE' });
}

export async function editImpact(id: number, payload: Partial<Parameters<typeof createImpact>[0]>): Promise<ApiAiImpact> {
  return apiFetch<ApiAiImpact>(`/ai-impact/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ─── AI Tools ────────────────────────────────────────────────────────────────

export interface ApiAiTool {
  id: number;
  name: string;
  totalQuota: number;
  usedQuota?: number;
  createdAt: string;
}

export async function fetchAiTools(): Promise<ApiAiTool[]> {
  return await apiFetch<ApiAiTool[]>('/ai-tools');
}

export async function fetchAiToolById(id: number): Promise<ApiAiTool> {
  return apiFetch<ApiAiTool>(`/ai-tools/${id}`);
}

export async function createAiTool(payload: { name: string; totalQuota?: number }): Promise<ApiAiTool> {
  return apiFetch<ApiAiTool>('/ai-tools', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function editAiTool(id: number, payload: { name: string; totalQuota?: number }): Promise<ApiAiTool> {
  return apiFetch<ApiAiTool>(`/ai-tools/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAiTool(id: number): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/ai-tools/${id}`, { method: 'DELETE' });
}

// ─── Copilot Analytics ───────────────────────────────────────────────────────

export interface ApiCopilotMemberActivity {
  email: string;
  name: string;
  lastActiveLabel: string;
  copilotSeatActive: boolean;
  copilotSeat: string;
  status: string;
  statusColor: string;
  aksi: string;
}

export interface ApiCopilotUsageModel {
  modelName: string;
  includedRequests: number;
  billedRequests: number;
  grossAmount: number;
  billedAmount: number;
}

export interface ApiCopilotUsage {
  email: string;
  name: string;
  githubLogin: string;
  editor: string;
  editorVersion: string;
  copilotExtension: string | null;
  editorRaw: string;
  lastLoginLabel: string;
  lastAuthenticatedAt: string;
  lastActivityAt: string;
  daysSinceActivity: number;
  licenseDays: number;
  estimatedActiveDays: number;
  usageEfficiency: number;
  planType: string;
  produktivitas: string;
  produktivitasColor: string;
  hasRealBillingData?: boolean;
  billing?: {
    month: string;
    includedRequests: number;
    includedRequestsMax: number;
    billedRequests: number;
    grossAmount: number;
    billedAmount: number;
    importedAt: string | null;
  };
  usageBreakdown: {
    includedRequests: number;
    includedRequestsMax: number;
    billedRequests: number;
    grossAmount: number;
    billedAmount: number;
    hasRealData?: boolean;
    models: ApiCopilotUsageModel[];
  };
}

export type RecommendationIssueCode =
  | 'NEVER_ACTIVE'
  | 'INACTIVE_90_PLUS'
  | 'INACTIVE_30_89'
  | 'LOW_USAGE_15_29'
  | 'NO_COPILOT_EXT'
  | 'SEAT_MISMATCH';

export type RecommendationType = 'revoke' | 'review' | 'low_productivity' | 'training' | 'sync';

export interface ApiCopilotRecommendation {
  user: {
    email: string;
    name: string;
    githubLogin: string;
  };
  activity: {
    lastActivityAt: string | null;
    lastActivityEditor: string | null;
    editorParsed: string | null;
    copilotExtension: string | null;
    lastAuthenticatedAt: string | null;
    seatCreatedAt: string;
    daysSinceActivity: number | null;
    daysSinceLogin: number | null;
    daysSinceSeatCreated: number;
  };
  issue: {
    code: RecommendationIssueCode;
    label: string;
    badgeColor: 'red' | 'yellow' | 'green';
    description: string;
  };
  recommendation: {
    type: RecommendationType;
    label: string;
    description: string;
  };
  severity: 'high' | 'medium' | 'low';
  potentialSavingsUsd: number;
  potentialSavingsLabel: string;
}

export interface ApiCopilotRecommendationsRes {
  recommendations: ApiCopilotRecommendation[];
  summary: {
    totalSeats: number;
    totalFlagged: number;
    healthySeats: number;
    wastagePercent: number;
    bySeverity: { high: number; medium: number; low: number };
    byType: {
      revoke: { count: number; savingsUsd: number };
      review: { count: number; savingsUsd: number };
      low_productivity: { count: number };
      training: { count: number };
      sync: { count: number };
    };
    totalPotentialSavingsUsd: number;
    totalPotentialSavingsLabel: string;
  };
  generatedAt: string;
}

export interface ApiCopilotOrgMetrics {
  totalSuggestions: number;
  totalAccepted: number;
  acceptanceRate: number;     // percentage 0–100
  totalActiveUsers: number;
  month: string;
  dataAvailable: boolean;
}

export async function fetchCopilotMemberActivity(): Promise<ApiCopilotMemberActivity[]> {
  try {
    return await apiFetch<ApiCopilotMemberActivity[]>('/dashboard/enterprise-focus/member-activity');
  } catch (err) {
    if (err instanceof TypeError) {
      return [
        { email: 'andi@corp.id', name: 'Andi Setiawan', lastActiveLabel: '2 jam yang lalu', copilotSeatActive: true, copilotSeat: 'Active', status: 'Optimal', statusColor: 'green', aksi: '-' },
        { email: 'budi@corp.id', name: 'Budi Raharjo', lastActiveLabel: '14 hari yang lalu', copilotSeatActive: true, copilotSeat: 'Active', status: 'Warning', statusColor: 'yellow', aksi: '-' },
        { email: 'cindy@corp.id', name: 'Cindy Kirana', lastActiveLabel: '45 hari yang lalu', copilotSeatActive: false, copilotSeat: 'Inactive', status: 'Idle', statusColor: 'red', aksi: '❌ Revoke' },
      ];
    }
    throw err;
  }
}

export async function fetchCopilotUsage(): Promise<ApiCopilotUsage[]> {
  try {
    return await apiFetch<ApiCopilotUsage[]>('/dashboard/enterprise-focus/copilot-usage');
  } catch (err) {
    if (err instanceof TypeError) {
      const mockUsage = (email: string, name: string, login: string, editor: string, ev: string, ext: string | null, loginLabel: string, authAt: string, actAt: string, daysSince: number, licenseDays: number, estDays: number, eff: number, plan: string, prod: string, prodColor: string): ApiCopilotUsage => ({
        email, name, githubLogin: login, editor, editorVersion: ev, copilotExtension: ext, editorRaw: `${editor}/${ev}`,
        lastLoginLabel: loginLabel, lastAuthenticatedAt: authAt, lastActivityAt: actAt,
        daysSinceActivity: daysSince, licenseDays, estimatedActiveDays: estDays, usageEfficiency: eff,
        planType: plan, produktivitas: prod, produktivitasColor: prodColor,
        usageBreakdown: { includedRequests: 0, includedRequestsMax: 1000, billedRequests: 0, grossAmount: 0, billedAmount: 0, models: [] },
      });
      return [
        mockUsage('andi@corp.id',  'Andi Setiawan', 'andisetiawan', 'VS Code',   '1.114.0', 'copilot-chat v0.42.3', 'Hari ini',   '2026-04-10T08:00:00Z', '2026-04-10T10:00:00Z', 0,   120, 100, 85, 'Business', 'Tinggi', 'green'),
        mockUsage('budi@corp.id',  'Budi Raharjo',  'budiraharjo',  'IntelliJ',  '2024.1',  'copilot v1.5.6',       'Kemarin',    '2026-04-09T09:00:00Z', '2026-04-09T11:00:00Z', 1,   90,  60,  60, 'Business', 'Sedang', 'yellow'),
        mockUsage('cindy@corp.id', 'Cindy Kirana',  'cindykirana',  'VS Code',   '1.114.0', null,                   'Bulan lalu', '2026-03-01T07:00:00Z', '2026-03-01T08:00:00Z', 40,  150, 20,  10, 'Business', 'Rendah', 'red'),
      ];
    }
    throw err;
  }
}

export async function fetchCopilotRecommendations(): Promise<ApiCopilotRecommendationsRes> {
  try {
    return await apiFetch<ApiCopilotRecommendationsRes>('/dashboard/enterprise-focus/recommendations');
  } catch (err) {
    if (err instanceof TypeError) {
      return {
        recommendations: [
          {
            user: { email: 'budi@bri.co.id', name: 'Budi Santoso', githubLogin: 'budisantoso' },
            activity: { lastActivityAt: null, lastActivityEditor: null, editorParsed: null, copilotExtension: null, lastAuthenticatedAt: null, seatCreatedAt: '2026-01-15T07:00:00.000Z', daysSinceActivity: null, daysSinceLogin: null, daysSinceSeatCreated: 85 },
            issue: { code: 'NEVER_ACTIVE', label: 'Revoke', badgeColor: 'red', description: 'User memiliki seat Copilot tapi belum pernah menggunakannya sama sekali.' },
            recommendation: { type: 'revoke', label: 'Revoke seat', description: 'Cabut seat agar tidak mubazir. Seat bisa dialokasikan ke user lain yang lebih produktif.' },
            severity: 'high', potentialSavingsUsd: 19, potentialSavingsLabel: '$19/bulan',
          },
          {
            user: { email: 'rina@bri.co.id', name: 'Rina Wati', githubLogin: 'rinawati' },
            activity: { lastActivityAt: '2025-12-01T10:30:00.000Z', lastActivityEditor: 'vscode/1.114.0/copilot-chat/0.42.3', editorParsed: 'VS Code 1.114.0', copilotExtension: 'copilot-chat v0.42.3', lastAuthenticatedAt: '2025-12-05T08:00:00.000Z', seatCreatedAt: '2025-06-01T00:00:00.000Z', daysSinceActivity: 131, daysSinceLogin: 127, daysSinceSeatCreated: 314 },
            issue: { code: 'INACTIVE_90_PLUS', label: 'Revoke', badgeColor: 'red', description: 'Tidak aktif selama 131 hari. Terakhir aktif: 1/12/2025.' },
            recommendation: { type: 'revoke', label: 'Revoke seat', description: 'User sudah sangat lama tidak menggunakan Copilot. Cabut seat untuk menghemat biaya.' },
            severity: 'high', potentialSavingsUsd: 19, potentialSavingsLabel: '$19/bulan',
          },
          {
            user: { email: 'andi@bri.co.id', name: 'Andi Pratama', githubLogin: 'andipratama' },
            activity: { lastActivityAt: '2026-02-20T09:00:00.000Z', lastActivityEditor: 'vscode/1.114.0', editorParsed: 'VS Code 1.114.0', copilotExtension: 'copilot v1.230.0', lastAuthenticatedAt: '2026-02-22T08:00:00.000Z', seatCreatedAt: '2025-07-01T00:00:00.000Z', daysSinceActivity: 49, daysSinceLogin: 47, daysSinceSeatCreated: 284 },
            issue: { code: 'INACTIVE_30_89', label: 'Review', badgeColor: 'yellow', description: 'Tidak aktif selama 49 hari. Terakhir aktif: 20/2/2026.' },
            recommendation: { type: 'review', label: 'Review & follow up', description: 'Hubungi user untuk mengetahui alasan tidak aktif. Cek apakah ada kendala teknis.' },
            severity: 'medium', potentialSavingsUsd: 19, potentialSavingsLabel: '$19/bulan',
          },
          {
            user: { email: 'sari@bri.co.id', name: 'Sari Dewi', githubLogin: 'saridewi' },
            activity: { lastActivityAt: '2026-03-19T14:00:00.000Z', lastActivityEditor: 'vscode/1.114.0', editorParsed: 'VS Code 1.114.0', copilotExtension: 'copilot v1.230.0', lastAuthenticatedAt: '2026-03-20T08:00:00.000Z', seatCreatedAt: '2025-09-01T00:00:00.000Z', daysSinceActivity: 22, daysSinceLogin: 21, daysSinceSeatCreated: 222 },
            issue: { code: 'LOW_USAGE_15_29', label: 'Rendah', badgeColor: 'yellow', description: 'Produktivitas rendah — tidak aktif 22 hari. Penggunaan Copilot tidak konsisten.' },
            recommendation: { type: 'low_productivity', label: 'Monitoring & coaching', description: 'Pantau aktivitas user dan berikan coaching untuk meningkatkan produktivitas.' },
            severity: 'medium', potentialSavingsUsd: 0, potentialSavingsLabel: '-',
          },
          {
            user: { email: 'doni@bri.co.id', name: 'Doni', githubLogin: 'doni123' },
            activity: { lastActivityAt: '2026-04-07T11:00:00.000Z', lastActivityEditor: 'vscode/1.114.0', editorParsed: 'VS Code 1.114.0', copilotExtension: null, lastAuthenticatedAt: '2026-04-07T11:00:00.000Z', seatCreatedAt: '2026-01-01T00:00:00.000Z', daysSinceActivity: 3, daysSinceLogin: 3, daysSinceSeatCreated: 100 },
            issue: { code: 'NO_COPILOT_EXT', label: 'Training', badgeColor: 'green', description: 'Copilot extension tidak terdeteksi. User menggunakan VS Code tanpa Copilot.' },
            recommendation: { type: 'training', label: 'Training / review', description: 'Pastikan user sudah install extension Copilot dan tahu cara menggunakannya.' },
            severity: 'low', potentialSavingsUsd: 0, potentialSavingsLabel: '-',
          },
        ],
        summary: {
          totalSeats: 50, totalFlagged: 12, healthySeats: 38, wastagePercent: 24.0,
          bySeverity: { high: 4, medium: 5, low: 3 },
          byType: {
            revoke: { count: 4, savingsUsd: 76 },
            review: { count: 2, savingsUsd: 38 },
            low_productivity: { count: 3 },
            training: { count: 2 },
            sync: { count: 1 },
          },
          totalPotentialSavingsUsd: 114,
          totalPotentialSavingsLabel: '$114/bulan',
        },
        generatedAt: new Date().toISOString(),
      };
    }
    throw err;
  }
}

export async function syncCopilotData(): Promise<{ success: boolean; message: string }> {
  try {
    return await apiFetch<{ success: boolean; message: string }>('/dashboard/enterprise-focus/sync/all', { method: 'POST' });
  } catch (err) {
    if (err instanceof TypeError) {
      return new Promise((resolve) => setTimeout(() => resolve({ success: true, message: 'Sync successful (mock)' }), 2000));
    }
    throw err;
  }
}

export async function fetchCopilotOrgMetrics(): Promise<ApiCopilotOrgMetrics> {
  try {
    return await apiFetch<ApiCopilotOrgMetrics>('/dashboard/enterprise-focus/org-metrics');
  } catch (err) {
    if (err instanceof TypeError) {
      // Mock data untuk dev offline
      return {
        totalSuggestions: 12480,
        totalAccepted: 9144,
        acceptanceRate: 73.3,
        totalActiveUsers: 42,
        month: new Date().toISOString().substring(0, 7),
        dataAvailable: true,
      };
    }
    throw err;
  }
}

// ─── User Billing Import (CSV text / Image) ─────────────────────────────────

export interface UserBillingImportResult {
  success: boolean;
  month: string;
  imported: number;
  skipped: number;
  rows: Array<{
    githubLogin: string;
    includedRequests: number;
    includedRequestsMax: number;
    billedRequests: number;
    grossAmount: number;
    billedAmount: number;
  }>;
  ocrPreview?: string;
}

export async function importUserBillingCsv(csvText: string, month?: string): Promise<UserBillingImportResult> {
  return apiFetch<UserBillingImportResult>('/dashboard/enterprise-focus/user-billing/import-csv', {
    method: 'POST',
    body: JSON.stringify({ csvText, month }),
  });
}

export async function importUserBillingImage(file: File, month?: string): Promise<UserBillingImportResult> {
  const formData = new FormData();
  formData.append('image', file);
  if (month) formData.append('month', month);
  return apiUpload<UserBillingImportResult>('/dashboard/enterprise-focus/user-billing/import-image', formData);
}
