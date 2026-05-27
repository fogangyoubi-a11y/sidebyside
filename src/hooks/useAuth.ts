import { useCallback, useEffect, useState } from 'react';
import { ApiClient, clearTokens, getAccessToken, setTokens, type ApiUser } from '@/lib/api';

const USER_KEY = 'sbs:user';

interface UseAuthReturn {
  user: ApiUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (phone: string, password: string) => Promise<ApiUser>;
  register: (data: Parameters<typeof ApiClient.register>[0]) => Promise<ApiUser>;
  logout: () => void;
  refresh: () => Promise<void>;
}

/** Lit l'utilisateur stocké en localStorage (si présent + token valide). */
function readStoredUser(): ApiUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ApiUser;
  } catch {
    return null;
  }
}

/**
 * Hook d'authentification SideBySide.
 *
 * - Lit le token + user au démarrage depuis localStorage
 * - Expose login/register/logout
 * - Met à jour `isAuthenticated` en temps réel
 *
 * Note : si le backend n'est pas joignable, les fonctions login/register
 * lèveront une erreur. C'est OK — le frontend les attrape et affiche un message.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<ApiUser | null>(readStoredUser);
  const [loading, setLoading] = useState(false);

  // Au montage, on tente de rafraîchir le profil (au cas où il aurait changé)
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    ApiClient.me()
      .then(({ user: u }) => {
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
      .catch(() => {
        // Token invalide / backend hors-ligne — on garde l'utilisateur en cache
        // pour ne pas le déconnecter abusivement.
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const res = await ApiClient.login(phone, password);
    setTokens(res.accessToken, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (data: Parameters<typeof ApiClient.register>[0]) => {
    const res = await ApiClient.register(data);
    setTokens(res.accessToken, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { user: u } = await ApiClient.me();
      setUser(u);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {
      /* silencieux */
    }
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    refresh,
  };
}

/* ============================================================
   Pending action — pour reprendre une réservation après login
   ============================================================ */

const PENDING_KEY = 'sbs:pendingAction';

export interface PendingBooking {
  type: 'booking';
  tripId: string;
  seats: number;
}

export function setPendingAction(action: PendingBooking): void {
  localStorage.setItem(PENDING_KEY, JSON.stringify(action));
}

export function consumePendingAction(): PendingBooking | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_KEY);
    return JSON.parse(raw) as PendingBooking;
  } catch {
    return null;
  }
}
