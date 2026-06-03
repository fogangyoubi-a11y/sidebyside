import { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Car, ArrowRight, CheckCircle2, Plus, AlertCircle, Loader2, Users, Hash, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { useAuth } from '@/hooks/useAuth';
import { ApiClient, ApiError, type ApiBookingWithTrip, type ApiDriverTrip } from '@/lib/api';
import { findCity } from '@/data/cities';
import { cn, formatDate, formatTime, formatXAF } from '@/lib/utils';
import type { Screen } from '@/lib/types';

interface MyTripsProps {
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}

type TabSection = 'upcoming' | 'past' | 'published';

/**
 * Écran "Vos trajets" — accessible via la bottom nav.
 *
 * - Passager : onglets "À venir" / "Passés" basés sur `GET /api/bookings/mine`,
 *   séparés par `trip.departureAt` vs `now`.
 * - Chauffeur : même chose + un onglet "Publiés" basé sur `GET /api/trips/mine`.
 *
 * Charge les données au montage et propose un reload manuel sur erreur réseau.
 */
export function MyTrips({ onNavigate }: MyTripsProps) {
  const { isAuthenticated, user } = useAuth();
  const [section, setSection] = useState<TabSection>('upcoming');

  const [bookings, setBookings] = useState<ApiBookingWithTrip[] | null>(null);
  const [driverTrips, setDriverTrips] = useState<ApiDriverTrip[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancellingTripId, setCancellingTripId] = useState<string | null>(null);
  const [cancelTripError, setCancelTripError] = useState<string | null>(null);

  const isDriver = user?.role === 'DRIVER';

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const tasks: Array<Promise<unknown>> = [
      ApiClient.myBookings().then(({ bookings }) => { if (!cancelled) setBookings(bookings); }),
    ];
    if (isDriver) {
      tasks.push(
        ApiClient.myDriverTrips().then(({ trips }) => { if (!cancelled) setDriverTrips(trips); }),
      );
    }
    Promise.all(tasks)
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Chargement impossible');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [isAuthenticated, isDriver, reloadKey]);

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

  /** Annule une réservation côté backend, puis recharge la liste. */
  async function handleCancel(bookingId: string, reference: string) {
    const ok = window.confirm(`Annuler la réservation ${reference} ?\n\nLes places réservées seront remises en vente.`);
    if (!ok) return;
    setCancellingId(bookingId);
    setCancelError(null);
    try {
      await ApiClient.cancelBooking(bookingId);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : 'Annulation impossible');
    } finally {
      setCancellingId(null);
    }
  }

  /** Annule un trajet entier côté chauffeur — cascade sur bookings + notif messagerie. */
  async function handleCancelTrip(tripId: string, activeBookings: number) {
    const warn = activeBookings > 0
      ? `Annuler ce trajet ?\n\n${activeBookings} réservation(s) active(s) seront automatiquement annulées et les passagers prévenus via la messagerie.`
      : 'Annuler ce trajet ?\n\nIl ne sera plus visible dans les résultats de recherche.';
    if (!window.confirm(warn)) return;
    setCancellingTripId(tripId);
    setCancelTripError(null);
    try {
      await ApiClient.cancelTrip(tripId);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setCancelTripError(err instanceof ApiError ? err.message : 'Annulation impossible');
    } finally {
      setCancellingTripId(null);
    }
  }

  const now = Date.now();
  const upcomingBookings = (bookings ?? []).filter(
    (b) => b.status !== 'CANCELLED' && new Date(b.trip.departureAt).getTime() >= now,
  );
  const pastBookings = (bookings ?? []).filter(
    (b) => b.status === 'CANCELLED' || new Date(b.trip.departureAt).getTime() < now,
  );
  const publishedTrips = driverTrips ?? [];

  return (
    <div className="min-h-screen bg-sbs-cream pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-sbs-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <SbsLogo size="sm" />
            <div className="leading-tight">
              <div className="font-display text-base font-extrabold tracking-tight">Vos trajets</div>
              <div className="text-[10px] text-sbs-muted">Historique &amp; à venir</div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="mx-auto flex max-w-3xl gap-1 border-t border-sbs-border-soft px-4 sm:px-6">
          {(
            [
              { id: 'upcoming' as TabSection,  label: '🟢 À venir', count: upcomingBookings.length },
              { id: 'past' as TabSection,      label: '📜 Passés', count: pastBookings.length },
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
        {loading && (
          <div className="rounded-card-lg border border-sbs-border bg-white p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-sbs-blue" />
            <p className="mt-2 text-sm text-sbs-muted">Chargement de vos trajets…</p>
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="rounded-card border border-sbs-red/30 bg-white p-5 text-sm text-sbs-red shadow-soft">
            <p className="font-semibold">{error}</p>
            <Button
              variant="ghost" size="md"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-3"
            >
              Réessayer
            </Button>
          </div>
        )}

        {cancelError && (
          <div role="alert" className="mb-3 rounded-card border border-sbs-red/30 bg-sbs-red/5 p-3 text-[12px] text-sbs-red">
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {cancelError}
            </p>
          </div>
        )}
        {!loading && !error && section === 'upcoming' && (
          <BookingsList
            bookings={upcomingBookings}
            kind="upcoming"
            onNavigate={onNavigate}
            onCancel={handleCancel}
            cancellingId={cancellingId}
          />
        )}
        {!loading && !error && section === 'past' && (
          <BookingsList bookings={pastBookings} kind="past" onNavigate={onNavigate} />
        )}
        {cancelTripError && (
          <div role="alert" className="mb-3 rounded-card border border-sbs-red/30 bg-sbs-red/5 p-3 text-[12px] text-sbs-red">
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {cancelTripError}
            </p>
          </div>
        )}
        {!loading && !error && section === 'published' && (
          <PublishedTripsList
            trips={publishedTrips}
            onNavigate={onNavigate}
            onCancel={handleCancelTrip}
            cancellingId={cancellingTripId}
          />
        )}
      </main>

      <BottomNav active="trips" onNavigate={onNavigate} messagesUnread={0} />
    </div>
  );
}

/* ============================================================
   Liste des réservations (passager : "À venir" / "Passés")
   ============================================================ */

function BookingsList({ bookings, kind, onNavigate, onCancel, cancellingId }: {
  bookings: ApiBookingWithTrip[];
  kind: 'upcoming' | 'past';
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
  /** Callback annulation — uniquement passé pour les bookings "upcoming". */
  onCancel?: (bookingId: string, reference: string) => Promise<void>;
  cancellingId?: string | null;
}) {
  if (bookings.length === 0) {
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
      {bookings.map((b) => {
        const departure = new Date(b.trip.departureAt);
        const fromCity = findCity(b.trip.fromCity)?.name ?? b.trip.fromCity;
        const toCity = findCity(b.trip.toCity)?.name ?? b.trip.toCity;
        const driverName = `${b.trip.driver.firstName} ${b.trip.driver.lastName}`;
        return (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => onNavigate('trip-detail', { tripId: b.tripId })}
              className="w-full rounded-card-lg border border-sbs-border bg-white p-4 text-left shadow-soft transition-all hover:border-sbs-blue/40 hover:shadow-card"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <BookingStatusBadge status={b.status} />
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
                {fromCity}
                <ArrowRight className="h-3 w-3 text-sbs-muted" />
                {toCity}
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-sbs-muted">
                <span>{driverName} · départ {formatTime(departure)}</span>
                <span className="font-bold text-sbs-blue">{formatXAF(b.totalAmount)}</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-sbs-muted">
                <span className="inline-flex items-center gap-1">
                  <Hash className="h-3 w-3" /> {b.reference}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> {b.seats} place{b.seats > 1 ? 's' : ''}
                </span>
              </div>
            </button>

            {/* Bouton Annuler — uniquement pour les bookings actives à venir */}
            {kind === 'upcoming' && onCancel && (b.status === 'PENDING' || b.status === 'CONFIRMED') && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onCancel(b.id, b.reference); }}
                disabled={cancellingId === b.id}
                className={cn(
                  'mt-2 inline-flex items-center gap-1.5 rounded-pill border border-sbs-red/30 bg-white px-3 py-1.5 text-[11px] font-semibold text-sbs-red transition-colors',
                  cancellingId === b.id ? 'opacity-60' : 'hover:bg-sbs-red/5',
                )}
                aria-label={`Annuler la réservation ${b.reference}`}
              >
                {cancellingId === b.id
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <X className="h-3 w-3" />}
                {cancellingId === b.id ? 'Annulation…' : 'Annuler la réservation'}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function BookingStatusBadge({ status }: { status: ApiBookingWithTrip['status'] }) {
  switch (status) {
    case 'CONFIRMED': return <Badge tone="green">✓ Confirmé</Badge>;
    case 'PENDING':   return <Badge tone="yellow">⏳ En attente</Badge>;
    case 'CANCELLED': return <Badge tone="muted">✗ Annulé</Badge>;
    case 'COMPLETED': return <Badge tone="green">✓ Effectué</Badge>;
    default:          return <Badge tone="muted">{status}</Badge>;
  }
}

/* ============================================================
   Liste des trajets publiés (chauffeur)
   ============================================================ */

function PublishedTripsList({ trips, onNavigate, onCancel, cancellingId }: {
  trips: ApiDriverTrip[];
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
  /** Callback annulation — appelé avec tripId + nombre de bookings actives pour le warning. */
  onCancel?: (tripId: string, activeBookings: number) => Promise<void>;
  cancellingId?: string | null;
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

  return (
    <ul className="space-y-3">
      {trips.map((t) => {
        const departure = new Date(t.departureAt);
        const fromCity = findCity(t.fromCity)?.name ?? t.fromCity;
        const toCity = findCity(t.toCity)?.name ?? t.toCity;
        const activeBookings = t.bookings.filter((b) => b.status === 'PENDING' || b.status === 'CONFIRMED');
        const seatsBooked = activeBookings.reduce((sum, b) => sum + b.seats, 0);
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onNavigate('trip-detail', { tripId: t.id })}
              className="w-full rounded-card-lg border border-sbs-border bg-white p-4 text-left shadow-soft transition-all hover:border-sbs-blue/40 hover:shadow-card"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <TripStatusBadge status={t.status} />
                <Badge tone="blue">
                  <Clock className="h-3 w-3" /> {formatDate(departure)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-sbs-dark">
                <MapPin className="h-3.5 w-3.5 text-sbs-blue" />
                {fromCity}
                <ArrowRight className="h-3 w-3 text-sbs-muted" />
                {toCity}
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-sbs-muted">
                <span>Départ {formatTime(departure)}</span>
                <span className="font-bold text-sbs-blue">{formatXAF(t.pricePerSeat)} / place</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-sbs-muted">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {seatsBooked} / {t.seatsTotal} réservées
                </span>
                {activeBookings.length > 0 && (
                  <span className="font-semibold text-sbs-green">
                    {activeBookings.length} réservation{activeBookings.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </button>

            {/* Bouton Annuler — uniquement pour les trajets actifs (pas déjà CANCELLED/COMPLETED/DEPARTED) */}
            {onCancel && (t.status === 'AVAILABLE' || t.status === 'FULL') && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onCancel(t.id, activeBookings.length); }}
                disabled={cancellingId === t.id}
                className={cn(
                  'mt-2 inline-flex items-center gap-1.5 rounded-pill border border-sbs-red/30 bg-white px-3 py-1.5 text-[11px] font-semibold text-sbs-red transition-colors',
                  cancellingId === t.id ? 'opacity-60' : 'hover:bg-sbs-red/5',
                )}
                aria-label="Annuler ce trajet"
              >
                {cancellingId === t.id
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <X className="h-3 w-3" />}
                {cancellingId === t.id ? 'Annulation…' : 'Annuler le trajet'}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function TripStatusBadge({ status }: { status: ApiDriverTrip['status'] }) {
  switch (status) {
    case 'AVAILABLE': return <Badge tone="green">🟢 Disponible</Badge>;
    case 'FULL':      return <Badge tone="yellow">🟡 Complet</Badge>;
    case 'DEPARTED':  return <Badge tone="blue">🚗 Parti</Badge>;
    case 'COMPLETED': return <Badge tone="green">✓ Effectué</Badge>;
    case 'CANCELLED': return <Badge tone="muted">✗ Annulé</Badge>;
    default:          return <Badge tone="muted">{status}</Badge>;
  }
}
