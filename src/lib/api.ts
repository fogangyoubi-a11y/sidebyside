/**
 * Client HTTP minimal pour parler à l'API SideBySide.
 *
 * - En dev : appelle /api/* qui est proxyfié par Vite vers localhost:3000
 * - En prod : appelle l'URL configurée par VITE_API_URL (variable d'env Vercel)
 * - Si VITE_API_URL n'est pas défini en prod, les appels échouent et le code
 *   tombe gracieusement sur les données mock (cf. SearchTrips.tsx). C'est OK
 *   pour une démo statique sur Vercel sans backend déployé.
 *
 * - Ajoute automatiquement le header Authorization si on a un accessToken stocké
 * - Gère les erreurs côté serveur en levant une ApiError typée
 */

// En dev → /api (proxy Vite). En prod → VITE_API_URL ou rien.
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

const TOKEN_KEY = 'sbs:accessToken';
const REFRESH_KEY = 'sbs:refreshToken';

/* ---------------- Auth token storage ---------------- */

export function getAccessToken(): string | null {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/* ---------------- Erreurs ---------------- */

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/* ---------------- Cœur fetch ---------------- */

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;        // sera JSON.stringify
  query?: Record<string, string | number | boolean | undefined>;
  /** Désactive l'envoi du token (utile pour login). */
  noAuth?: boolean;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers = new Headers(opts.headers as HeadersInit | undefined);
  if (!headers.has('Content-Type') && opts.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (!opts.noAuth) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url.toString(), {
    method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  // Réponses vides (204)
  if (res.status === 204) return undefined as T;

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const errPayload = payload as { error?: { code?: string; message?: string; details?: unknown } } | null;
    throw new ApiError(
      res.status,
      errPayload?.error?.code ?? 'HTTP_ERROR',
      errPayload?.error?.message ?? `HTTP ${res.status}`,
      errPayload?.error?.details,
    );
  }

  return payload as T;
}

/* ---------------- Endpoints typés ---------------- */

export interface ApiUser {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  trustLevel: 'BASIC' | 'VERIFIED' | 'PREMIUM';
}

export interface ApiTrip {
  id: string;
  driverId: string;
  fromCity: string;
  toCity: string;
  pickupPoint: string;
  dropoffPoint: string;
  departureAt: string;
  durationMin: number;
  seatsTotal: number;
  seatsLeft: number;
  pricePerSeat: number;
  options: Array<'BAGAGES' | 'ANIMAUX' | 'NON_FUMEUR' | 'MUSIQUE' | 'CLIMATISATION'>;
  status: 'AVAILABLE' | 'FULL' | 'DEPARTED' | 'COMPLETED' | 'CANCELLED';
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    trustLevel: 'BASIC' | 'VERIFIED' | 'PREMIUM';
    ratingAvg: number | null;
    tripsCompleted: number;
  };
  vehicle?: { model: string; color: string; plate: string } | null;
}

export const ApiClient = {
  health: () => api<{ status: string; uptime: number; now: string }>('/health'),

  /* ---- Trips ---- */
  searchTrips: (params: { from: string; to: string; date: string; passengers?: number }) =>
    api<{ trips: ApiTrip[]; count: number }>('/trips/search', { query: params }),

  getTrip: (id: string) => api<{ trip: ApiTrip }>(`/trips/${id}`),

  /* ---- Auth ---- */
  sendOtp: (phone: string) =>
    api<{ message: string; expiresAt: string }>('/auth/send-otp', { body: { phone }, noAuth: true }),

  register: (data: {
    phone: string; otpCode: string; firstName: string; lastName: string;
    birthDate: string; password: string; role: 'PASSENGER' | 'DRIVER';
  }) => api<{ user: ApiUser; accessToken: string; refreshToken: string }>(
    '/auth/register', { body: data, noAuth: true },
  ),

  login: (phone: string, password: string) =>
    api<{ user: ApiUser; accessToken: string; refreshToken: string }>(
      '/auth/login', { body: { phone, password }, noAuth: true },
    ),

  me: () => api<{ user: ApiUser }>('/me'),
};
