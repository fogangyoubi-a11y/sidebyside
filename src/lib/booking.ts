/**
 * Logique de réservation et paiement SideBySide
 */
import type { Trip, PaymentMethod } from './types';

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
