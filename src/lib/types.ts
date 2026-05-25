/**
 * Types métier SideBySide
 */

export type Role = 'passenger' | 'driver';

export type Screen =
  | 'landing'
  | 'onboarding'
  | 'auth'
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
  | 'profile'
  | 'admin';

export type TripStatus = 'available' | 'full' | 'departed' | 'completed' | 'cancelled';

export type TripOption = 'bagages' | 'animaux' | 'non-fumeur' | 'musique' | 'climatisation';

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
  };
  verified: boolean;
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
  paymentMethod: 'mtn' | 'orange' | 'card' | 'wallet';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export type PaymentMethod = 'mtn' | 'orange' | 'card' | 'wallet';
