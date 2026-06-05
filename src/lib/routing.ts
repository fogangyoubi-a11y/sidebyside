/**
 * Routing SideBySide — pont entre l'API existante `onNavigate(screen, params)`
 * et `react-router-dom` v7.
 *
 * Les composants existants continuent d'appeler `onNavigate('booking', { tripId: 't1' })` :
 * `useScreenNavigate()` traduit ça en URL réelle (`/booking/t1`) et appelle `navigate(url)`.
 *
 * Avantages :
 *  - URLs partageables (`https://sidebyside.cm/trip/cm123`)
 *  - SEO + Open Graph par page (cf. react-helmet-async)
 *  - Back/forward navigateur fonctionnel
 *  - Aucun composant existant n'a besoin d'être modifié
 */

import { useNavigate } from 'react-router-dom';
import type { Screen } from './types';

/**
 * Convertit un (Screen, params) en URL réelle.
 * Exposé pour tests + pour construire des liens `<Link to={...}>` au besoin.
 */
export function screenToPath(screen: Screen, params: Record<string, string> = {}): string {
  switch (screen) {
    // Landing principale + home (= landing tant que les écrans home dédiés n'existent pas)
    case 'landing':
    case 'home-passenger':
    case 'home-driver':
      return '/';

    // Landing diaspora (étape 3)
    case 'diaspora':
      return '/diaspora';

    // Inscription / connexion
    case 'onboarding':
    case 'auth':
    case 'role-pick':
      return '/onboarding';
    case 'login':
      return '/login';

    // Recherche
    case 'search':
    case 'search-results': {
      const qs = new URLSearchParams();
      if (params.from) qs.set('from', params.from);
      if (params.to) qs.set('to', params.to);
      const q = qs.toString();
      return q ? `/search?${q}` : '/search';
    }

    // Détail trajet
    case 'trip-detail':
      return `/trip/${encodeURIComponent(params.tripId ?? 't1')}`;

    // Réservation (les sous-étapes who/recap/method/pay/success restent gérées en interne)
    case 'booking':
    case 'payment':
    case 'booking-confirmed': {
      const tripId = encodeURIComponent(params.tripId ?? 't1');
      const qs = new URLSearchParams();
      if (params.seats) qs.set('seats', params.seats);
      if (params.mode) qs.set('mode', params.mode);
      const q = qs.toString();
      return q ? `/booking/${tripId}?${q}` : `/booking/${tripId}`;
    }

    // Chauffeur
    case 'publish-trip':
      return '/publish';

    // Espaces utilisateur
    case 'my-trips':
    case 'driver-trips':
      return '/my-trips';
    case 'messages':
      return '/messages';
    case 'profile':
      return '/profile';
    case 'admin':
      return '/admin';

    default:
      return '/';
  }
}

/**
 * Hook React qui renvoie une fonction `navigate(screen, params)` identique
 * à l'ancienne API, mais qui pousse une vraie URL dans l'historique.
 *
 * Usage dans App.tsx :
 *   const navigate = useScreenNavigate();
 *   <LandingPage onNavigate={navigate} />
 */
export function useScreenNavigate() {
  const nav = useNavigate();
  return (screen: Screen, params: Record<string, string> = {}) => {
    const path = screenToPath(screen, params);
    nav(path);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
}
