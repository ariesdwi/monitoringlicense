// ─── Base API Client ──────────────────────────────────────────────────────────

export const API_BASE = 'http://localhost:3000';

/** Retrieve the stored JWT access token (works in browser only). */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/** Persist the JWT access token. */
export function setToken(token: string): void {
  localStorage.setItem('access_token', token);
}

/** Remove the JWT access token (logout). */
export function clearToken(): void {
  localStorage.removeItem('access_token');
}

/** Standard API error with HTTP status code. */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Wrapper around `fetch` that:
 * - Prepends the base URL
 * - Attaches `Authorization: Bearer <token>` when a token is available
 * - Parses JSON responses
 * - Throws `ApiError` on non-2xx responses
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const data = await response.json().catch(() => ({
    statusCode: response.status,
    message: response.statusText,
  }));

  if (!response.ok) {
    throw new ApiError(
      data.statusCode ?? response.status,
      data.message ?? 'An unexpected error occurred',
    );
  }

  return data as T;
}

/**
 * Upload a file via multipart/form-data.
 * Omits Content-Type so the browser sets the correct boundary.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => ({
    statusCode: response.status,
    message: response.statusText,
  }));

  if (!response.ok) {
    throw new ApiError(
      data.statusCode ?? response.status,
      data.message ?? 'An unexpected error occurred',
    );
  }

  return data as T;
}
