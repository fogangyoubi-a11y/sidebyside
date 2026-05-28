import { useState } from 'react';
import {
  ArrowLeft, MapPin, Clock, Users, Car, Star, ShieldCheck, Briefcase, Cat,
  Cigarette, Music, Wind, MessageCircle, Calendar, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { TrustBadge } from '@/components/security/TrustBadge';
import { SosButton } from '@/components/sos/SosButton';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { findTrip } from '@/data/trips';
import { useAuth, setPendingAction } from '@/hooks/useAuth';
import { computeTripCategory, CATEGORY_INFO, VEHICLE_TYPE_LABEL } from '@/lib/category';
import { cn, formatDate, formatDuration, formatTime, formatXAF } from '@/lib/utils';
import type { Screen, TripOption } from '@/lib/types';

interface TripDetailProps {
  tripId: string;
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}

const OPTION_LABELS: Record<TripOption, { icon: typeof Briefcase; label: string }> = {
  bagages:       { icon: Briefcase, label: 'Bagages volumineux acceptés' },
  animaux:       { icon: Cat,       label: 'Animaux acceptés' },
  'non-fumeur':  { icon: Cigarette, label: 'Trajet non-fumeur' },
  musique:       { icon: Music,     label: 'Musique à bord' },
  climatisation: { icon: Wind,      label: 'Climatisation' },
};

export function TripDetail({ tripId, onNavigate }: TripDetailProps) {
  const trip = findTrip(tripId);
  const [seats, setSeats] = useState(1);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const { isAuthenticated } = useAuth();

  function handleReserve() {
    if (isAuthenticated) {
      onNavigate('booking', { tripId, seats: seats.toString() });
      return;
    }
    // Pas connecté → mémoriser l'intention puis ouvrir le modal d'auth
    setPendingAction({ type: 'booking', tripId, seats });
    setShowAuthGate(true);
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-sbs-cream p-8 text-center">
        <p className="text-sbs-muted">Trajet introuvable.</p>
        <Button variant="primary" size="md" onClick={() => onNavigate('search')} className="mt-4 rounded-pill">
          Retour à la recherche
        </Button>
      </div>
    );
  }

  const departure = new Date(trip.departureAt);
  const arrival = new Date(departure.getTime() + trip.durationMin * 60 * 1000);
  const totalPrice = trip.pricePerSeat * seats;
  const trustLevel = trip.driver.trustLevel ?? 'basic';
  const category = computeTripCategory(trip.driver.car.type, trip.driver.car.year, trip.options);
  const categoryInfo = CATEGORY_INFO[category];

  return (
    <div className="min-h-screen bg-sbs-cream pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-sbs-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => onNavigate('search')}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-pill border border-sbs-border text-sbs-dark transition-colors hover:bg-sbs-border-soft"
              aria-label="Retour"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <SbsLogo size="sm" />
              <div className="leading-tight min-w-0">
                <div className="font-display text-base font-extrabold tracking-tight truncate">Détail du trajet</div>
                <div className="text-[10px] text-sbs-muted truncate">{formatDate(departure)} · {formatTime(departure)}</div>
              </div>
            </div>
          </div>
          {/* SOS dans le header (mode "header") — n'écrase plus le CTA Réserver en bas */}
          <SosButton variant="header" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Carte Itinéraire */}
        <section className="rounded-card-lg border border-sbs-border bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-base font-extrabold text-sbs-dark">Itinéraire</h2>
            <Badge tone={trip.seatsLeft <= 1 ? 'red' : trip.seatsLeft <= 2 ? 'yellow' : 'green'}>
              {trip.seatsLeft} / {trip.seatsTotal} places
            </Badge>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1 pt-1">
              <span className="h-3 w-3 rounded-full bg-sbs-blue ring-4 ring-sbs-blue/15" />
              <span className="h-16 w-0.5 border-l-2 border-dashed border-sbs-border" />
              <span className="h-3 w-3 rounded-full bg-sbs-yellow ring-4 ring-sbs-yellow/20" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-xl font-extrabold text-sbs-dark">{formatTime(departure)}</span>
                  <span className="text-sm font-semibold text-sbs-dark">{trip.from.name}</span>
                  <span className="text-[11px] text-sbs-muted">({trip.from.region})</span>
                </div>
                <div className="mt-0.5 flex items-start gap-1 text-xs text-sbs-muted">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{trip.pickupPoint}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-sbs-muted">
                <Clock className="h-3 w-3" />
                Durée estimée : {formatDuration(trip.durationMin)}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-xl font-extrabold text-sbs-dark">{formatTime(arrival)}</span>
                  <span className="text-sm font-semibold text-sbs-dark">{trip.to.name}</span>
                  <span className="text-[11px] text-sbs-muted">({trip.to.region})</span>
                </div>
                <div className="mt-0.5 flex items-start gap-1 text-xs text-sbs-muted">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{trip.dropoffPoint}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Carte Chauffeur */}
        <section className="mt-4 rounded-card-lg border border-sbs-border bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-4 font-display text-base font-extrabold text-sbs-dark">Votre chauffeur</h2>

          <div className="flex items-start gap-4">
            <Avatar name={trip.driver.name} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-lg font-extrabold text-sbs-dark">
                  {trip.driver.name}
                </span>
                <TrustBadge level={trustLevel} size="sm" />
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-sbs-muted">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-sbs-yellow text-sbs-yellow" />
                  <strong className="text-sbs-dark">{trip.driver.rating}</strong> / 5
                </span>
                <span>·</span>
                <span><strong className="text-sbs-dark">{trip.driver.tripsCompleted}</strong> trajets</span>
                <span>·</span>
                <span>{trip.driver.yearsActive} ans</span>
              </div>
              {trip.driver.bio && (
                <p className="mt-2 text-xs leading-relaxed text-sbs-muted">
                  "{trip.driver.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Carte véhicule */}
          <div className="mt-4 flex items-center gap-3 rounded-card border border-sbs-border-soft bg-sbs-cream p-3">
            <div className="grid h-10 w-10 place-items-center rounded-card bg-white shadow-soft">
              <Car className="h-5 w-5 text-sbs-blue" />
            </div>
            <div className="flex-1 text-xs">
              <div className="font-bold text-sbs-dark">
                {trip.driver.car.model} <span className="text-sbs-muted">· {trip.driver.car.color}</span>
              </div>
              <div className="text-[11px] text-sbs-muted">
                {VEHICLE_TYPE_LABEL[trip.driver.car.type]} · {trip.driver.car.year} · Plaque <span className="font-mono">{trip.driver.car.plate}</span>
              </div>
            </div>
            <CategoryBadge category={category} size="sm" />
          </div>
        </section>

        {/* Carte catégorie : explication de ce que veut dire "Premium VIP" */}
        <section className={cn(
          'mt-4 rounded-card-lg border p-4 sm:p-5',
          categoryInfo.bgClass,
          categoryInfo.borderClass,
        )}>
          <div className="flex items-start gap-3">
            <span className="text-3xl" aria-hidden>{categoryInfo.emoji}</span>
            <div className="flex-1">
              <div className={cn('font-display text-base font-extrabold', categoryInfo.textClass)}>
                Niveau {categoryInfo.label}
              </div>
              <div className="mt-0.5 text-xs leading-relaxed text-sbs-dark/80">
                {categoryInfo.tagline}
              </div>
            </div>
          </div>
        </section>

        {/* Options */}
        {trip.options.length > 0 && (
          <section className="mt-4 rounded-card-lg border border-sbs-border bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-3 font-display text-base font-extrabold text-sbs-dark">Confort & règles</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {trip.options.map((opt) => {
                const { icon: Icon, label } = OPTION_LABELS[opt];
                return (
                  <li key={opt} className="flex items-center gap-2.5 rounded-card border border-sbs-border-soft bg-sbs-cream/50 px-3 py-2 text-xs">
                    <span className="grid h-7 w-7 place-items-center rounded-pill bg-sbs-blue-light text-sbs-blue">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-semibold text-sbs-dark">{label}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Sélection places */}
        <section className="mt-4 rounded-card-lg border border-sbs-border bg-white p-5 shadow-card sm:p-6">
          <h2 className="mb-3 font-display text-base font-extrabold text-sbs-dark">Combien de places ?</h2>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center overflow-hidden rounded-pill border border-sbs-border bg-white">
              <button
                type="button"
                onClick={() => setSeats(Math.max(1, seats - 1))}
                disabled={seats <= 1}
                aria-label="Moins de places"
                className="grid h-10 w-10 place-items-center text-sbs-dark transition-colors hover:bg-sbs-border-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>
              <span className="grid min-w-[3rem] place-items-center font-display text-base font-extrabold">
                {seats}
              </span>
              <button
                type="button"
                onClick={() => setSeats(Math.min(trip.seatsLeft, seats + 1))}
                disabled={seats >= trip.seatsLeft}
                aria-label="Plus de places"
                className="grid h-10 w-10 place-items-center text-sbs-dark transition-colors hover:bg-sbs-border-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-sbs-muted">
              <Users className="h-3.5 w-3.5" />
              {trip.seatsLeft} disponible{trip.seatsLeft > 1 ? 's' : ''}
            </div>
          </div>
        </section>

        {/* Carte de garanties */}
        <section className="mt-4 rounded-card-lg border border-sbs-green/20 bg-sbs-green/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sbs-green" />
            <div className="text-xs leading-relaxed text-sbs-dark">
              <p className="font-bold text-sbs-green">Votre réservation est protégée</p>
              <ul className="mt-1.5 space-y-0.5">
                <li>• Identité du chauffeur vérifiée par SideBySide</li>
                <li>• Remboursement en cas d'annulation par le chauffeur</li>
                <li>• Bouton SOS accessible pendant tout le trajet</li>
                <li>• Numéros masqués, chat sécurisé in-app</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA bas — bouton message + secondaire */}
        <div className="mt-6 flex gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => onNavigate('messages')}
            className="rounded-pill"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Contacter avant</span>
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => onNavigate('search')}
            className="ml-auto"
          >
            <Calendar className="h-4 w-4" />
            Voir d'autres trajets
          </Button>
        </div>
      </main>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-sbs-border bg-white px-4 py-3 shadow-card sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <div className="font-display text-xl font-extrabold text-sbs-blue">{formatXAF(totalPrice)}</div>
            <div className="text-[10px] text-sbs-muted">
              {seats > 1 ? `${seats} × ${formatXAF(trip.pricePerSeat)}` : 'pour 1 place'}
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleReserve}
            className={cn('rounded-pill', 'min-w-[180px]')}
          >
            Réserver
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Modal d'auth : s'affiche si l'utilisateur n'est pas connecté */}
      {showAuthGate && (
        <AuthGateModal
          action="réserver ce trajet"
          onClose={() => setShowAuthGate(false)}
          onLogin={() => { setShowAuthGate(false); onNavigate('login'); }}
          onRegister={() => { setShowAuthGate(false); onNavigate('onboarding'); }}
        />
      )}
    </div>
  );
}
