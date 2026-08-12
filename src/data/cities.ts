import type { City } from '@/lib/types';

/**
 * Villes camerounaises desservies par SideBySide.
 * Le MVP couvre l'axe Douala–Bafoussam ; les autres sont déjà déclarées pour l'extension.
 */
export const CITIES: City[] = [
  { id: 'douala',     name: 'Douala',     region: 'Littoral' },
  { id: 'bafoussam',  name: 'Bafoussam',  region: 'Ouest' },
  { id: 'yaounde',    name: 'Yaoundé',    region: 'Centre' },
  { id: 'bamenda',    name: 'Bamenda',    region: 'Nord-Ouest' },
  { id: 'limbe',      name: 'Limbé',      region: 'Sud-Ouest' },
  { id: 'kribi',      name: 'Kribi',      region: 'Sud' },
  { id: 'dschang',    name: 'Dschang',    region: 'Ouest' },
  { id: 'nkongsamba', name: 'Nkongsamba', region: 'Littoral' },
];

export function findCity(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

/** Distance approximative en km entre 2 villes (lookup table) — utilisée pour les estimations. */
const DISTANCES: Record<string, Record<string, number>> = {
  douala: { bafoussam: 290, yaounde: 245, kribi: 175, limbe: 65, nkongsamba: 145 },
  bafoussam: { douala: 290, yaounde: 290, bamenda: 75, dschang: 60 },
};

export function distanceBetween(fromId: string, toId: string): number {
  return DISTANCES[fromId]?.[toId] ?? DISTANCES[toId]?.[fromId] ?? 0;
}

/* ============================================================
   POINTS DE DÉPART SUGGÉRÉS
   ============================================================ */

export interface DeparturePoint {
  name: string;
  lat: number;
  lng: number;
}

/** Points de départ suggérés par ville (carrefours connus, faciles à trouver). */
export const DEPARTURE_POINTS: Record<string, DeparturePoint[]> = {
  douala: [
    { name: 'Carrefour Ndokoti',      lat: 4.0511, lng: 9.7679 },
    { name: 'Carrefour Deido',         lat: 4.0601, lng: 9.7051 },
    { name: 'Carrefour Bonamoussadi',  lat: 4.0789, lng: 9.7412 },
    { name: 'Carrefour Bassa',         lat: 3.9998, lng: 9.7523 },
  ],
  bafoussam: [
    { name: 'Marché A',                lat: 5.4737, lng: 10.4172 },
    { name: 'Carrefour Bamendzi',      lat: 5.4812, lng: 10.4098 },
    { name: 'Gare routière centrale',  lat: 5.4701, lng: 10.4221 },
  ],
};
