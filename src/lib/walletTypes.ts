/**
 * Types pour le portefeuille chauffeur SideBySide.
 * Fichier ADDITIONNEL — n'écrase pas types.ts.
 */

export interface DriverWallet {
  /** Solde disponible (gains nets après commission). */
  balance: number;
  /** Commission SIDEBYSIDE accumulée, non encore reversée. */
  commissionDue: number;
  /** Gains bruts cumulés depuis le début. */
  totalEarned: number;
  /** Commissions totales payées depuis le début. */
  totalCommission: number;
  /** Nombre de trajets réalisés dans le mois en cours. */
  tripsThisMonth: number;
  /** Nombre total de trajets réalisés. */
  tripsTotal: number;
  /** Date du dernier versement (ISO), null si jamais versé. */
  lastPayoutAt: string | null;
  /**
   * Date limite de reversement de commission.
   * Si null ou dépassée, le compte peut être suspendu.
   */
  payoutDeadline: string | null;
  /** Statut du compte chauffeur. */
  accountStatus: 'active' | 'suspended' | 'banned';
  /** Taux de commission actuel (15, 12 ou 10). */
  currentCommissionRate: number;
}

/** Type de chauffeur : individuel (voiture perso) ou rattaché à une agence. */
export type DriverType = 'particulier' | 'agence';
