/**
 * Numéros et actions d'urgence pour SideBySide.
 * Tous les numéros sont ceux officiels du Cameroun.
 */
import type { SosAction } from './types';

export interface SosEmergency {
  id: SosAction;
  label: string;
  description: string;
  /** Numéro à composer (sans formatage). */
  phone?: string;
  /** Icône-emoji */
  emoji: string;
  /** Couleur dominante. */
  tone: 'red' | 'orange' | 'blue' | 'green';
}

export const EMERGENCY_CONTACTS: SosEmergency[] = [
  {
    id: 'call-police',
    label: 'Police nationale',
    description: 'Urgence sécurité immédiate',
    phone: '117',
    emoji: '🚓',
    tone: 'red',
  },
  {
    id: 'call-gendarmerie',
    label: 'Gendarmerie',
    description: 'Urgence sur la route (hors ville)',
    phone: '113',
    emoji: '🪖',
    tone: 'red',
  },
  {
    id: 'call-ambulance',
    label: 'Ambulance / SAMU',
    description: 'Urgence médicale',
    phone: '119',
    emoji: '🚑',
    tone: 'orange',
  },
  {
    id: 'call-sbs-support',
    label: 'Support SideBySide',
    description: "L'équipe vous rappelle sous 5 min",
    phone: '+237 612 00 00 00',
    emoji: '🎧',
    tone: 'blue',
  },
  {
    id: 'share-location',
    label: 'Partager ma position',
    description: 'Envoyer ma position GPS à un proche',
    emoji: '📍',
    tone: 'green',
  },
];

/** URL `tel:` formatée pour un appel direct. */
export function telUrl(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}
