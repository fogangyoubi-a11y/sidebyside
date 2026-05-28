/**
 * Catégorisation automatique des trajets en 3 niveaux : Économique / Confort / Premium VIP.
 *
 * Inspiré des codes des agences camerounaises (Classique / VIP) + de la logique
 * UberX / UberComfort / UberBlack. Le but : permettre au passager de **choisir**
 * son niveau de confort, sans exclure les chauffeurs économiques.
 *
 * Règles :
 *  - PREMIUM  : SUV ou 4x4, < 5 ans, avec climatisation
 *  - CONFORT  : tout véhicule < 8 ans, avec climatisation
 *  - ÉCONOMIQUE : tout le reste (ce qui circule déjà, et c'est très bien)
 */
import type { TripCategory, TripOption, VehicleType } from './types';

const CURRENT_YEAR = new Date().getFullYear();

export function computeTripCategory(
  type: VehicleType,
  year: number,
  options: TripOption[],
): TripCategory {
  const isPremiumType = type === 'suv' || type === '4x4';
  const isRecent = year >= CURRENT_YEAR - 5;
  const isMidRecent = year >= CURRENT_YEAR - 8;
  const hasClim = options.includes('climatisation');

  if (isPremiumType && isRecent && hasClim) return 'premium';
  if (isMidRecent && hasClim) return 'confort';
  return 'economique';
}

/* ============================================================
   Labels et styles d'affichage par catégorie
   ============================================================ */

export interface CategoryInfo {
  label: string;
  shortLabel: string;
  emoji: string;
  tagline: string;
  /** Classe Tailwind pour fond du badge. */
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const CATEGORY_INFO: Record<TripCategory, CategoryInfo> = {
  economique: {
    label: 'Économique',
    shortLabel: 'Éco',
    emoji: '🟢',
    tagline: 'Le bon plan, le trajet partagé classique',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
  },
  confort: {
    label: 'Confort',
    shortLabel: 'Confort',
    emoji: '🔵',
    tagline: 'Véhicule récent, climatisation, plus d\'espace',
    bgClass: 'bg-sbs-blue-light',
    textClass: 'text-sbs-blue',
    borderClass: 'border-sbs-blue/30',
  },
  premium: {
    label: 'Premium VIP',
    shortLabel: 'VIP',
    emoji: '🟡',
    tagline: 'SUV/4×4 récent, climatisation premium, expérience haut de gamme',
    bgClass: 'bg-gradient-to-br from-sbs-yellow-light to-sbs-yellow/40',
    textClass: 'text-sbs-yellow-dark',
    borderClass: 'border-sbs-yellow',
  },
};

/** Labels lisibles pour les types de véhicule. */
export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  berline: 'Berline',
  citadine: 'Citadine',
  suv: 'SUV',
  '4x4': '4×4',
  monospace: 'Monospace',
};

/** Ordre d'affichage du plus haut au plus bas niveau de confort. */
export const CATEGORY_ORDER: TripCategory[] = ['premium', 'confort', 'economique'];

/* ============================================================
   Fourchettes de prix par catégorie (en F CFA, axe Douala-Bafoussam)
   ============================================================
   Règle métier : un chauffeur ne peut pas demander un prix hors de la
   fourchette de sa catégorie. Cela garantit la confiance du passager :
     "Si je paie le prix Premium, j'ai vraiment du Premium"
     "Si je vois 3 000 F, c'est forcément de l'Économique honnête"

   Si un chauffeur veut facturer plus, il doit améliorer sa voiture
   ou ses options pour passer à la catégorie supérieure.
*/
export interface PriceRange {
  min: number;
  max: number;
  suggested: number;
}

export const PRICE_RANGE_BY_CATEGORY: Record<TripCategory, PriceRange> = {
  economique: { min: 2_500, max: 4_000, suggested: 3_000 },
  confort:    { min: 3_500, max: 5_500, suggested: 4_500 },
  premium:    { min: 5_000, max: 8_500, suggested: 6_500 },
};

/** Vérifie qu'un prix est cohérent avec sa catégorie. */
export function isPriceValidForCategory(price: number, category: TripCategory): boolean {
  const range = PRICE_RANGE_BY_CATEGORY[category];
  return price >= range.min && price <= range.max;
}
