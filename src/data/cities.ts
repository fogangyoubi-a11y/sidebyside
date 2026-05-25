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
