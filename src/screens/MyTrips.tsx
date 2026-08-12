import { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Car, ArrowRight, CheckCircle2, Plus, AlertCircle, Loader2, Users, Hash, X, AlertTriangle, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { useAuth } from '@/hooks/useAuth';
import { ApiClient, ApiError, type ApiBookingWithTrip, type ApiDriverTrip, type ApiDriverBookingRequest } from '@/lib/api';
import { RatingModal } from '@/components/ui/RatingModal';
import { findCity } from '@/data/cities';
import { cn, formatDate, formatTime, formatXAF } from '@/lib/utils';
import type { Screen } from '@/lib/types';

interface MyTripsProps {
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}

type TabSection = 'upcoming' | 'past' | 'published' | 'requests';

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
  const [driverRequests, setDriverRequests] = useState<ApiDriverBookingRequest[] | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancellingTripId, setCancellingTripId] = useState<string | null>(null);
  const [cancelTripError, setCancelTripError] = useState<string | null>(null);
  const [ratingBooking, setRatingBooking] = useState<ApiBookingWithTrip | null>(null);

  const isDriver = user?.role === 'DRIVER';

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset loading/error state before fetching trips/bookings triggered by this effect
    setLoading(true);
    setError(null);

    const tasks: Array<Promise<unknown>> = [
      ApiClient.myBookings().then(({ bookings }) => { if (!cancelled) setBookings(bookings); }),
    ];
    if (isDriver) {
      tasks.push(
        ApiClient.myDriverTrips().then(({ trips }) => { if (!cancelled) setDriverTrips(trips); }),
        ApiClient.getDriverBookingRequests().then(({ bookings: reqs }) => { if (!cancelled) setDriverRequests(reqs); }),
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

  async function handleAccept(bookingId: string) {
    setActioningId(bookingId);
    setActionError(null);
    try {
      await ApiClient.acceptBooking(bookingId);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Action impossible');
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(bookingId: string, reference: string) {
    const ok = window.confirm(`Refuser la demande ${reference} ?\n\nLes places seront remises en vente et le passager sera notifié.`);
    if (!ok) return;
    setActioningId(bookingId);
    setActionError(null);
    try {
      await ApiClient.rejectBooking(bookingId);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Action impossible');
    } finally {
      setActioningId(null);
    }
  }

  // eslint-disable-next-line react-hooks/purity -- splits bookings into upcoming/past based on current time, display-only
  const now = Date.now();
  const upcomingBookings = (bookings ?? []).filter(
    (b) => (b.status === 'PENDING' || b.status === 'CONFIRMED') && new Date(b.trip.departureAt).getTime() >= now,
  );
  const pastBookings = (bookings ?? []).filter(
    (b) => b.status === 'CANCELLED' || b.status === 'COMPLETED' || new Date(b.trip.departureAt).getTime() < now,
  );
  const publishedTrips = driverTrips ?? [];
  const pendingRequests = driverRequests ?? [];

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
              ...(isDriver ? [{ id: 'requests' as TabSection, label: '📩 Demandes', count: pendingRequests.length, urgent: pendingRequests.length > 0 }] : []),
            ]
          ).map((t) => {
            const active = section === t.id;
            const urgent = 'urgent' in t && t.urgent;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSection(t.id)}
                className={cn(
                  'relative flex-1 border-b-2 py-2.5 text-xs font-semibold transition-colors',
                  active
                    ? 'border-sbs-blue text-sbs-blue'
                    : 'border-transparent text-sbs-muted hover:text-sbs-dark',
                )}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={cn(
                    'ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                    urgent ? 'bg-sbs-red text-white' : 'text-[10px] text-sbs-muted',
                  )}>
                    {urgent ? t.count : `(${t.count})`}
                  </span>
                )}
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
          <BookingsList
            bookings={pastBookings}
            kind="past"
            onNavigate={onNavigate}
            onRate={(b) => setRatingBooking(b)}
          />
        )}
        {cancelTripError && (
          <div role="alert" className="mb-3 rounded-card border border-sbs-red/30 bg-sbs-red/5 p-3 text-[12px] text-sbs-red">
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {cancelTripError}
            </p>
          </div>
        )}
        {actionError && (
          <div role="alert" className="mb-3 rounded-card border border-sbs-red/30 bg-sbs-red/5 p-3 text-[12px] text-sbs-red">
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {actionError}
            </p>
          </div>
        )}
        {!loading && !error && section === 'requests' && (
          <DriverRequestsList
            requests={pendingRequests}
            onAccept={handleAccept}
            onReject={handleReject}
            actioningId={actioningId}
          />
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

      {ratingBooking && (
        <RatingModal
          booking={ratingBooking}
          onClose={() => setRatingBooking(null)}
          onSuccess={() => {
            setRatingBooking(null);
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      <BottomNav active="trips" onNavigate={onNavigate} />
    </div>
  );
}

/* ============================================================
   Liste des réservations (passager : "À venir" / "Passés")
   ============================================================ */

function BookingsList({ bookings, kind, onNavigate, onCancel, cancellingId, onRate }: {
  bookings: ApiBookingWithTrip[];
  kind: 'upcoming' | 'past';
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
  /** Callback annulation — uniquement passé pour les bookings "upcoming". */
  onCancel?: (bookingId: string, reference: string) => Promise<void>;
  cancellingId?: string | null;
  /** Callback notation — uniquement passé pour les bookings "past". */
  onRate?: (booking: ApiBookingWithTrip) => void;
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

            {/* Bouton Noter — uniquement pour les trajets COMPLETED non encore notés */}
            {kind === 'past' && b.status === 'COMPLETED' && !b.rated && onRate && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRate(b); }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-pill border border-sbs-yellow/40 bg-sbs-yellow-light px-3 py-1.5 text-[11px] font-semibold text-sbs-dark transition-colors hover:bg-sbs-yellow/30"
              >
                <Star className="h-3 w-3 fill-sbs-yellow-dark text-sbs-yellow-dark" />
                Noter ce trajet
              </button>
            )}
            {kind === 'past' && b.status === 'COMPLETED' && b.rated && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-sbs-muted">
                <Star className="h-3 w-3 fill-sbs-yellow-dark text-sbs-yellow-dark" />
                Trajet noté
              </div>
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

/* ============================================================
   Liste des demandes de réservation cash (chauffeur)
   ============================================================ */

function DriverRequestsList({ requests, onAccept, onReject, actioningId }: {
  requests: ApiDriverBookingRequest[];
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string, reference: string) => Promise<void>;
  actioningId: string | null;
}) {
  if (requests.length === 0) {
    return (
      <div className="rounded-card-lg border border-dashed border-sbs-border bg-white px-6 py-12 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="font-display text-base font-extrabold text-sbs-dark">Aucune demande en attente</p>
        <p className="mt-1 text-sm text-sbs-muted">Les demandes de paiement cash de vos passagers apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((r) => {
        const departure = new Date(r.trip.departureAt);
        const fromCity = findCity(r.trip.fromCity)?.name ?? r.trip.fromCity;
        const toCity = findCity(r.trip.toCity)?.name ?? r.trip.toCity;
        const isActioning = actioningId === r.id;
        return (
          <li key={r.id} className="rounded-card-lg border-2 border-amber-200 bg-white p-4 shadow-soft">
            {/* Badge */}
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                <Clock className="h-3 w-3" /> Paiement Cash
              </span>
              <span className="text-[11px] text-sbs-muted">{formatDate(departure)} · {formatTime(departure)}</span>
            </div>

            {/* Trajet */}
            <div className="flex items-center gap-2 text-sm font-bold text-sbs-dark">
              <MapPin className="h-3.5 w-3.5 text-sbs-blue" />
              {fromCity}
              <ArrowRight className="h-3 w-3 text-sbs-muted" />
              {toCity}
            </div>

            {/* Passager */}
            <div className="mt-2 flex items-center gap-2 text-xs text-sbs-muted">
              <Users className="h-3.5 w-3.5" />
              <span>
                <strong className="text-sbs-dark">{r.passenger.firstName} {r.passenger.lastName}</strong>
                {' · '}{r.seats} place{r.seats > 1 ? 's' : ''}
              </span>
            </div>

            {/* Montant */}
            <div className="mt-2 flex items-center justify-between rounded-card border border-sbs-border bg-sbs-cream px-3 py-2 text-sm">
              <span className="text-sbs-muted">Vous recevrez</span>
              <span className="font-display font-extrabold text-sbs-green">{formatXAF(r.driverEarning)}</span>
            </div>

            <div className="mt-2 text-[10px] text-sbs-muted">
              Réf. {r.reference}
            </div>

            {/* Actions */}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onAccept(r.id)}
                disabled={isActioning}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-sbs-green px-3 py-2 text-[12px] font-bold text-white transition-opacity',
                  isActioning ? 'opacity-60' : 'hover:opacity-90',
                )}
              >
                {isActioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Accepter
              </button>
              <button
                type="button"
                onClick={() => onReject(r.id, r.reference)}
                disabled={isActioning}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-sbs-red/40 bg-white px-3 py-2 text-[12px] font-bold text-sbs-red transition-colors',
                  isActioning ? 'opacity-60' : 'hover:bg-sbs-red/5',
                )}
              >
                {isActioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                Refuser
              </button>
            </div>
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
