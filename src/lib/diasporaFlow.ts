/**
 * Diaspora Flow — gestion du "contexte diaspora" pendant un parcours utilisateur.
 *
 * Quand un visiteur clique sur "Offrir un trajet" depuis la landing /diaspora,
 * on pose un flag en sessionStorage. Ce flag survit à la navigation
 * (Search → TripDetail → Booking) sans avoir à propager `?mode=gift` dans toutes les URLs.
 *
 * Avantages :
 *  - Code minimal (uniquement 2 écrans à modifier : DiasporaLanding et Booking)
 *  - Le flag meurt naturellement avec l'onglet (pas de pollution permanente)
 *  - Aussi consultable par SearchTrips pour afficher un bandeau de contexte
 *
 * Limites :
 *  - Si l'utilisateur ouvre un lien dans un nouvel onglet, le flag est perdu
 *  - Pour les pubs Facebook qui linkent direct vers /booking?mode=gift, on garde
 *    le query param URL en parallèle (ceinture + bretelles)
 */

const KEY = 'sbs:diaspora-flow';

/** Marque le visiteur comme "venant de /diaspora en mode gift". */
export function setDiasporaFlow(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    // sessionStorage peut etre desactive (mode prive Firefox, etc.) — on ignore.
  }
}

/** Vérifie si on est dans le flow diaspora (a cliqué sur "Offrir un trajet"). */
export function isDiasporaFlow(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** Termine explicitement le flow diaspora (ex: l'utilisateur a choisi 'self' ou 'family'). */
export function clearDiasporaFlow(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
