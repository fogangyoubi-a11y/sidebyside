/**
 * Types métier SideBySide
 */

export type Role = 'passenger' | 'driver';

export type Screen =
  | 'landing'
  | 'onboarding'
  | 'auth'
  | 'login'
  | 'role-pick'
  | 'home-passenger'
  | 'home-driver'
  | 'search'
  | 'search-results'
  | 'trip-detail'
  | 'booking'
  | 'payment'
  | 'booking-confirmed'
  | 'publish-trip'
  | 'driver-trips'
  | 'my-trips'
  | 'messages'
  | 'profile'
  | 'admin';

export type TripStatus = 'available' | 'full' | 'departed' | 'completed' | 'cancelled';

export type TripOption = 'bagages' | 'animaux' | 'non-fumeur' | 'musique' | 'climatisation';

/** Type physique de véhicule — utilisé pour la catégorisation auto. */
export type VehicleType = 'berline' | 'citadine' | 'suv' | '4x4' | 'monospace';

/** Niveau de confort d'un trajet — visible dans la liste de recherche et le filtre. */
export type TripCategory = 'economique' | 'confort' | 'premium';

export interface City {
  id: string;
  name: string;
  region: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;          // 0-5
  tripsCompleted: number;
  yearsActive: number;
  car: {
    model: string;
    color: string;
    plate: string;         // masquée partiellement
    type: VehicleType;
    year: number;          // ex. 2022
  };
  verified: boolean;
  trustLevel?: 'basic' | 'verified' | 'premium';
  bio?: string;
}

export interface PassengerProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  tripsCompleted: number;
}

export interface Trip {
  id: string;
  driver: DriverProfile;
  from: City;
  to: City;
  pickupPoint: string;     // ex. "Rond-point Bonamoussadi, Douala"
  dropoffPoint: string;    // ex. "Carrefour Akwa, Bafoussam"
  departureAt: string;     // ISO date
  durationMin: number;
  seatsTotal: number;
  seatsLeft: number;
  pricePerSeat: number;    // F CFA
  options: TripOption[];
  status: TripStatus;
}

export interface SearchFilters {
  fromId: string;
  toId: string;
  date: string;            // YYYY-MM-DD
  passengers: number;
  maxPrice?: number;
  minRating?: number;
  options?: TripOption[];
}

export interface Booking {
  id: string;
  tripId: string;
  passenger: PassengerProfile;
  seats: number;
  totalAmount: number;
  paymentMethod: 'mtn' | 'orange' | 'card' | 'paypal' | 'wallet';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export type PaymentMethod = 'mtn' | 'orange' | 'card' | 'paypal' | 'wallet';

/* ============================================================
   "POUR QUI ?" — Modes de réservation
   ============================================================ */

export type BookingMode = 'self' | 'gift' | 'family';

/** Bénéficiaire d'un trajet offert (cas "gift"). */
export interface Beneficiary {
  firstName: string;
  lastName: string;
  phone: string;             // +237 6XX XX XX XX
  cniFile: File | null;      // photo CNI obligatoire (recto ou recto-verso au choix)
}

/** Lien de parenté avec l'enfant. */
export type ChildRelation = 'fils' | 'fille' | 'neveu' | 'niece' | 'petit-fils' | 'petite-fille' | 'frere' | 'soeur' | 'autre';

/** Enfant qui voyage avec le passager adulte. */
export interface Child {
  firstName: string;
  age: number;               // 0 à 17
  relation: ChildRelation;
}

/** Catégorie tarifaire d'un enfant selon son âge. */
export type ChildPriceTier = 'free' | 'half' | 'full';

/* ============================================================
   MESSAGERIE
   ============================================================ */

export type MessageSender = 'me' | 'other' | 'system';

export interface Message {
  id: string;
  sender: MessageSender;
  /** Texte affiché — les numéros y sont automatiquement masqués. */
  text: string;
  /** Date d'émission (ISO). */
  sentAt: string;
  /** Pour les messages "moi" : statut de lecture. */
  read?: boolean;
}

export interface Conversation {
  id: string;
  /** Trajet associé à la conversation. */
  tripId: string;
  /** Interlocuteur (pour le passager : son chauffeur ; pour le chauffeur : le passager). */
  otherUserName: string;
  otherUserAvatar?: string;
  otherTrustLevel?: 'basic' | 'verified' | 'premium';
  /** Numéro masqué affiché (jamais le vrai). */
  otherMaskedPhone: string;
  /** Résumé du trajet pour le header. */
  tripSummary: string;       // ex. "Douala → Bafoussam · 06h30 demain"
  messages: Message[];
  unreadCount: number;
}

/* ============================================================
   SOS / URGENCE
   ============================================================ */

export type SosAction = 'call-police' | 'call-gendarmerie' | 'call-ambulance' | 'call-sbs-support' | 'share-location';
