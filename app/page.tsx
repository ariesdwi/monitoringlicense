'use client';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { TEAM_APP_ALLOC, QUOTA } from '@/lib/mockData';
import { getMe, authUserToUser, logout as authLogout, ROLE_KEY_INDEX } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import {
  fetchMetrics, fetchActivities, fetchRequests, fetchLicenses, fetchQuotas, fetchHistory,
  fetchImpacts, fetchImpactSummary, createImpact, deleteImpact, editImpact,
  createRequest, approveRequest, rejectRequest,
  createAccount, inviteGroup, assignLicense, confirmUsage, revokeLicense, editLicense, deleteLicense,
  fetchAiTools, createAiTool, editAiTool, deleteAiTool,
  ApiRequest, ApiLicense, ApiMetric, ApiActivity, ApiQuota, ApiHistory, ApiAiImpact, ApiImpactSummary, ApiAiTool,
} from '@/lib/services';
import type { User } from '@/lib/types';
import type { RoleKey, View } from '@/components/ui/Sidebar';

import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';
import Dashboard from '@/components/ui/Dashboard';
import LicenseTable from '@/components/ui/LicenseTable';
import RequestsPanel from '@/components/ui/RequestsPanel';
import QuotaPanel from '@/components/ui/QuotaPanel';
import HistoryTable from '@/components/ui/HistoryTable';
import AiImpactPanel from '@/components/ui/AiImpactPanel';
import AiToolsPanel from '@/components/ui/AiToolsPanel';
import LoginPage from '@/components/ui/LoginPage';
import CopilotAnalytics from '@/components/ui/CopilotAnalytics';

const ROLE_KEYS: RoleKey[]    = ['admin', 'tl', 'ciso', 'iga', 'idm'];
const ROLE_VIEWS               = ['admin', 'tl', 'ciso', 'iga', 'idm'] as const;
const POLL_INTERVAL_MS         = 30_000; // 30 s auto-refresh

interface Toast { icon: string; msg: string; kind?: 'error' | 'ok' }
interface NewReqForm { user: string; email: string; userType: string; reason: string; departemen: string; aplikasi: string; squad: string; aiTool: string; }

export default function Home() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [isLoggedIn,  setIsLoggedIn]  = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role,        setRole]        = useState(0);

  // ── View ──────────────────────────────────────────────────────────────────
  const [view,   setView]   = useState<View>('dashboard');
  const [search, setSearch] = useState('');

  // ── Remote data ───────────────────────────────────────────────────────────
  const [metrics,    setMetrics]    = useState<ApiMetric[]>([]);
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const [requests,   setRequests]   = useState<ApiRequest[]>([]);
  const [licenses,   setLicenses]   = useState<ApiLicense[]>([]);
  const [quotas,     setQuotas]     = useState<ApiQuota[]>([]);
  const [history,    setHistory]    = useState<ApiHistory[]>([]);
  const [impacts,    setImpacts]    = useState<ApiAiImpact[]>([]);
  const [impactSummary, setImpactSummary] = useState<ApiImpactSummary>({ totalReports: 0, avgProductivityGain: 0, totalManDaysSaved: 0, avgCoverage: 0, avgRating: '-', byTeam: [] });
  const [aiTools,    setAiTools]    = useState<ApiAiTool[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading,  setLoading]  = useState(false);
  const [toast,    setToast]    = useState<Toast | null>(null);
  const [showModal,setShowModal]= useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form,     setForm]     = useState<NewReqForm>({ user: '', email: '', userType: 'Internal', reason: '', departemen: '', aplikasi: 'Qlola', squad: '', aiTool: aiTools[0]?.name || '' });
  const [editForm, setEditForm] = useState<Partial<ApiLicense>>({});
  const [replaceTarget, setReplaceTarget] = useState<number | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const roleKey  = ROLE_KEYS[role];
  const roleView = ROLE_VIEWS[role];

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const showToast = useCallback((icon: string, msg: string, kind: Toast['kind'] = 'ok') => {
    setToast({ icon, msg, kind });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Handle API errors globally ────────────────────────────────────────────
  const handleApiError = useCallback((err: unknown) => {
    if (err instanceof ApiError) {
      if (err.statusCode === 401) {
        // JWT expired — force re-login
        authLogout();
        setIsLoggedIn(false);
        setCurrentUser(null);
        showToast('⚠', 'Session expired. Please sign in again.', 'error');
      } else {
        showToast('✕', err.message, 'error');
      }
    } else if (err instanceof TypeError) {
      // Network error — already handled in services (returns mock data)
    } else {
      showToast('✕', 'An unexpected error occurred.', 'error');
    }
  }, [showToast]);

  // ── Fetch all data for the current view ──────────────────────────────────
  const refreshAll = useCallback(async (currentRole: number) => {
    const rk = ROLE_KEYS[currentRole];
    const rv = ROLE_VIEWS[currentRole];

    try {
      const [m, a, r, l, q, h, imp, impSum, tls] = await Promise.all([
        fetchMetrics(rv),
        fetchActivities(),
        fetchRequests(),
        fetchLicenses(),
        fetchQuotas(),
        fetchHistory(),
        fetchImpacts(),
        fetchImpactSummary(),
        fetchAiTools(),
      ]);
      setMetrics(m);
      setActivities(a);
      setRequests(r);
      setLicenses(l);
      setQuotas(q);
      setHistory(h);
      setImpacts(imp);
      setImpactSummary(impSum);
      setAiTools(tls);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  // ── Session restore on mount ──────────────────────────────────────────────
  useEffect(() => {
    getMe().then(authUser => {
      if (authUser) {
        const user = authUserToUser(authUser);
        const ri   = ROLE_KEY_INDEX[user.role];
        setCurrentUser(user);
        setRole(ri);
        setIsLoggedIn(true);
        refreshAll(ri);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start / stop auto-polling when logged in ──────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => refreshAll(role), POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isLoggedIn, role, refreshAll]);

  // ── Role change ───────────────────────────────────────────────────────────
  const handleRoleChange = useCallback((i: number) => {
    setRole(i);
    setView('dashboard');
    setSearch('');
    refreshAll(i);
  }, [refreshAll]);

  // ─────────────────────────────────────────────────────────────────────────
  // Action handlers — call API, then refresh to get authoritative server state
  // ─────────────────────────────────────────────────────────────────────────

  const handleApprove = useCallback(async (id: number) => {
    try {
      await approveRequest(id);
      showToast('✓', 'Approved — sent to CISO for account creation');
      await refreshAll(role);
    } catch (err) {
      // Offline mode: optimistic update
      if (err instanceof TypeError) {
        const req = requests.find(r => r.id === id);
        if (!req) return;
        setLicenses(prev => [...prev, {
          id: Date.now(), userName: req.userName, email: req.userName.split(' ')[0].toLowerCase() + '@corp.id',
          userType: req.userType,
          departemen: req.departemen, aplikasi: req.aplikasi, squad: req.squad, aiTool: (req as any).aiTool || '', tlName: req.tlName, teamId: req.teamId,
          status: 'SUBMITTED_TO_CISO', date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), team: req.team,
        }]);
        setRequests(prev => prev.filter(r => r.id !== id));
        showToast('✓', 'Approved (offline mode)');
      } else {
        handleApiError(err);
      }
    }
  }, [requests, role, refreshAll, showToast, handleApiError]);

  const handleReject = useCallback(async (id: number) => {
    try {
      await rejectRequest(id);
      showToast('✕', 'Request rejected');
      await refreshAll(role);
    } catch (err) {
      if (err instanceof TypeError) {
        setRequests(prev => prev.filter(r => r.id !== id));
        showToast('✕', 'Request rejected (offline mode)');
      } else {
        handleApiError(err);
      }
    }
  }, [role, refreshAll, showToast, handleApiError]);

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this license?")) return;
    try {
      await deleteLicense(id);
      showToast('✓', 'License deleted successfully');
      await refreshAll(role);
    } catch (err) {
      if (err instanceof TypeError) {
        setLicenses(prev => prev.filter(l => l.id !== id));
        showToast('✓', 'License deleted (offline mode)');
      } else {
        handleApiError(err);
      }
    }
  }, [role, refreshAll, showToast, handleApiError]);

  const handleEditInit = useCallback((id: number) => {
    const license = licenses.find(l => l.id === id);
    if (!license) return;
    setEditForm(license);
    setShowEditModal(true);
  }, [licenses]);

  const handleEditSubmit = useCallback(async () => {
    if (!editForm.id) return;
    try {
      await editLicense(editForm.id, {
        userName: editForm.userName,
        email: editForm.email,
        userType: editForm.userType,
        departemen: editForm.departemen,
        aplikasi: editForm.aplikasi,
        aiTool: editForm.aiTool,
        squad: editForm.squad,
      });
      setShowEditModal(false);
      showToast('✓', 'License updated successfully');
      await refreshAll(role);
    } catch (err) {
      if (err instanceof TypeError) {
        setLicenses(prev => prev.map(l => l.id === editForm.id ? { ...l, ...editForm } : l));
        setShowEditModal(false);
        showToast('✓', 'License updated (offline mode)');
      } else {
        handleApiError(err);
      }
    }
  }, [editForm, role, refreshAll, showToast, handleApiError]);

  const handleRevoke = useCallback(async (id: number) => {
    try {
      await revokeLicense(id);
      showToast('⚠', 'License revoked — now AVAILABLE');
      await refreshAll(role);
    } catch (err) {
      if (err instanceof TypeError) {
        setLicenses(prev => prev.map(l => l.id === id ? { ...l, status: 'AVAILABLE' } : l));
        showToast('⚠', 'License revoked (offline mode)');
      } else {
        handleApiError(err);
      }
    }
  }, [role, refreshAll, showToast, handleApiError]);

  const handleCreateAcc = useCallback(async (id: number) => {
    try {
      await createAccount(id);
      showToast('⚡', 'Account created — sent to IGA for group invite');
      await refreshAll(role);
    } catch (err) {
      if (err instanceof TypeError) {
        setLicenses(prev => prev.map(l => l.id === id ? { ...l, status: 'PENDING_IGA' } : l));
        showToast('⚡', 'Account created (offline mode)');
      } else {
        handleApiError(err);
      }
    }
  }, [role, refreshAll, showToast, handleApiError]);

  const handleInviteGroup = useCallback(async (id: number) => {
    try {
      await inviteGroup(id);
      showToast('✓', 'User invited to Identity Group — ready for Admin assignment');
      await refreshAll(role);
    } catch (err) {
      if (err instanceof TypeError) {
        setLicenses(prev => prev.map(l => l.id === id ? { ...l, status: 'ACCOUNT_CREATED' } : l));
        showToast('✓', 'Invited (offline mode)');
      } else {
        handleApiError(err);
      }
    }
  }, [role, refreshAll, showToast, handleApiError]);

  const handleAssign = useCallback(async (id: number) => {
    const license = licenses.find(l => l.id === id);
    if (!license) return;

    let userName: string | undefined;
    if (license.status === 'AVAILABLE') {
      const entered = window.prompt('Enter new user name for this available license:');
      if (!entered) return;
      userName = entered;
    }

    try {
      await assignLicense(id, userName);
      showToast('✓', 'License assigned — awaiting TL confirmation');
      await refreshAll(role);
    } catch (err) {
      if (err instanceof TypeError) {
        setLicenses(prev => prev.map(l => l.id === id
          ? { ...l, status: 'ASSIGNED_TO_USER', ...(userName ? { userName, email: userName.split(' ')[0].toLowerCase() + '@corp.id' } : {}) }
          : l
        ));
        showToast('✓', 'Assigned (offline mode)');
      } else {
        handleApiError(err);
      }
    }
  }, [licenses, role, refreshAll, showToast, handleApiError]);

  const handleConfirmUsage = useCallback(async (id: number) => {
    try {
      await confirmUsage(id);
      showToast('✓', 'Usage confirmed!');
      await refreshAll(role);
    } catch (err) {
      if (err instanceof TypeError) {
        setLicenses(prev => prev.map(l => l.id === id ? { ...l, status: 'DONE' } : l));
        showToast('✓', 'Confirmed (offline mode)');
      } else {
        handleApiError(err);
      }
    }
  }, [role, refreshAll, showToast, handleApiError]);

  // ── TL: submit new request ────────────────────────────────────────────────
  const teamAlloc = useMemo(() => {
    const tlName = currentUser?.name ?? '';
    return TEAM_APP_ALLOC.find(v => v.tl === tlName.split(' ')[0]);
  }, [currentUser]);

  const allowedApps = teamAlloc?.aplikasi || ['Qlola', 'BRIMo', 'NDS', 'Brispot'];

  const activeTeamLicenses = useMemo(() => {
    const tlName = currentUser?.name?.split(' ')[0] ?? '';
    return licenses.filter(l => l.tlName === tlName && l.status !== 'REVOKED' && l.status !== 'AVAILABLE');
  }, [licenses, currentUser]);

  const handleSubmitRequest = useCallback(async () => {
    if (!form.user.trim() || !form.reason.trim()) return;

    let finalReason = form.reason;
    if (replaceTarget) {
      const oldUser = licenses.find(l => l.id === replaceTarget)?.userName;
      finalReason = `[Replace: ${oldUser}] ${finalReason}`;
    }

    try {
      const dept = form.departemen || teamAlloc?.departemen || 'IT';
      const sq = form.squad || 'Alpha';
      await createRequest({ userName: form.user, email: form.email, userType: form.userType, departemen: dept, aplikasi: form.aplikasi, squad: sq, reason: finalReason, aiTool: form.aiTool } as any);
      setShowModal(false);
      setForm({ user: '', email: '', userType: 'Internal', reason: '', departemen: '', aplikasi: allowedApps[0] || 'Qlola', squad: '', aiTool: aiTools[0]?.name || '' });
      setReplaceTarget(null);
      showToast('⚡', 'Request submitted — awaiting Admin approval');
      await refreshAll(role);
    } catch (err) {
      if (err instanceof TypeError) {
        // Offline optimistic insert
        const teamQuota = QUOTA.find(q => q.tl === currentUser?.name?.split(' ')[0]);
        setRequests(prev => [...prev, {
          id: Date.now(), userName: form.user, userType: form.userType,
          tlName: currentUser?.name ?? '', teamId: 1, departemen: form.departemen || teamAlloc?.departemen || 'IT', aplikasi: form.aplikasi, squad: form.squad || 'Alpha',
          date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          reason: finalReason,
          team: { id: 1, name: teamQuota?.team ?? 'My Team', tlName: currentUser?.name ?? '', maxQuota: teamQuota?.max ?? 10 },
          aiTool: form.aiTool,
        } as any]);
        setShowModal(false);
        setForm({ user: '', email: '', userType: 'Internal', reason: '', departemen: '', aplikasi: allowedApps[0] || 'Qlola', squad: '', aiTool: aiTools[0]?.name || '' });
        setReplaceTarget(null);
        showToast('⚡', 'Request submitted (offline mode)');
      } else if (err instanceof ApiError && err.statusCode === 400) {
        showToast('⚠', err.message, 'error');
      } else {
        handleApiError(err);
      }
    }
  }, [form, replaceTarget, licenses, allowedApps, teamAlloc, currentUser, role, refreshAll, showToast, handleApiError]);

  // ── AI Impact handlers ────────────────────────────────────────────────────
  const handleSubmitImpact = useCallback(async (data: any) => {
    try {
      await createImpact(data);
      showToast('⚡', 'AI Impact report submitted');
      await refreshAll(role);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 400) {
        showToast('⚠', err.message, 'error');
      } else {
        handleApiError(err);
      }
    }
  }, [role, refreshAll, showToast, handleApiError]);

  const handleEditImpact = useCallback(async (id: number, data: any) => {
    try {
      await editImpact(id, data);
      showToast('✓', 'AI Impact report updated');
      await refreshAll(role);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 400) {
        showToast('⚠', err.message, 'error');
      } else {
        handleApiError(err);
      }
    }
  }, [role, refreshAll, showToast, handleApiError]);

  const handleDeleteImpact = useCallback(async (id: number) => {
    if (!window.confirm('Delete this AI Impact report?')) return;
    try {
      await deleteImpact(id);
      showToast('✓', 'Report deleted');
      await refreshAll(role);
    } catch (err) {
      handleApiError(err);
    }
  }, [role, refreshAll, showToast, handleApiError]);

  const handleCreateTool = useCallback(async (name: string, totalQuota?: number) => {
    try {
      await createAiTool({ name, totalQuota });
      showToast('✓', 'AI Tool created');
      await refreshAll(role);
    } catch (err) {
      handleApiError(err);
    }
  }, [role, refreshAll, showToast, handleApiError]);

  const handleEditTool = useCallback(async (id: number, name: string, totalQuota?: number) => {
    try {
      await editAiTool(id, { name, totalQuota });
      showToast('✓', 'AI Tool updated');
      await refreshAll(role);
    } catch (err) {
      handleApiError(err);
    }
  }, [role, refreshAll, showToast, handleApiError]);

  const handleDeleteTool = useCallback(async (id: number) => {
    if (!window.confirm('Delete this AI Tool permanently?')) return;
    try {
      await deleteAiTool(id);
      showToast('✓', 'AI Tool deleted');
      await refreshAll(role);
    } catch (err) {
      handleApiError(err);
    }
  }, [role, refreshAll, showToast, handleApiError]);

  const handleFetchTools = useCallback(async () => {
    try {
      const tls = await fetchAiTools();
      setAiTools(tls);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  const liveMetrics = useMemo(() => {
    const rk = ROLE_KEYS[role];
    const rv = ROLE_VIEWS[role];

    if (rk === 'admin') {
      const total = licenses.filter(l => l.status !== 'REVOKED' && l.status !== 'AVAILABLE').length;
      const done  = licenses.filter(l => l.status === 'DONE').length;
      const pend  = requests.length;
      const avail = licenses.filter(l => l.status === 'AVAILABLE').length;
      return [
        { label: 'Total Lisensi',  value: total.toString(), sub: 'aktif dalam sistem', delta: '', up: true, cls: 'glow-green' },
        { label: 'Status DONE',    value: done.toString(),  sub: 'terverifikasi digunakan', delta: '', up: true, cls: 'glow-teal' },
        { label: 'Pending Requests', value: pend.toString(), sub: 'menunggu approval', delta: '', up: false, cls: 'glow-orange' },
        { label: 'Available',      value: avail.toString(), sub: 'siap realokasi', delta: '', up: false, cls: 'glow-red' },
      ];
    }

    if (rk === 'tl') {
      const myName = currentUser?.name ?? '';
      const myFirst = myName.split(' ')[0];
      const q = quotas.find(q => q.tl === myFirst || q.tl === myName);
      const done = licenses.filter(l => (l.tlName === myName || l.tlName === myFirst) && l.status === 'DONE').length;
      const reqs = requests.filter(r => r.tlName === myName || r.tlName === myFirst).length;

      return [
        { label: 'Kuota Terpakai',    value: `${q?.used || 0}/${q?.max || 0}`, sub: q?.team || 'Tim Anda', delta: '', up: true,  cls: 'glow-green' },
        { label: 'Status DONE',       value: done.toString(), sub: 'user aktif terverifikasi',  delta: '', up: true,  cls: 'glow-teal' },
        { label: 'Menunggu Approve',  value: reqs.toString(), sub: 'request pending',       delta: '', up: true,  cls: 'glow-orange' },
        { label: 'Aplikasi Tersedia', value: aiTools.length.toString(), sub: 'AI Tools Aktif', delta: '', up: true,  cls: 'glow-green' },
      ];
    }

    if (rk === 'ciso') {
      const queue = licenses.filter(l => l.status === 'SUBMITTED_TO_CISO').length;
      const totalCreated = licenses.filter(l => !['PENDING', 'SUBMITTED_TO_CISO', 'REVOKED', 'AVAILABLE'].includes(l.status)).length;
      return [
        { label: 'Antrian Akun',     value: queue.toString(), sub: 'perlu dibuat', delta: '', up: true, cls: 'glow-orange' },
        { label: 'Akun Dibuat',      value: totalCreated.toString(), sub: 'total aktif', delta: '', up: true, cls: 'glow-green' },
        { label: 'Total User',       value: licenses.filter(l => l.status !== 'AVAILABLE').length.toString(), sub: 'dalam pemantauan', delta: '', up: true, cls: 'glow-teal' },
        { label: 'Aplikasi Dikelola', value: '4', sub: 'Qlola · BRIMo · NDS · Brispot', delta: '', up: true, cls: 'glow-teal' },
      ];
    }

    if (rk === 'iga') {
      const queue = licenses.filter(l => l.status === 'PENDING_IGA').length;
      const invited = licenses.filter(l => !['PENDING', 'SUBMITTED_TO_CISO', 'PENDING_IGA', 'REVOKED', 'AVAILABLE'].includes(l.status)).length;
      return [
        { label: 'Antrian Group',    value: queue.toString(), sub: 'perlu di-invite', delta: '', up: true, cls: 'glow-orange' },
        { label: 'Berhasil Invite',  value: invited.toString(), sub: 'aktif tersinkron', delta: '', up: true, cls: 'glow-green' },
        { label: 'Idle / Error',     value: '0', sub: 'gagal invite', delta: '', up: true, cls: 'glow-red' },
        { label: 'Active Sync',      value: '4', sub: 'sistem terhubung', delta: '', up: true, cls: 'glow-teal' },
      ];
    }

    // Default to API metrics for others or fallback
    return metrics;
  }, [role, licenses, requests, quotas, metrics, currentUser, aiTools]);

  const showAddBtn = view === 'requests' && roleKey === 'tl';

  // ── Login gate ────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={async (r, user) => {
          setRole(r);
          setCurrentUser(user);
          setIsLoggedIn(true);
          setView('dashboard');
          await refreshAll(r);
        }}
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        view={view}
        setView={v => { setView(v); setSearch(''); }}
        role={role}
        setRole={handleRoleChange}
        requestCount={requests.length}
        roleKey={roleKey}
        currentUser={currentUser}
        onLogout={() => {
          authLogout();
          setIsLoggedIn(false);
          setCurrentUser(null);
          setRole(0);
        }}
      />

      <div className="main">
        <Topbar
          view={view}
          search={search}
          setSearch={setSearch}
          showAdd={showAddBtn}
          onAdd={() => setShowModal(true)}
        />

        <div className="content">
          {view === 'dashboard' && (
            <Dashboard
              roleView={roleView}
              roleKey={roleKey}
              currentTL={currentUser?.name ?? ''}
              requests={requests}
              metrics={liveMetrics}
              activities={activities}
              licenses={licenses}
              quotas={quotas}
              aiTools={aiTools}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
          {view === 'licenses' && (
            <LicenseTable
              licenses={licenses}
              search={search}
              roleKey={roleKey}
              currentTL={currentUser?.name ?? ''}
              aiTools={aiTools}
              onRevoke={handleRevoke}
              onAssign={handleAssign}
              onCreateAcc={handleCreateAcc}
              onConfirmUsage={handleConfirmUsage}
              onInviteGroup={handleInviteGroup}
              onEdit={handleEditInit}
              onDelete={handleDelete}
            />
          )}
          {view === 'requests' && (
            <RequestsPanel
              requests={requests}
              roleKey={roleKey}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
          {view === 'quota' && (
            <QuotaPanel 
              roleKey={roleKey} 
              currentTL={currentUser?.name ?? ''} 
              quotas={quotas} 
              aiTools={aiTools}
              licenses={licenses}
              onRefresh={() => refreshAll(role)} 
            />
          )}
          {view === 'history' && <HistoryTable history={history} />}
          {view === 'impact' && (
            <AiImpactPanel
              impacts={impacts}
              summary={impactSummary}
              roleKey={roleKey}
              currentTL={currentUser?.name ?? ''}
              onSubmit={handleSubmitImpact}
              onEdit={handleEditImpact}
              onDelete={handleDeleteImpact}
              aiTools={aiTools}
            />
          )}
          {view === 'tools' && (
            <AiToolsPanel
              tools={aiTools}
              roleKey={roleKey}
              onCreate={handleCreateTool}
              onEdit={handleEditTool}
              onDelete={handleDeleteTool}
            />
          )}
          {view === 'analytics' && (
            <CopilotAnalytics 
              roleKey={roleKey} 
              currentTL={currentUser?.name ?? ''}
            />
          )}
        </div>
      </div>

      {/* New Request Modal (TL only) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">New License Request</div>
            <div className="modal-sub">
              Submit a request for an AI license. It will be sent to Admin for approval, then CISO will create the account.
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="req-user">User Name</label>
              <input
                id="req-user"
                className="form-input"
                placeholder="e.g. Budi Santoso"
                value={form.user}
                onChange={e => setForm(f => ({ ...f, user: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="req-email">Email Address</label>
              <input
                id="req-email"
                type="email"
                className="form-input"
                placeholder="e.g. budi@corp.id or 123456@corp.id"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="req-usertype">User Type</label>
              <select
                id="req-usertype"
                className="form-input"
                value={form.userType}
                onChange={e => setForm(f => ({ ...f, userType: e.target.value }))}
              >
                <option value="Internal">Internal</option>
                <option value="Vendor">Vendor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="req-dept">Departemen</label>
              <input
                id="req-dept"
                className="form-input"
                placeholder={`e.g. ${teamAlloc?.departemen || 'IT'}`}
                value={form.departemen}
                onChange={e => setForm(f => ({ ...f, departemen: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="req-squad">Squad</label>
              <input
                id="req-squad"
                className="form-input"
                placeholder="e.g. Alpha"
                value={form.squad}
                onChange={e => setForm(f => ({ ...f, squad: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="req-aplikasi">Project APP</label>
              <select
                id="req-aplikasi"
                className="form-input"
                value={form.aplikasi}
                onChange={e => setForm(f => ({ ...f, aplikasi: e.target.value }))}
              >
                {allowedApps.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="req-aitool">AI Tools Type</label>
              <select
                id="req-aitool"
                className="form-input"
                value={form.aiTool}
                onChange={e => setForm(f => ({ ...f, aiTool: e.target.value }))}
              >
                {aiTools.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="req-replace">Replace Existing User (Optional)</label>
              <select
                id="req-replace"
                className="form-input"
                value={replaceTarget || ''}
                onChange={e => setReplaceTarget(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">-- No, this is a new allocation --</option>
                {activeTeamLicenses.map(l => (
                  <option key={l.id} value={l.id}>Replace {l.userName} ({l.aplikasi})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="req-reason">Reason / Use Case</label>
              <input
                id="req-reason"
                className="form-input"
                placeholder="e.g. Otomasi laporan data"
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmitRequest}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast${toast.kind === 'error' ? ' toast-error' : ''}`}>
          <span className="toast-icon">{toast.icon}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Edit License Modal (Admin only) */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Edit License</div>
            <div className="modal-sub">
              Update license details for {editForm.userName}.
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-user">User Name</label>
              <input
                id="edit-user"
                className="form-input"
                value={editForm.userName || ''}
                onChange={e => setEditForm(f => ({ ...f, userName: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-email">Email Address</label>
              <input
                id="edit-email"
                type="email"
                className="form-input"
                value={editForm.email || ''}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-usertype">User Type</label>
              <select
                id="edit-usertype"
                className="form-input"
                value={editForm.userType || 'Internal'}
                onChange={e => setEditForm(f => ({ ...f, userType: e.target.value }))}
              >
                <option value="Internal">Internal</option>
                <option value="Vendor">Vendor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-dept">Departemen</label>
              <input
                id="edit-dept"
                className="form-input"
                value={editForm.departemen || ''}
                onChange={e => setEditForm(f => ({ ...f, departemen: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-squad">Squad</label>
              <input
                id="edit-squad"
                className="form-input"
                value={editForm.squad || ''}
                onChange={e => setEditForm(f => ({ ...f, squad: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-aplikasi">Project APP</label>
              <input
                id="edit-aplikasi"
                className="form-input"
                value={editForm.aplikasi || ''}
                onChange={e => setEditForm(f => ({ ...f, aplikasi: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-aitool">AI Tools Type</label>
              <select
                id="edit-aitool"
                className="form-input"
                value={editForm.aiTool || ''}
                onChange={e => setEditForm(f => ({ ...f, aiTool: e.target.value }))}
              >
                {!editForm.aiTool && <option value="">-- Select AI Tool --</option>}
                {aiTools.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEditSubmit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
