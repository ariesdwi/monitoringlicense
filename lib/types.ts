// ─── Domain types ────────────────────────────────────────────────────────────

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
  createdAt?: string;
  updatedAt?: string;
}

export interface LicenseRequest {
  id: number;
  user: string;
  tl: string;
  team: string;
  departemen: string;
  aplikasi: string;
  squad: string;
  date: string;
  reason: string;
  replaceUserId?: number | null;
  createdAt?: string;
}

export interface Quota {
  id?: number;
  tl: string;
  team: string;
  used: number;
  max: number;
  vendors?: string[];
}

export interface VendorAllocation {
  id?: number;
  team: string;
  tl: string;
  vendors: string[];
}

export interface HistoryEntry {
  id?: number;
  time: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  note: string;
  createdAt?: string;
}

export interface Activity {
  id?: number;
  icon: string;
  cls: string;
  text: string;
  time: string;
  createdAt?: string;
}

export interface Metric {
  label: string;
  value: string;
  sub: string;
  delta: string;
  up: boolean;
  cls: string;
}

export type RoleKey = 'admin' | 'tl' | 'ciso' | 'iga' | 'idm';

export interface User {
  id: number;
  initials: string;
  name: string;
  email: string;
  title: string;
  /** Lowercase frontend role key (mapped from API uppercase) */
  role: RoleKey;
  avatarClass: string;
  teamId?: number | null;
  tlName?: string | null;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  total?: number;
}

/** Shape returned by POST /auth/login (matches backend API doc) */
export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string;
    /** Uppercase role from server: "ADMIN" | "TL" | "CISO" | "IGA" */
    role: string;
    initials: string;
    title: string;
  };
}

export interface LicenseActionResponse {
  license: Partial<License>;
  message: string;
}
