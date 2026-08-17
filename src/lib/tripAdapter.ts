/**
 * Adaptateur API → modèle local.
 *
 * Le backend expose `ApiTrip` (enums en majuscules, données crues).
 * Les écrans (`SearchTrips`, `TripDetail`, `Booking`) attendent `Trip` (notre type
 * métier avec city objets, options en kebab-case, infos véhicule complètes).
 *
 * Ce module centralise la conversion pour qu'on ne la duplique pas.
 */
import { findCity } from '@/data/cities';
import type { ApiTrip } from '@/lib/api';
import type { Trip, TripOption } from '@/lib/types';

const API_OPTION_TO_LOCAL: Record<ApiTrip['options'][number], TripOption> = {
  BAGAGES: 'bagages',
  ANIMAUX: 'animaux',
  NON_FUMEUR: 'non-fumeur',
  MUSIQUE: 'musique',
  CLIMATISATION: 'climatisation',
};

const API_TRUST_TO_LOCAL: Record<ApiTrip['driver']['trustLevel'], 'basic' | 'verified' | 'premium'> = {
  BASIC: 'basic',
  VERIFIED: 'verified',
  PREMIUM: 'premium',
};

const API_AGENCY_STATUS_TO_LOCAL: Record<string, 'pending' | 'verified' | 'rejected' | 'suspended'> = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
};

/** Masque une plaque type "LT 489 AA" en "LT 4** AA". */
export function maskPlate(plate: string): string {
  if (plate.length < 5) return plate;
  return plate.replace(/(\S+\s\d)\d+/, '$1**');
}

export function adaptApiTrip(a: ApiTrip): Trip {
  const fromCity = findCity(a.fromCity) ?? { id: a.fromCity, name: a.fromCity, region: '' };
  const toCity = findCity(a.toCity) ?? { id: a.toCity, name: a.toCity, region: '' };
  return {
    id: a.id,
    driver: {
      id: a.driver.id,
      name: `${a.driver.firstName} ${a.driver.lastName}`,
      rating: a.driver.ratingAvg ?? 5,
      tripsCompleted: a.driver.tripsCompleted,
      yearsActive: 0,
      car: {
        model: a.vehicle?.model ?? 'Véhicule',
        color: a.vehicle?.color ?? '',
        plate: maskPlate(a.vehicle?.plate ?? ''),
        // L'API ne renvoie pas encore ces champs — fallback raisonnable
        type: 'berline',
        year: new Date().getFullYear() - 3,
      },
      verified: a.driver.trustLevel !== 'BASIC',
      trustLevel: API_TRUST_TO_LOCAL[a.driver.trustLevel],
    },
    from: fromCity,
    to: toCity,
    pickupPoint: a.pickupPoint,
    dropoffPoint: a.dropoffPoint,
    departureAt: a.departureAt,
    durationMin: a.durationMin,
    seatsTotal: a.seatsTotal,
    seatsLeft: a.seatsLeft,
    pricePerSeat: a.pricePerSeat,
    options: a.options.map((o) => API_OPTION_TO_LOCAL[o]),
    status: a.status === 'AVAILABLE' ? 'available'
      : a.status === 'FULL' ? 'full'
      : a.status === 'DEPARTED' ? 'departed'
      : a.status === 'COMPLETED' ? 'completed'
      : 'cancelled',
    type: a.type === 'BUS' ? 'bus' : 'car',
    providerType: a.providerType === 'AGENCY' ? 'agency' : 'individual',
    agency: a.agency
      ? {
          id: a.agency.id,
          name: a.agency.name,
          slug: a.agency.slug,
          phone: a.agency.phone,
          city: a.agency.city ?? undefined,
          status: API_AGENCY_STATUS_TO_LOCAL[a.agency.status] ?? 'pending',
        }
      : undefined,
  };
}
