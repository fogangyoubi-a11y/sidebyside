import type { SearchFilters, Trip } from './types';
import { TRIPS } from '@/data/trips';

/**
 * Recherche de trajets selon les filtres saisis par le passager.
 * Filtre par : itinéraire, date (jour exact), nombre de places dispo, prix max, note min, options.
 */
export function searchTrips(filters: SearchFilters, source: Trip[] = TRIPS): Trip[] {
  return source.filter((trip) => {
    if (trip.status !== 'available') return false;
    if (trip.from.id !== filters.fromId) return false;
    if (trip.to.id !== filters.toId) return false;

    // Jour exact (YYYY-MM-DD)
    const tripDay = trip.departureAt.slice(0, 10);
    if (tripDay !== filters.date) return false;

    // Places disponibles
    if (trip.seatsLeft < filters.passengers) return false;

    // Prix max
    if (filters.maxPrice !== undefined && trip.pricePerSeat > filters.maxPrice) return false;

    // Note minimum chauffeur
    if (filters.minRating !== undefined && trip.driver.rating < filters.minRating) return false;

    // Options souhaitées (toutes doivent être présentes)
    if (filters.options && filters.options.length > 0) {
      const has = filters.options.every((o) => trip.options.includes(o));
      if (!has) return false;
    }

    return true;
  });
}

/** Date du jour au format YYYY-MM-DD. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
