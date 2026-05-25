/**
 * Logique de messagerie SideBySide
 */
import type { Conversation, Message } from './types';
import { TRIPS } from '@/data/trips';

/**
 * Masque les numéros de téléphone dans un texte.
 * Ex: "Appelle-moi au 691234567" → "Appelle-moi au [numéro masqué]"
 */
const PHONE_REGEX = /(\+?237)?[\s.-]?[26]\d{8}/g;
const PHONE_GROUPED_REGEX = /(\+?237)?[\s.-]?[26](?:[\s.-]?\d){8}/g;

export function maskPhones(text: string): string {
  return text
    .replace(PHONE_GROUPED_REGEX, '[📵 numéro masqué]')
    .replace(PHONE_REGEX, '[📵 numéro masqué]');
}

/** Réponses rapides pré-rédigées disponibles dans le thread. */
export const QUICK_REPLIES: string[] = [
  'Bonjour 👋',
  'Je suis en route',
  'Je suis arrivé(e) au point de RDV',
  "J'ai un peu de retard, désolé",
  'Combien de temps avant le départ ?',
  'Merci pour le trajet !',
  'OK, à tout de suite',
];

/* ============================================================
   MOCK DATA — conversations de demo
   ============================================================ */

function isoOffset(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

function makeMessages(items: Array<[Message['sender'], string, number]>): Message[] {
  return items.map(([sender, text, minutesAgo], idx) => ({
    id: `m${idx}`,
    sender,
    text: sender === 'system' ? text : maskPhones(text),
    sentAt: isoOffset(minutesAgo),
    read: sender === 'me' ? true : undefined,
  }));
}

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    tripId: 't1',
    otherUserName: 'Achille Nkomo',
    otherTrustLevel: 'premium',
    otherMaskedPhone: '+237 6** ** 45 67',
    tripSummary: 'Douala → Bafoussam · Demain 06:30',
    unreadCount: 1,
    messages: makeMessages([
      ['system', '✓ Réservation confirmée · 2 places · 8 000 F CFA', 240],
      ['other',  'Bonjour ! Merci pour votre réservation 🙂', 235],
      ['me',     'Bonjour Achille, on se retrouve bien au rond-point Bonamoussadi ?', 230],
      ['other',  'Oui exactement, devant la pharmacie Bonamoussadi. Toyota Corolla blanche, plaque LT 4** AA.', 228],
      ['me',     'Parfait, à demain alors 👍', 226],
      ['other',  'À demain ! Bonne soirée. Si jamais appelez-moi au 691234567', 5],
    ]),
  },
  {
    id: 'c2',
    tripId: 't2',
    otherUserName: 'Marlène Tchoumi',
    otherTrustLevel: 'premium',
    otherMaskedPhone: '+237 6** ** 28 91',
    tripSummary: 'Douala → Bafoussam · Demain 09:00',
    unreadCount: 0,
    messages: makeMessages([
      ['system', '✓ Réservation confirmée · 1 place · 3 700 F CFA', 1440],
      ['other',  'Bienvenue 👋 le voyage est en non-fumeur, climatisation comprise', 1430],
      ['me',     'Super, merci pour les infos !', 1425],
    ]),
  },
  {
    id: 'c3',
    tripId: 't4',
    otherUserName: 'Émile Kamga',
    otherTrustLevel: 'premium',
    otherMaskedPhone: '+237 6** ** 12 03',
    tripSummary: 'Douala → Bafoussam · 28 mai 07:00',
    unreadCount: 2,
    messages: makeMessages([
      ['system', '✓ Réservation confirmée · 1 place · 5 050 F CFA', 60 * 24 * 2],
      ['other',  "Bonjour, c'est Émile. Vous voyagez avec bagages volumineux ?", 60 * 24 * 2 - 10],
      ['me',     'Oui, une valise moyenne, ça va le coffre est grand ?', 60 * 24 * 2 - 8],
      ['other',  "Oui sans souci, j'ai un RAV4. À bientôt !", 30],
      ['other',  'PS : je passerai aussi par Bonabéri si ça vous arrange', 15],
    ]),
  },
];

export function findConversation(id: string): Conversation | undefined {
  return MOCK_CONVERSATIONS.find((c) => c.id === id);
}

/** Compte total des messages non lus. */
export function totalUnread(): number {
  return MOCK_CONVERSATIONS.reduce((sum, c) => sum + c.unreadCount, 0);
}

/** Pour info — utilisé pour résumer un trajet dans le header de conversation. */
export function getTripById(id: string) {
  return TRIPS.find((t) => t.id === id);
}
