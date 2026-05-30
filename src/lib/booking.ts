/**
 * Logique de réservation et paiement SideBySide
 */
import type { Trip, PaymentMethod, Child, ChildPriceTier } from './types';

export interface BookingDraft {
  tripId: string;
  seats: number;
  paymentMethod: PaymentMethod | null;
  /** Pour Mobile Money — le numéro à débiter (masqué partiellement). */
  paymentPhone: string;
}

export interface PriceBreakdown {
  basePrice: number;     // prix × places
  serviceFee: number;    // commission SideBySide
  total: number;
  driverEarning: number; // ce que touche le chauffeur
}

/** Commission SideBySide (12% sur le prix total). */
export const SBS_COMMISSION_RATE = 0.12;
/** Frais de service fixe ajoutés (équivalent ~50 F CFA d'usage Mobile Money). */
export const SBS_FIXED_FEE = 50;

export function computePrice(trip: Trip, seats: number): PriceBreakdown {
  const basePrice = trip.pricePerSeat * seats;
  const commission = Math.round(basePrice * SBS_COMMISSION_RATE);
  const serviceFee = SBS_FIXED_FEE;
  const total = basePrice + serviceFee;
  const driverEarning = basePrice - commission;
  return { basePrice, serviceFee, total, driverEarning };
}

/* ============================================================
   TARIFICATION ENFANT — 3 paliers
   ============================================================
   0 – 3 ans  : gratuit (sur les genoux, ne prend pas de place)
   4 – 11 ans : 50 % du tarif adulte (occupe une place)
   12 ans et + : tarif plein (occupe une place)
*/

/** Catégorie tarifaire d'un enfant selon son âge. */
export function getChildTier(age: number): ChildPriceTier {
  if (age <= 3) return 'free';
  if (age <= 11) return 'half';
  return 'full';
}

/** Pourcentage du tarif adulte appliqué à un enfant d'un âge donné. */
export function getChildPriceMultiplier(age: number): number {
  const tier = getChildTier(age);
  return tier === 'free' ? 0 : tier === 'half' ? 0.5 : 1;
}

/** Un enfant occupe-t-il une vraie place dans la voiture ? */
export function childTakesSeat(age: number): boolean {
  return age > 3;
}

/**
 * Calcule le détail de prix avec adultes + enfants.
 * - adults = nombre d'adultes (chacun = 1 place pleine au prix plein)
 * - children = liste des enfants (chacun avec son âge → tier auto)
 */
export interface FamilyPriceBreakdown extends PriceBreakdown {
  adultsCount: number;
  childrenFreeCount: number;
  childrenHalfCount: number;
  childrenFullCount: number;
  /** Places effectivement occupées dans la voiture (= adultes + enfants ≥ 4 ans). */
  seatsUsed: number;
}

export function computeFamilyPrice(
  trip: Trip,
  adults: number,
  children: Child[],
): FamilyPriceBreakdown {
  const childrenFree  = children.filter((c) => getChildTier(c.age) === 'free').length;
  const childrenHalf  = children.filter((c) => getChildTier(c.age) === 'half').length;
  const childrenFull  = children.filter((c) => getChildTier(c.age) === 'full').length;

  // Sous-totaux
  const adultsTotal = adults * trip.pricePerSeat;
  const childrenHalfTotal = childrenHalf * Math.round(trip.pricePerSeat * 0.5);
  const childrenFullTotal = childrenFull * trip.pricePerSeat;
  const basePrice = adultsTotal + childrenHalfTotal + childrenFullTotal;

  const commission = Math.round(basePrice * SBS_COMMISSION_RATE);
  const serviceFee = SBS_FIXED_FEE;
  const total = basePrice + serviceFee;
  const driverEarning = basePrice - commission;

  // Places utilisées dans la voiture (enfants 0-3 ans = pas de place car sur les genoux)
  const seatsUsed = adults + childrenHalf + childrenFull;

  return {
    basePrice,
    serviceFee,
    total,
    driverEarning,
    adultsCount: adults,
    childrenFreeCount: childrenFree,
    childrenHalfCount: childrenHalf,
    childrenFullCount: childrenFull,
    seatsUsed,
  };
}

/* ============================================================
   PAYMENT METHODS — Mobile Money + Carte + Portefeuille
   ============================================================ */

export interface PaymentMethodInfo {
  id: PaymentMethod;
  label: string;
  shortLabel: string;
  description: string;
  /** Couleur dominante (bg). */
  brandColor: string;
  /** Texte sur la couleur de fond. */
  textColor: string;
  /** Logo emoji (faute de logos officiels en mode mock). */
  emoji: string;
  /** Disponibilité dans le contexte CM ? */
  available: boolean;
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: 'mtn',
    label: 'MTN Mobile Money',
    shortLabel: 'MTN MoMo',
    description: 'Paiement instantané via votre numéro MTN',
    brandColor: '#FFCC00',
    textColor: '#1A1A1A',
    emoji: '📱',
    available: true,
  },
  {
    id: 'orange',
    label: 'Orange Money',
    shortLabel: 'Orange Money',
    description: 'Paiement instantané via votre numéro Orange',
    brandColor: '#FF6600',
    textColor: '#FFFFFF',
    emoji: '🟠',
    available: true,
  },
  {
    id: 'card',
    label: 'Carte bancaire',
    shortLabel: 'Carte',
    description: 'Visa / Mastercard',
    brandColor: '#1E3A8A',
    textColor: '#FFFFFF',
    emoji: '💳',
    available: true,
  },
  {
    id: 'wallet',
    label: 'Portefeuille SideBySide',
    shortLabel: 'Portefeuille',
    description: 'Solde de votre portefeuille',
    brandColor: '#10B981',
    textColor: '#FFFFFF',
    emoji: '👛',
    available: false, // débloqué après 1er trajet
  },
];

export function getPaymentInfo(id: PaymentMethod): PaymentMethodInfo {
  return PAYMENT_METHODS.find((m) => m.id === id) ?? PAYMENT_METHODS[0]!;
}

/* ============================================================
   GÉNÉRATION DE RÉFÉRENCES
   ============================================================ */

/** Génère un code de réservation lisible : "SBS-A7K9-2X4M". */
export function generateBookingRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O/1/I
  const pick = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `SBS-${pick(4)}-${pick(4)}`;
}
