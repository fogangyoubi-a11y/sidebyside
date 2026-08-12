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

/** Verrou pour éviter plusieurs refresh simultanés (une seule tentative à la fois). */
let _refreshPromise: Promise<string | null> | null = null;

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

/**
 * Tente de renouveler le token d'accès silencieusement.
 * Retourne le nouveau accessToken, ou null si le refresh échoue.
 * Un seul appel simultané est possible (verrou _refreshPromise).
 */
async function silentRefresh(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = typeof localStorage !== 'undefined'
      ? localStorage.getItem(REFRESH_KEY)
      : null;

    if (!refreshToken) return null;

    try {
      const res = await fetch(new URL(BASE + '/auth/refresh', window.location.origin).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        // Refresh échoué (token révoqué / expiré) → déconnecter
        clearTokens();
        localStorage.removeItem('sbs:user');
        return null;
      }

      const data = await res.json() as { accessToken: string; refreshToken: string };
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
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

export async function api<T = unknown>(
  path: string,
  opts: ApiOptions = {},
  _isRetry = false,
): Promise<T> {
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

  // ── Refresh automatique sur 401 ──────────────────────────────────
  // Si la requête échoue avec 401 (token expiré) et qu'on n'est pas
  // déjà en train de retenter, on tente un refresh silencieux puis
  // on relance la requête originale une seule fois.
  if (res.status === 401 && !opts.noAuth && !_isRetry) {
    const newToken = await silentRefresh();
    if (newToken) {
      // Relancer la requête avec le nouveau token
      return api<T>(path, opts, true);
    }
    // Refresh échoué → forcer déconnexion via événement personnalisé
    window.dispatchEvent(new CustomEvent('sbs:session-expired'));
    throw new ApiError(401, 'SESSION_EXPIRED', 'Session expirée, veuillez vous reconnecter');
  }

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

/** Profil complet retourné par GET /me — inclut les stats et statuts KYC. */
export interface ApiUserFull extends ApiUser {
  email: string | null;
  birthDate: string;
  ratingAvg: number | null;
  tripsCompleted: number;
  identityVerified: boolean;
  selfieMatched: boolean;
  licenseVerified: boolean;
  bio: string | null;
  createdAt: string;
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

  /** Mes trajets publiés (chauffeur). DRIVER uniquement, sinon 403. */
  myDriverTrips: () =>
    api<{ trips: ApiDriverTrip[]; count: number }>('/trips/mine'),

  /** Annule un trajet — DRIVER (le propriétaire). Cascade : bookings actives + notif conv. */
  cancelTrip: (id: string) =>
    api<{ trip: ApiTrip; cancelledBookings: number }>(`/trips/${id}/cancel`, { method: 'POST' }),

  /** Publier un trajet — DRIVER uniquement, sinon 403. */
  publishTrip: (data: {
    fromCity: string;
    toCity: string;
    pickupPoint: string;
    dropoffPoint: string;
    /** ISO 8601 (ex. "2026-06-04T07:30:00.000Z"). */
    departureAt: string;
    durationMin: number;
    seatsTotal: number;
    pricePerSeat: number;
    options: Array<'BAGAGES' | 'ANIMAUX' | 'NON_FUMEUR' | 'MUSIQUE' | 'CLIMATISATION'>;
    vehicleId?: string;
  }) => api<{ trip: ApiTrip }>('/trips', { body: data }),

  /* ---- Auth ---- */
  sendOtp: (phone: string) =>
    api<{
      message: string;
      expiresAt: string;
      cooldownUntil: string;
      /** Présent uniquement en dev+mock (OTP_PROVIDER=mock côté backend). */
      devCode?: string;
    }>('/auth/send-otp', { body: { phone }, noAuth: true }),

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

  /** Profil complet (stats + statuts KYC). Endpoint identique à `me()` mais typage enrichi. */
  meFull: () => api<{ user: ApiUserFull }>('/me'),

  /** Révoque la session backend (refresh token). Idempotent côté serveur. */
  logout: (refreshToken: string) =>
    api<{ ok: true }>('/auth/logout', { body: { refreshToken }, noAuth: true }),

  /** Déclenche une alerte SOS — enregistrée en DB + loggée côté backend. */
  triggerSos: (data: {
    action: 'CALL_POLICE' | 'CALL_GENDARMERIE' | 'CALL_AMBULANCE' | 'CALL_SBS_SUPPORT' | 'SHARE_LOCATION';
    tripId?: string;
    latitude?: number;
    longitude?: number;
  }) => api<{ alert: ApiSosAlert }>('/sos', { body: data }),

  /* ---- Bookings ---- */
  createBooking: (data: { tripId: string; seats: number; paymentMethod?: 'MOBILE_MONEY' | 'CASH' }) =>
    api<{ booking: ApiBooking }>('/bookings', { body: data }),

  myBookings: () =>
    api<{ bookings: ApiBookingWithTrip[] }>('/bookings/mine'),

  cancelBooking: (id: string) =>
    api<{ booking: ApiBooking }>(`/bookings/${id}/cancel`, { method: 'POST' }),

  /** Réservations cash en attente de confirmation (vue chauffeur). */
  getDriverBookingRequests: () =>
    api<{ bookings: ApiDriverBookingRequest[] }>('/bookings/driver-requests'),

  /** Le chauffeur accepte une réservation cash → CONFIRMED. */
  acceptBooking: (id: string) =>
    api<{ success: boolean; bookingId: string; status: string }>(`/bookings/${id}/accept`, { method: 'POST' }),

  /** Le chauffeur refuse une réservation cash → CANCELLED. */
  rejectBooking: (id: string) =>
    api<{ success: boolean; bookingId: string; status: string }>(`/bookings/${id}/reject`, { method: 'POST' }),

  /* ---- Paiements Campay ---- */
  initiatePayment: (data: { bookingId: string; phone: string; operator: 'MTN' | 'ORANGE' }) =>
    api<{ paymentId: string; campayRef: string; status: string; message?: string }>(
      '/payments/initiate', { body: data },
    ),

  getPaymentStatus: (campayRef: string) =>
    api<{ status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'; bookingStatus: string; reason?: string }>(
      `/payments/${campayRef}/status`,
    ),

  /* ---- Wallet chauffeur ---- */
  getWallet: () =>
    api<{
      wallet: {
        balance: number;
        commissionDue: number;
        totalEarned: number;
        totalCommission: number;
        tripsThisMonth: number;
        tripsTotal: number;
        lastPayoutAt: string | null;
        payoutDeadline: string | null;
        accountStatus: 'active' | 'suspended' | 'banned';
        currentCommissionRate: number;
        ratingAvg: number | null;
      };
      recentTransactions: Array<{
        reference: string;
        fromCity: string;
        toCity: string;
        departureAt: string;
        seats: number;
        driverEarning: number;
        basePrice: number;
        status: string;
        createdAt: string;
      }>;
    }>('/wallet'),

  /* ---- Notations ---- */
  submitRating: (data: { bookingId: string; score: number; comment?: string }) =>
    api<{ rating: { id: string; bookingId: string; score: number; comment: string | null; createdAt: string } }>(
      '/ratings', { body: data },
    ),

  getDriverRatings: (driverId: string) =>
    api<{
      driverId: string;
      ratingAvg: number | null;
      totalCount: number;
      ratings: Array<{ id: string; score: number; comment: string | null; passengerFirstName: string; createdAt: string }>;
    }>(`/ratings/driver/${driverId}`),

  /* ---- Conversations / messagerie ---- */
  getConversations: () =>
    api<{ conversations: ApiConversation[] }>('/conversations'),

  getMessages: (conversationId: string) =>
    api<{ messages: ApiMessage[] }>(`/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, content: string) =>
    api<{ message: ApiMessage }>(`/conversations/${conversationId}/messages`, { body: { content } }),

  /* ---- Newsletter (public) ---- */
  newsletterSubscribe: (data: {
    email: string;
    firstName: string;
    city?: string;
    axes?: string[];
    source?: 'DIASPORA_LANDING' | 'HOMEPAGE' | 'FOOTER' | 'OTHER';
  }) => api<{ ok: true; requiresConfirmation: boolean }>(
    '/newsletter/subscribe',
    { body: data, noAuth: true },
  ),

  /* ---- Admin (role=ADMIN requis) ---- */
  adminDashboard: () => api<ApiAdminDashboard>('/admin/dashboard'),

  adminRecentUsers: () =>
    api<{ users: ApiAdminUser[]; page: number; limit: number; total: number }>(
      '/admin/users',
      { query: { page: 1, limit: 20 } },
    ),

  adminRecentBookings: () =>
    api<{ bookings: ApiAdminBooking[] }>('/admin/bookings/recent'),

  adminNewsletter: () =>
    api<{ subscribers: ApiAdminNewsletter[]; page: number; limit: number; total: number }>(
      '/admin/newsletter',
      { query: { page: 1, limit: 50 } },
    ),
};

/* ---- Admin types ---- */

export interface ApiAdminDashboard {
  users: number;
  usersThisWeek: number;
  passengers: number;
  drivers: number;
  trips: number;
  tripsAvailable: number;
  bookings: number;
  bookingsConfirmed: number;
  /** F CFA — somme totalAmount des bookings CONFIRMED+COMPLETED des 30 derniers jours. */
  revenue30d: number;
  /** F CFA — somme serviceFee (commission SideBySide) des 30 derniers jours. */
  commission30d: number;
  sosAlerts: number;
  pendingKyc: number;
  newsletterCount: number;
  newsletterSubscribed: number;
}

export interface ApiAdminUser {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  trustLevel: 'BASIC' | 'VERIFIED' | 'PREMIUM';
  suspendedAt: string | null;
  createdAt: string;
}

export interface ApiAdminBooking {
  id: string;
  reference: string;
  seats: number;
  totalAmount: number;
  serviceFee: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  trip: { fromCity: string; toCity: string; departureAt: string };
  passenger: { id: string; firstName: string; lastName: string; phone: string };
}

export interface ApiAdminNewsletter {
  id: string;
  email: string;
  firstName: string;
  city: string | null;
  axes: string[];
  source: 'DIASPORA_LANDING' | 'HOMEPAGE' | 'FOOTER' | 'OTHER';
  status: 'PENDING' | 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'CLEANED';
  confirmedAt: string | null;
  createdAt: string;
}

/* ---- Conversation types ---- */

export type ApiTrustLevel = 'BASIC' | 'VERIFIED' | 'PREMIUM';
export type ApiMessageSender = 'PASSENGER' | 'DRIVER' | 'SYSTEM';

export interface ApiMessage {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderType: ApiMessageSender;
  content: string;
  readAt: string | null;
  sentAt: string;
}

export interface ApiConversation {
  id: string;
  tripId: string;
  driverId: string;
  passengerId: string;
  lastMessageAt: string;
  createdAt: string;
  unreadCount: number;
  trip: { fromCity: string; toCity: string; departureAt: string };
  driver: { id: string; firstName: string; lastName: string; trustLevel: ApiTrustLevel };
  passenger: { id: string; firstName: string; lastName: string; trustLevel: ApiTrustLevel };
  /** Le backend renvoie le DERNIER message (take: 1). */
  messages: ApiMessage[];
}

/* ---- Booking types ---- */

export interface ApiBooking {
  id: string;
  reference: string;       // ex. "SBS-A7K9-2X4M"
  tripId: string;
  passengerId: string;
  seats: number;
  basePrice: number;       // F CFA — prix par place × seats
  serviceFee: number;      // F CFA — commission fixe
  totalAmount: number;     // basePrice + serviceFee
  driverEarning: number;
  paymentMethod?: 'MOBILE_MONEY' | 'CASH';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  cancelledAt?: string | null;
  /** Conversation créée automatiquement entre chauffeur et passager à la réservation. */
  conversationId?: string;
}

/** Réservation cash en attente de confirmation — vue chauffeur. */
export interface ApiDriverBookingRequest {
  id: string;
  reference: string;
  tripId: string;
  seats: number;
  totalAmount: number;
  driverEarning: number;
  paymentMethod: 'CASH';
  status: 'PENDING';
  createdAt: string;
  trip: { fromCity: string; toCity: string; departureAt: string; pickupPoint: string; dropoffPoint: string };
  passenger: { id: string; firstName: string; lastName: string; phone: string; trustLevel: string };
}

export interface ApiBookingWithTrip extends ApiBooking {
  trip: ApiTrip & {
    driver: { firstName: string; lastName: string; trustLevel: 'BASIC' | 'VERIFIED' | 'PREMIUM' };
  };
  payment?: unknown;
  /** true si le passager a déjà noté ce trajet. */
  rated?: boolean;
}

/** Trajet retourné par GET /trips/mine — inclut les réservations actives. */
export interface ApiDriverTrip extends ApiTrip {
  bookings: Array<{ id: string; seats: number; status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' }>;
}

/** Alerte SOS retournée par POST /sos. */
export interface ApiSosAlert {
  id: string;
  userId: string;
  tripId: string | null;
  action: 'CALL_POLICE' | 'CALL_GENDARMERIE' | 'CALL_AMBULANCE' | 'CALL_SBS_SUPPORT' | 'SHARE_LOCATION';
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}
