// ─── Auth Service ──────────────────────────────────────────────────────────────

import { apiFetch, setToken, clearToken } from '@/lib/api';
import type { User, RoleKey } from '@/lib/types';

// ─── Response shapes (match the backend API doc) ─────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  /** Backend returns uppercase, e.g. "ADMIN", "TL", "CISO", "IGA" */
  role: string;
  initials: string;
  title: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

// ─── Map API role string → frontend RoleKey ───────────────────────────────────

const ROLE_MAP: Record<string, RoleKey> = {
  ADMIN: 'admin',
  TL:    'tl',
  CISO:  'ciso',
  IGA:   'iga',
  IDM:   'idm',
};

export function apiRoleToKey(role: string): RoleKey {
  return ROLE_MAP[role.toUpperCase()] ?? 'admin';
}

/** Map RoleKey → numeric index used by legacy page components. */
export const ROLE_KEY_INDEX: Record<RoleKey, number> = {
  admin: 0,
  tl:    1,
  ciso:  2,
  iga:   3,
  idm:   4,
};

// ─── Auth API calls ───────────────────────────────────────────────────────────

/**
 * POST /auth/login
 * Stores the JWT in localStorage and returns the authenticated user.
 */
export async function login(payload: LoginPayload): Promise<AuthUser> {
  const res = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  setToken(res.access_token);
  return res.user;
}

/**
 * GET /auth/me
 * Returns the current user profile using the stored JWT.
 * Returns `null` if unauthenticated or on network error.
 */
export async function getMe(): Promise<AuthUser | null> {
  try {
    return await apiFetch<AuthUser>('/auth/me');
  } catch {
    return null;
  }
}

/**
 * Clear the stored JWT and session state.
 */
export function logout(): void {
  clearToken();
}

// ─── AuthUser → frontend User adapter ────────────────────────────────────────
// Maps the compact AuthUser (from JWT) to the richer User type used in the UI.

const AVATAR_CLASS: Record<RoleKey, string> = {
  admin: 'avatar-admin',
  tl:    'avatar-tl',
  ciso:  'avatar-ciso',
  iga:   'avatar-iga',
  idm:   'avatar-idm',
};

export function authUserToUser(authUser: AuthUser): User {
  const roleKey = apiRoleToKey(authUser.role);
  return {
    id:          authUser.id,
    email:       authUser.email,
    name:        authUser.name,
    initials:    authUser.initials,
    title:       authUser.title,
    role:        roleKey,
    avatarClass: AVATAR_CLASS[roleKey],
  };
}
