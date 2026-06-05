/**
 * Currency — conversion F CFA ↔ EUR.
 *
 * Le Franc CFA (XAF) est arrimé à l'Euro par traité historique.
 * Le taux est **fixe** et garanti par la Banque de France :
 *
 *   1 EUR = 655.957 XAF (F CFA)
 *
 * → Pas besoin d'API forex, pas de fluctuation, pas de risque de change.
 *
 * Source : https://www.banque-france.fr/fr/lzone-franc-cfa
 */

/** Taux fixe garanti depuis 1999. */
export const CFA_EUR_RATE = 655.957;

/** Convertit un montant XAF en EUR. */
export function cfaToEur(cfa: number): number {
  return cfa / CFA_EUR_RATE;
}

/** Convertit un montant EUR en XAF (arrondi entier — pas de centimes en F CFA). */
export function eurToCfa(eur: number): number {
  return Math.round(eur * CFA_EUR_RATE);
}

/** Formate un montant en F CFA — sans décimales (ex: "4 050 F CFA"). */
export function formatCFA(cfa: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(cfa)) + ' F CFA';
}

/** Formate un montant en EUR avec 2 décimales (ex: "6,17 €"). */
export function formatEUR(eur: number): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(eur) + ' €';
}

/**
 * Format dual — affiche les 2 devises côte à côte (utile mode "gift" diaspora).
 *
 * Exemples :
 *   formatDualCFAEUR(4050)            → "4 050 F CFA · 6,17 €"
 *   formatDualCFAEUR(4050, { sep: ' • ' }) → "4 050 F CFA • 6,17 €"
 *   formatDualCFAEUR(4050, { primary: 'eur' }) → "6,17 € · 4 050 F CFA"
 */
export function formatDualCFAEUR(
  cfa: number,
  opts?: { sep?: string; primary?: 'cfa' | 'eur' },
): string {
  const sep = opts?.sep ?? ' · ';
  const cfaStr = formatCFA(cfa);
  const eurStr = formatEUR(cfaToEur(cfa));
  return opts?.primary === 'eur' ? `${eurStr}${sep}${cfaStr}` : `${cfaStr}${sep}${eurStr}`;
}

/** Le pays détecté est-il dans la zone euro (utile pour décider du format affiché) ? */
export function isEuroZoneLocale(locale: string): boolean {
  // Liste minimaliste — étendre si besoin.
  return /^fr-(BE|FR|LU)|^nl-(BE|NL)|^de-(DE|AT)|^it-IT|^es-ES|^pt-PT|^fi-FI|^el-GR|^en-IE/.test(locale);
}
