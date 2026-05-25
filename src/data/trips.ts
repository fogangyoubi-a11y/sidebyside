import type { Trip, DriverProfile } from '@/lib/types';
import { findCity } from './cities';

/**
 * Mock data — trajets disponibles sur l'axe Douala ↔ Bafoussam (MVP).
 * Les ID sont stables pour permettre le routing trip-detail / booking.
 */

const DRIVERS: DriverProfile[] = [
  {
    id: 'd1',
    name: 'Achille Nkomo',
    rating: 4.8,
    tripsCompleted: 142,
    yearsActive: 3,
    car: { model: 'Toyota Corolla', color: 'Blanc', plate: 'LT 4** AA' },
    verified: true,
    trustLevel: 'premium',
    bio: 'Chauffeur expérimenté, ponctuel. J\'aime la conduite calme et la bonne musique.',
  },
  {
    id: 'd2',
    name: 'Marlène Tchoumi',
    rating: 4.9,
    tripsCompleted: 89,
    yearsActive: 2,
    car: { model: 'Hyundai i10', color: 'Gris', plate: 'OU 7** BC' },
    verified: true,
    trustLevel: 'premium',
    bio: 'Conductrice attentive. Voiture climatisée et propre. Trajets sans-fumeur uniquement.',
  },
  {
    id: 'd3',
    name: 'Joël Manga',
    rating: 4.5,
    tripsCompleted: 56,
    yearsActive: 1,
    car: { model: 'Renault Logan', color: 'Bleu', plate: 'LT 2** XY' },
    verified: true,
    trustLevel: 'verified',
    bio: 'Étudiant, je fais ce trajet chaque vendredi pour rejoindre ma famille.',
  },
  {
    id: 'd4',
    name: 'Émile Kamga',
    rating: 4.7,
    tripsCompleted: 211,
    yearsActive: 5,
    car: { model: 'Toyota RAV4', color: 'Noir', plate: 'CE 9** ZZ' },
    verified: true,
    trustLevel: 'premium',
    bio: 'Cinq années de covoiturage. Bagages volumineux acceptés.',
  },
  {
    id: 'd5',
    name: 'Sandrine Mbarga',
    rating: 4.6,
    tripsCompleted: 73,
    yearsActive: 2,
    car: { model: 'Suzuki Swift', color: 'Rouge', plate: 'OU 5** KL' },
    verified: false,
    trustLevel: 'basic',
    bio: 'Je fais Douala-Bafoussam le week-end. Trajets en musique gospel.',
  },
];

const douala = findCity('douala')!;
const bafoussam = findCity('bafoussam')!;

function isoTime(daysFromNow: number, hours: number, minutes = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export const TRIPS: Trip[] = [
  {
    id: 't1',
    driver: DRIVERS[0]!,
    from: douala,
    to: bafoussam,
    pickupPoint: 'Rond-point Bonamoussadi, Douala',
    dropoffPoint: 'Carrefour Akwa, Bafoussam',
    departureAt: isoTime(0, 6, 30),
    durationMin: 240,
    seatsTotal: 4,
    seatsLeft: 3,
    pricePerSeat: 4000,
    options: ['bagages', 'climatisation', 'non-fumeur'],
    status: 'available',
  },
  {
    id: 't2',
    driver: DRIVERS[1]!,
    from: douala,
    to: bafoussam,
    pickupPoint: 'Gare de Bessengue, Douala',
    dropoffPoint: 'Marché A, Bafoussam',
    departureAt: isoTime(0, 9, 0),
    durationMin: 255,
    seatsTotal: 3,
    seatsLeft: 2,
    pricePerSeat: 3500,
    options: ['climatisation', 'non-fumeur', 'musique'],
    status: 'available',
  },
  {
    id: 't3',
    driver: DRIVERS[2]!,
    from: douala,
    to: bafoussam,
    pickupPoint: 'Carrefour Ndokoti, Douala',
    dropoffPoint: 'Carrefour Famla, Bafoussam',
    departureAt: isoTime(0, 14, 15),
    durationMin: 270,
    seatsTotal: 4,
    seatsLeft: 4,
    pricePerSeat: 3000,
    options: ['bagages', 'musique'],
    status: 'available',
  },
  {
    id: 't4',
    driver: DRIVERS[3]!,
    from: douala,
    to: bafoussam,
    pickupPoint: 'Hotel Ibis, Douala',
    dropoffPoint: 'Place des Fêtes, Bafoussam',
    departureAt: isoTime(1, 7, 0),
    durationMin: 230,
    seatsTotal: 4,
    seatsLeft: 1,
    pricePerSeat: 5000,
    options: ['bagages', 'animaux', 'climatisation', 'non-fumeur'],
    status: 'available',
  },
  {
    id: 't5',
    driver: DRIVERS[4]!,
    from: douala,
    to: bafoussam,
    pickupPoint: 'Bonapriso, Douala',
    dropoffPoint: 'Marché A, Bafoussam',
    departureAt: isoTime(1, 16, 0),
    durationMin: 260,
    seatsTotal: 3,
    seatsLeft: 2,
    pricePerSeat: 3500,
    options: ['musique', 'climatisation'],
    status: 'available',
  },
  // Retour
  {
    id: 't6',
    driver: DRIVERS[0]!,
    from: bafoussam,
    to: douala,
    pickupPoint: 'Carrefour Akwa, Bafoussam',
    dropoffPoint: 'Rond-point Bonamoussadi, Douala',
    departureAt: isoTime(2, 8, 0),
    durationMin: 245,
    seatsTotal: 4,
    seatsLeft: 4,
    pricePerSeat: 4000,
    options: ['bagages', 'climatisation'],
    status: 'available',
  },
];

export function findTrip(id: string): Trip | undefined {
  return TRIPS.find((t) => t.id === id);
}
