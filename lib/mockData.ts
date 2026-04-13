export type LicenseStatus = 
  | 'PENDING' 
  | 'SUBMITTED_TO_CISO' 
  | 'PENDING_IGA'
  | 'ACCOUNT_CREATED' 
  | 'ASSIGNED_TO_USER' 
  | 'IN_USE'
  | 'DONE' 
  | 'REVOKED' 
  | 'AVAILABLE';

export interface License {
  id: number;
  user: string;
  email: string;
  departemen: string;
  aplikasi: string;
  squad: string;
  tl: string;
  team: string;
  status: LicenseStatus;
  date: string;
}

export interface Request {
  id: number;
  user: string;
  tl: string;
  team: string;
  departemen: string;
  aplikasi: string;
  squad: string;
  date: string;
  reason: string;
}

export interface Quota {
  tl: string;
  team: string;
  used: number;
  max: number;
}

export interface TeamAppAlloc {
  team: string;
  tl: string;
  departemen: string;
  aplikasi: string[];
}

export interface HistoryEntry {
  time: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  note: string;
}

export interface Activity {
  icon: string;
  cls: string;
  text: string;
  time: string;
}

export const INITIAL_LICENSES: License[] = [
  // --- DWP: Qlola (10 records) ---
  { id: 1,  user: 'Ahmad Faisal',  email: 'ahmad.f@corp.id', departemen: 'DWP', aplikasi: 'Qlola', squad: 'Alpha', tl: 'Farhan', team: 'Tim A', status: 'DONE',              date: '10 Mar 2025' },
  { id: 2,  user: 'Rina Kartika',  email: 'rina.k@corp.id',  departemen: 'DWP', aplikasi: 'Qlola', squad: 'Alpha', tl: 'Farhan', team: 'Tim A', status: 'DONE',              date: '11 Mar 2025' },
  { id: 3,  user: 'Budi Santoso',  email: 'budi.s@corp.id',  departemen: 'DWP', aplikasi: 'Qlola', squad: 'Alpha', tl: 'Farhan', team: 'Tim A', status: 'DONE',              date: '12 Mar 2025' },
  { id: 4,  user: 'Siti Aminah',   email: 'siti.a@corp.id',  departemen: 'DWP', aplikasi: 'Qlola', squad: 'Alpha', tl: 'Farhan', team: 'Tim A', status: 'IN_USE',            date: '13 Mar 2025' },
  { id: 5,  user: 'Dedi Irawan',   email: 'dedi.i@corp.id',  departemen: 'DWP', aplikasi: 'Qlola', squad: 'Alpha', tl: 'Farhan', team: 'Tim A', status: 'IN_USE',            date: '14 Mar 2025' },
  { id: 6,  user: 'Ani Lestari',   email: 'ani.l@corp.id',   departemen: 'DWP', aplikasi: 'Qlola', squad: 'Alpha', tl: 'Farhan', team: 'Tim A', status: 'ACCOUNT_CREATED',   date: '15 Mar 2025' },
  { id: 7,  user: 'Eko Wahyudi',   email: 'eko.w@corp.id',   departemen: 'DWP', aplikasi: 'Qlola', squad: 'Alpha', tl: 'Farhan', team: 'Tim A', status: 'ACCOUNT_CREATED',   date: '16 Mar 2025' },
  { id: 8,  user: 'Lia Fitriani',  email: 'lia.f@corp.id',   departemen: 'DWP', aplikasi: 'Qlola', squad: 'Alpha', tl: 'Farhan', team: 'Tim A', status: 'PENDING_IGA',       date: '17 Mar 2025' },
  { id: 9,  user: 'Heri Kusuma',   email: 'heri.k@corp.id',  departemen: 'DWP', aplikasi: 'Qlola', squad: 'Alpha', tl: 'Farhan', team: 'Tim A', status: 'SUBMITTED_TO_CISO', date: '18 Mar 2025' },
  { id: 10, user: 'Maya Sari',     email: 'maya.s@corp.id',  departemen: 'DWP', aplikasi: 'Qlola', squad: 'Alpha', tl: 'Farhan', team: 'Tim A', status: 'REVOKED',           date: '19 Mar 2025' },

  // --- DGR: BRIMo (10 records) ---
  { id: 11, user: 'Andi Pratama',  email: 'andi.p@corp.id',  departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Beta', tl: 'Sinta',  team: 'Tim B', status: 'DONE',              date: '10 Mar 2025' },
  { id: 12, user: 'Indah Permata', email: 'indah.p@corp.id', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Beta', tl: 'Sinta',  team: 'Tim B', status: 'DONE',              date: '11 Mar 2025' },
  { id: 13, user: 'Fajar Shidiq',  email: 'fajar.s@corp.id', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Beta', tl: 'Sinta',  team: 'Tim B', status: 'IN_USE',            date: '12 Mar 2025' },
  { id: 14, user: 'Dewi Sartika',  email: 'dewi.s@corp.id',  departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Beta', tl: 'Sinta',  team: 'Tim B', status: 'IN_USE',            date: '13 Mar 2025' },
  { id: 15, user: 'Rahmat Hidayat',email: 'rahmat.h@corp.id',departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Beta', tl: 'Sinta',  team: 'Tim B', status: 'ASSIGNED_TO_USER',  date: '14 Mar 2025' },
  { id: 16, user: 'Novi liyana',   email: 'novi.l@corp.id',  departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Beta', tl: 'Sinta',  team: 'Tim B', status: 'ASSIGNED_TO_USER',  date: '15 Mar 2025' },
  { id: 17, user: 'Agus Setiawan', email: 'agus.s@corp.id',  departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Beta', tl: 'Sinta',  team: 'Tim B', status: 'ACCOUNT_CREATED',   date: '16 Mar 2025' },
  { id: 18, user: 'Yanti Rossi',   email: 'yanti.r@corp.id', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Beta', tl: 'Sinta',  team: 'Tim B', status: 'PENDING_IGA',       date: '17 Mar 2025' },
  { id: 19, user: 'Hendra Gunawan',email: 'hendra.g@corp.id',departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Beta', tl: 'Sinta',  team: 'Tim B', status: 'SUBMITTED_TO_CISO', date: '18 Mar 2025' },
  { id: 20, user: 'Siska Wahyuni', email: 'siska.w@corp.id', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Beta', tl: 'Sinta',  team: 'Tim B', status: 'AVAILABLE',         date: '19 Mar 2025' },

  // --- COP: NDS (10 records) ---
  { id: 21, user: 'Taufik Hidayat',email: 'taufik.h@corp.id',departemen: 'COP', aplikasi: 'NDS',   squad: 'Gamma', tl: 'Dinda',  team: 'Tim C', status: 'DONE',              date: '10 Mar 2025' },
  { id: 22, user: 'Bella Shofie',  email: 'bella.s@corp.id', departemen: 'COP', aplikasi: 'NDS',   squad: 'Gamma', tl: 'Dinda',  team: 'Tim C', status: 'DONE',              date: '11 Mar 2025' },
  { id: 23, user: 'Irwan Saputra', email: 'irwan.s@corp.id', departemen: 'COP', aplikasi: 'NDS',   squad: 'Gamma', tl: 'Dinda',  team: 'Tim C', status: 'IN_USE',            date: '12 Mar 2025' },
  { id: 24, user: 'Zaskia Gotik',  email: 'zaskia.g@corp.id',departemen: 'COP', aplikasi: 'NDS',   squad: 'Gamma', tl: 'Dinda',  team: 'Tim C', status: 'ASSIGNED_TO_USER',  date: '13 Mar 2025' },
  { id: 25, user: 'Rina Nose',     email: 'rina.n@corp.id',  departemen: 'COP', aplikasi: 'NDS',   squad: 'Gamma', tl: 'Dinda',  team: 'Tim C', status: 'ACCOUNT_CREATED',   date: '14 Mar 2025' },
  { id: 26, user: 'Gading Marten', email: 'gading.m@corp.id',departemen: 'COP', aplikasi: 'NDS',   squad: 'Gamma', tl: 'Dinda',  team: 'Tim C', status: 'PENDING_IGA',       date: '15 Mar 2025' },
  { id: 27, user: 'Giselle A.',    email: 'giselle@corp.id', departemen: 'COP', aplikasi: 'NDS',   squad: 'Gamma', tl: 'Dinda',  team: 'Tim C', status: 'AVAILABLE',         date: '16 Mar 2025' },
  { id: 28, user: 'Anang H.',      email: 'anang.h@corp.id', departemen: 'COP', aplikasi: 'NDS',   squad: 'Gamma', tl: 'Dinda',  team: 'Tim C', status: 'AVAILABLE',         date: '17 Mar 2025' },
  { id: 29, user: 'Ashanty S.',    email: 'ashanty@corp.id', departemen: 'COP', aplikasi: 'NDS',   squad: 'Gamma', tl: 'Dinda',  team: 'Tim C', status: 'REVOKED',           date: '18 Mar 2025' },
  { id: 30, user: 'Aurel H.',      email: 'aurel.h@corp.id', departemen: 'COP', aplikasi: 'NDS',   squad: 'Gamma', tl: 'Dinda',  team: 'Tim C', status: 'DONE',              date: '19 Mar 2025' },

  // --- ESP: Brispot (10 records) ---
  { id: 31, user: 'Rizwan F.',     email: 'rizwan.f@corp.id',departemen: 'ESP', aplikasi: 'Brispot', squad: 'Delta', tl: 'Iqbal',  team: 'Tim D', status: 'DONE',              date: '10 Mar 2025' },
  { id: 32, user: 'Putri D.',      email: 'putri.d@corp.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Delta', tl: 'Iqbal',  team: 'Tim D', status: 'DONE',              date: '11 Mar 2025' },
  { id: 33, user: 'Sule P.',       email: 'sule.p@corp.id',  departemen: 'ESP', aplikasi: 'Brispot', squad: 'Delta', tl: 'Iqbal',  team: 'Tim D', status: 'IN_USE',            date: '12 Mar 2025' },
  { id: 34, user: 'Andre T.',      email: 'andre.t@corp.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Delta', tl: 'Iqbal',  team: 'Tim D', status: 'ASSIGNED_TO_USER',  date: '13 Mar 2025' },
  { id: 35, user: 'Nunung S.',     email: 'nunung.s@corp.id',departemen: 'ESP', aplikasi: 'Brispot', squad: 'Delta', tl: 'Iqbal',  team: 'Tim D', status: 'ACCOUNT_CREATED',   date: '14 Mar 2025' },
  { id: 36, user: 'Parto P.',      email: 'parto.p@corp.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Delta', tl: 'Iqbal',  team: 'Tim D', status: 'PENDING_IGA',       date: '15 Mar 2025' },
  { id: 37, user: 'Azis G.',       email: 'azis.g@corp.id',  departemen: 'ESP', aplikasi: 'Brispot', squad: 'Delta', tl: 'Iqbal',  team: 'Tim D', status: 'AVAILABLE',         date: '16 Mar 2025' },
  { id: 38, user: 'Adul K.',       email: 'adul.k@corp.id',  departemen: 'ESP', aplikasi: 'Brispot', squad: 'Delta', tl: 'Iqbal',  team: 'Tim D', status: 'AVAILABLE',         date: '17 Mar 2025' },
  { id: 39, user: 'Komeng M.',     email: 'komeng@corp.id',  departemen: 'ESP', aplikasi: 'Brispot', squad: 'Delta', tl: 'Iqbal',  team: 'Tim D', status: 'DONE',              date: '18 Mar 2025' },
  { id: 40, user: 'Tukul A.',      email: 'tukul.a@corp.id', departemen: 'ESP', aplikasi: 'Brispot', squad: 'Delta', tl: 'Iqbal',  team: 'Tim D', status: 'DONE',              date: '19 Mar 2025' },
];

export const INITIAL_REQUESTS: Request[] = [
  { id: 1, user: 'Budi Santoso', tl: 'Farhan', team: 'Tim A', departemen: 'DWP', aplikasi: 'Qlola', squad: 'Alpha', date: '21 Mar 2025', reason: 'Analisis transaksi korporasi' },
  { id: 2, user: 'Indra Bekti',  tl: 'Sinta',  team: 'Tim B', departemen: 'DGR', aplikasi: 'BRIMo', squad: 'Beta', date: '22 Mar 2025', reason: 'Otomasi report retail' },
  { id: 3, user: 'Raffi Ahmad',  tl: 'Dinda',  team: 'Tim C', departemen: 'COP', aplikasi: 'NDS',   squad: 'Gamma', date: '23 Mar 2025', reason: 'Monitoring data NDS' },
];

export const QUOTA: Quota[] = [
  { tl: 'Farhan', team: 'Tim A', used: 8, max: 15 },
  { tl: 'Sinta',  team: 'Tim B', used: 6, max: 10 },
  { tl: 'Dinda',  team: 'Tim C', used: 4, max: 8  },
  { tl: 'Iqbal',  team: 'Tim D', used: 5, max: 12 },
];

export const TEAM_APP_ALLOC: TeamAppAlloc[] = [
  { team: 'Tim A', tl: 'Farhan', departemen: 'DWP', aplikasi: ['Qlola'] },
  { team: 'Tim B', tl: 'Sinta',  departemen: 'DGR', aplikasi: ['BRIMo'] },
  { team: 'Tim C', tl: 'Dinda',  departemen: 'COP', aplikasi: ['NDS'] },
  { team: 'Tim D', tl: 'Iqbal',  departemen: 'ESP', aplikasi: ['Brispot'] },
];

export const HISTORY: HistoryEntry[] = [
  { time: '22 Mar 09:14', actor: 'Ahmad Reza', role: 'Admin', action: 'APPROVE',  target: 'Ahmad Faisal', note: 'Kuota tersedia, diteruskan ke CISO' },
  { time: '21 Mar 16:30', actor: 'Sari Dewi',  role: 'CISO',  action: 'CREATE',   target: 'Andi Pratama',  note: 'Akun BRIMo dibuat di console' },
  { time: '21 Mar 11:00', actor: 'Ahmad Reza', role: 'Admin', action: 'ASSIGN',   target: 'Budi Santoso',  note: 'Lisensi Qlola dikirim ke user' },
  { time: '20 Mar 08:45', actor: 'Farhan TL',  role: 'TL',    action: 'CONFIRM',  target: 'Maya Sari',     note: 'User login terverifikasi → DONE' },
  { time: '18 Mar 14:20', actor: 'Sari Dewi',  role: 'CISO',  action: 'REVOKE',   target: 'Maya Sari',     note: 'Audit berkala — lisensi dicabut' },
];

export const ACTIVITIES: Activity[] = [
  { icon: '✓', cls: 'ai-teal',   text: '<strong>Farhan TL</strong> mengonfirmasi usage <strong>Ahmad Faisal</strong> → DONE', time: '10 menit lalu' },
  { icon: '⚡', cls: 'ai-purple', text: '<strong>CISO</strong> membuat akun BRIMo untuk <strong>Andi Pratama</strong>',     time: '1 jam lalu' },
  { icon: '✓', cls: 'ai-green',  text: '<strong>Admin</strong> menyetujui request <strong>Aurel H.</strong>',            time: '2 jam lalu' },
  { icon: '✕', cls: 'ai-red',    text: '<strong>CISO</strong> merevoke lisensi <strong>Maya Sari</strong>',               time: '1 hari lalu' },
  { icon: '⟳', cls: 'ai-orange', text: '<strong>Dinda TL</strong> mengajukan request untuk <strong>Raffi Ahmad</strong>',  time: '2 hari lalu' },
];

export type MetricView = 'tl' | 'admin' | 'ciso' | 'iga';

export interface Metric {
  label: string;
  value: string;
  sub: string;
  delta: string;
  up: boolean;
  cls: string;
}

export const METRICS: Record<MetricView, Metric[]> = {
  admin: [
    { label: 'Total Lisensi',  value: '40',   sub: 'aktif bulan ini',         delta: '+12', up: true,  cls: 'glow-green' },
    { label: 'Status DONE',    value: '22',   sub: 'terverifikasi digunakan', delta: '+8',  up: true,  cls: 'glow-teal' },
    { label: 'Idle / Pending', value: '4',    sub: 'menunggu aksi',           delta: '-4',  up: false, cls: 'glow-orange' },
    { label: 'Available',      value: '6',    sub: 'siap realokasi',          delta: '+2',  up: false, cls: 'glow-red' },
  ],
  tl: [
    { label: 'Kuota Terpakai',    value: '8/15', sub: 'Tim A — Farhan',              delta: '+2', up: true,  cls: 'glow-green' },
    { label: 'Status DONE',       value: '12',   sub: 'user aktif terverifikasi',    delta: '+3', up: true,  cls: 'glow-teal' },
    { label: 'Menunggu Approve',  value: '1',    sub: 'request pending',             delta: '',   up: true,  cls: 'glow-orange' },
    { label: 'Aplikasi Tersedia', value: '1',    sub: 'Qlola',                       delta: '',   up: true,  cls: 'glow-green' },
  ],
  ciso: [
    { label: 'Antrian Akun',     value: '2', sub: 'perlu dibuat',     delta: '',   up: true,  cls: 'glow-orange' },
    { label: 'Revoke Bulan Ini', value: '2', sub: 'akun dicabut',     delta: '+1', up: false, cls: 'glow-red' },
    { label: 'Akun Dibuat',      value: '12',sub: 'total bulan ini',  delta: '+4', up: true,  cls: 'glow-green' },
    { label: 'Aplikasi Dikelola',  value: '4', sub: 'Qlola · BRIMo · NDS · Brispot', delta: '',   up: true,  cls: 'glow-teal' },
  ],
  iga: [
    { label: 'Antrian Group',    value: '4', sub: 'perlu di-invite',  delta: '',   up: true,  cls: 'glow-orange' },
    { label: 'Berhasil Invite',  value: '15',sub: 'total bulan ini',  delta: '+5', up: true,  cls: 'glow-green' },
    { label: 'Idle / Error',     value: '0', sub: 'gagal invite',     delta: '',   up: true,  cls: 'glow-red' },
    { label: 'Active Sync',      value: '4', sub: 'sistem terhubung', delta: '',   up: true,  cls: 'glow-teal' },
  ],
};

export const ROLES = [
  { initials: 'AD', name: 'Ahmad Reza', title: 'Admin · TPE',    cls: 'avatar-admin' },
  { initials: 'TL', name: 'Farhan Haq', title: 'Technical Lead', cls: 'avatar-tl' },
  { initials: 'CS', name: 'Sari Dewi',  title: 'CISO',           cls: 'avatar-ciso' },
  { initials: 'IG', name: 'Budi Santoso', title: 'IGA Team',       cls: 'avatar-iga' },
];
