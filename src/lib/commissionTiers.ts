/**
 * Modèle de commission dégressive SideBySide.
 *
 * Paliers mensuels :
 *   1 – 10 trajets  → 15 %
 *  11 – 20 trajets  → 12 %
 *  21 +  trajets    → 10 %
 *
 * Ce fichier est ADDITIONNEL : il n'écrase pas booking.ts.
 * Les nouveaux écrans (DriverWallet, PublishTrip futur) importent ici
 * pour afficher/calculer le taux en temps réel.
 */

export interface CommissionTier {
  /** Nombre de trajets minimum pour ce palier. */
  minTrips: number;
  /** Nombre de trajets maximum (inclus) pour ce palier. null = pas de plafond. */
  maxTrips: number | null;
  /** Taux en fraction décimale (ex. 0.15 pour 15 %). */
  rate: number;
  /** Libellé affiché. */
  label: string;
}

export const COMMISSION_TIERS: CommissionTier[] = [
  { minTrips:  1, maxTrips: 10, rate: 0.15, label: '15 %' },
  { minTrips: 11, maxTrips: 20, rate: 0.12, label: '12 %' },
  { minTrips: 21, maxTrips: null, rate: 0.10, label: '10 %' },
];

/**
 * Retourne le taux de commission applicable pour un chauffeur
 * ayant réalisé `tripsThisMonth` trajets dans le mois en cours.
 */
export function getCommissionRate(tripsThisMonth: number): number {
  for (const tier of COMMISSION_TIERS) {
    if (tier.maxTrips === null || tripsThisMonth <= tier.maxTrips) {
      return tier.rate;
    }
  }
  return COMMISSION_TIERS[COMMISSION_TIERS.length - 1]!.rate;
}

/**
 * Retourne le palier actif complet (utile pour l'affichage dans le wallet).
 */
export function getCurrentTier(tripsThisMonth: number): CommissionTier {
  for (const tier of COMMISSION_TIERS) {
    if (tier.maxTrips === null || tripsThisMonth <= tier.maxTrips) {
      return tier;
    }
  }
  return COMMISSION_TIERS[COMMISSION_TIERS.length - 1]!;
}

/**
 * Prochain palier (undefined si le chauffeur est déjà au meilleur taux).
 */
export function getNextTier(tripsThisMonth: number): CommissionTier | undefined {
  const current = getCurrentTier(tripsThisMonth);
  const idx = COMMISSION_TIERS.indexOf(current);
  return COMMISSION_TIERS[idx + 1];
}

/**
 * Trajets restants pour atteindre le palier suivant.
 * Retourne 0 si déjà au meilleur taux.
 */
export function tripsUntilNextTier(tripsThisMonth: number): number {
  const next = getNextTier(tripsThisMonth);
  if (!next) return 0;
  return next.minTrips - tripsThisMonth;
}

/* ============================================================
   REMISE PAIEMENT DIGITAL
   ============================================================ */

/** Réduction accordée au passager qui paie en mobile money (vs espèces). */
export const DIGITAL_PAYMENT_DISCOUNT_XAF = 200;

/** Méthodes de paiement considérées "digitales" (déclenchent la remise). */
export const DIGITAL_PAYMENT_METHODS = ['mtn', 'orange'] as const;

export type DigitalPaymentMethod = typeof DIGITAL_PAYMENT_METHODS[number];

export function isDigitalPayment(method: string): method is DigitalPaymentMethod {
  return (DIGITAL_PAYMENT_METHODS as readonly string[]).includes(method);
}

/* ============================================================
   TARIFS OFFICIELS MVP
   ============================================================ */

/** Tarifs officiels par niveau de confort (F CFA / passager, axe Douala-Bafoussam). */
export const OFFICIAL_PRICES: Record<'standard' | 'confort' | 'vip', number> = {
  standard: 4_500,
  confort:  6_500,
  vip:      7_500,
};
