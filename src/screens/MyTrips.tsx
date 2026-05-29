import { useState } from 'react';
import { Calendar, MapPin, Clock, Car, ArrowRight, CheckCircle2, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { TRIPS } from '@/data/trips';
import { useAuth } from '@/hooks/useAuth';
import { computeTripCategory } from '@/lib/category';
import { cn, formatDate, formatTime, formatXAF } from '@/lib/utils';
import type { Screen } from '@/lib/types';

interface MyTripsProps {
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}

type TabSection = 'upcoming' | 'past' | 'published';

/**
 * Écran "Vos trajets" — accessible via la bottom nav.
 * Trois onglets : À venir / Passés / Publiés (chauffeur).
 *
 * Note : les données sont mockées pour l'instant. Quand le backend sera
 * branché, on appellera GET /bookings/mine et GET /trips/mine.
 */
export function MyTrips({ onNavigate }: MyTripsProps) {
  const { isAuthenticated, user } = useAuth();
  const [section, setSection] = useState<TabSection>('upcoming');

  // Auth gate : si pas connecté, demander login/register
  if (!isAuthenticated) {
    return (
      <AuthGateModal
        action="voir vos trajets"
        onClose={() => onNavigate('landing')}
        onLogin={() => onNavigate('login')}
        onRegister={() => onNavigate('onboarding')}
      />
    );
  }

  // Mock : on prend 2 trajets comme "réservations à venir" + 1 comme passé
  // (sera remplacé par l'API quand le backend est branché)
  const upcomingTrips = TRIPS.slice(0, 2);
  const pastTrips = TRIPS.slice(2, 3);
  const publishedTrips: typeof TRIPS = []; // l'utilisateur n'a encore rien publié

  const isDriver = user?.role === 'DRIVER';

  return (
    <div className="min-h-screen bg-sbs-cream pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-sbs-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <SbsLogo size="sm" />
            <div className="leading-tight">
              <div className="font-display text-base font-extrabold tracking-tight">Vos trajets</div>
              <div className="text-[10px] text-sbs-muted">Historique & à venir</div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="mx-auto flex max-w-3xl gap-1 border-t border-sbs-border-soft px-4 sm:px-6">
          {(
            [
              { id: 'upcoming' as TabSection,  label: '🟢 À venir', count: upcomingTrips.length },
              { id: 'past' as TabSection,      label: '📜 Passés', count: pastTrips.length },
              ...(isDriver ? [{ id: 'published' as TabSection, label: '🚗 Publiés', count: publishedTrips.length }] : []),
            ]
          ).map((t) => {
            const active = section === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSection(t.id)}
                className={cn(
                  'flex-1 border-b-2 py-2.5 text-xs font-semibold transition-colors',
                  active
                    ? 'border-sbs-blue text-sbs-blue'
                    : 'border-transparent text-sbs-muted hover:text-sbs-dark',
                )}
              >
                {t.label} {t.count > 0 && <span className="ml-1 text-[10px]">({t.count})</span>}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {section === 'upcoming' && (
          <TripsList trips={upcomingTrips} kind="upcoming" onNavigate={onNavigate} />
        )}
        {section === 'past' && (
          <TripsList trips={pastTrips} kind="past" onNavigate={onNavigate} />
        )}
        {section === 'published' && (
          <PublishedView trips={publishedTrips} onNavigate={onNavigate} />
        )}
      </main>

      <BottomNav active="trips" onNavigate={onNavigate} messagesUnread={3} />
    </div>
  );
}

function TripsList({ trips, kind, onNavigate }: {
  trips: typeof TRIPS;
  kind: 'upcoming' | 'past';
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}) {
  if (trips.length === 0) {
    return (
      <div className="rounded-card-lg border border-dashed border-sbs-border bg-white px-6 py-12 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-sbs-blue-light text-sbs-blue">
          <Calendar className="h-6 w-6" />
        </div>
        <p className="font-display text-base font-extrabold text-sbs-dark">
          {kind === 'upcoming' ? 'Aucun trajet à venir' : 'Aucun trajet passé'}
        </p>
        <p className="mt-1 text-sm text-sbs-muted">
          {kind === 'upcoming' ? 'Réservez votre premier trajet maintenant.' : 'Vos trajets effectués apparaîtront ici.'}
        </p>
        <div className="mt-5">
          <Button variant="primary" size="md" onClick={() => onNavigate('search')} className="rounded-pill">
            <ArrowRight className="h-4 w-4" />
            Chercher un trajet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {trips.map((trip) => {
        const departure = new Date(trip.departureAt);
        const category = computeTripCategory(trip.driver.car.type, trip.driver.car.year, trip.options);
        return (
          <li key={trip.id}>
            <button
              type="button"
              onClick={() => onNavigate('trip-detail', { tripId: trip.id })}
              className="w-full rounded-card-lg border border-sbs-border bg-white p-4 text-left shadow-soft transition-all hover:border-sbs-blue/40 hover:shadow-card"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <CategoryBadge category={category} size="sm" />
                {kind === 'past' ? (
                  <Badge tone="green">
                    <CheckCircle2 className="h-3 w-3" /> Effectué
                  </Badge>
                ) : (
                  <Badge tone="blue">
                    <Clock className="h-3 w-3" /> {formatDate(departure)}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-sbs-dark">
                <MapPin className="h-3.5 w-3.5 text-sbs-blue" />
                {trip.from.name}
                <ArrowRight className="h-3 w-3 text-sbs-muted" />
                {trip.to.name}
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-sbs-muted">
                <span>{trip.driver.name} · départ {formatTime(departure)}</span>
                <span className="font-bold text-sbs-blue">{formatXAF(trip.pricePerSeat)}</span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PublishedView({ trips, onNavigate }: {
  trips: typeof TRIPS;
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}) {
  if (trips.length === 0) {
    return (
      <div className="rounded-card-lg border border-dashed border-sbs-yellow/30 bg-sbs-yellow-light/40 px-6 py-12 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-sbs-yellow text-sbs-dark">
          <Car className="h-6 w-6" />
        </div>
        <p className="font-display text-base font-extrabold text-sbs-dark">
          Vous n'avez encore rien publié
        </p>
        <p className="mt-1 text-sm text-sbs-muted">
          Partagez votre prochain trajet et commencez à gagner.
        </p>
        <div className="mt-5">
          <Button variant="primary" size="md" onClick={() => onNavigate('publish-trip')} className="rounded-pill">
            <Plus className="h-4 w-4" />
            Publier un trajet
          </Button>
        </div>

        <div className="mt-6 rounded-card border border-sbs-yellow/30 bg-white p-3 text-[11px] text-left text-sbs-dark">
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sbs-yellow-dark" />
            Astuce : un véhicule récent climatisé bien noté peut vous faire passer en
            <strong> Premium VIP</strong> avec un prix par place plus élevé.
          </p>
        </div>
      </div>
    );
  }
  return <TripsList trips={trips} kind="upcoming" onNavigate={onNavigate} />;
}
