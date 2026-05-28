import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Users, ArrowRight, Filter, Star, Briefcase, Music, Wind, Cat, Cigarette, Clock, Loader2, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { CITIES, findCity } from '@/data/cities';
import { searchTrips, todayISO } from '@/lib/search';
import { ApiClient, type ApiTrip } from '@/lib/api';
import { computeTripCategory, CATEGORY_INFO, VEHICLE_TYPE_LABEL, isBargainPrice } from '@/lib/category';
import { cn, formatDuration, formatTime, formatXAF } from '@/lib/utils';
import { TrustBadge } from '@/components/security/TrustBadge';
import type { Screen, SearchFilters, Trip, TripOption, TripCategory } from '@/lib/types';

interface SearchTripsProps {
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
  /** Filtres initiaux passés par navigation (ex. depuis la landing). */
  initialFromId?: string;
  initialToId?: string;
}

const optionIcons: Record<TripOption, { icon: typeof Briefcase; label: string }> = {
  bagages:       { icon: Briefcase, label: 'Bagages' },
  animaux:       { icon: Cat,       label: 'Animaux' },
  'non-fumeur':  { icon: Cigarette, label: 'Non-fumeur' },
  musique:       { icon: Music,     label: 'Musique' },
  climatisation: { icon: Wind,      label: 'Clim.' },
};

export function SearchTrips({ onNavigate, initialFromId, initialToId }: SearchTripsProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    fromId: initialFromId ?? 'douala',
    toId: initialToId ?? 'bafoussam',
    date: todayISO(),
    passengers: 1,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<TripCategory | 'all'>('all');
  const [apiTrips, setApiTrips] = useState<Trip[] | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Recherche live côté API à chaque changement de filtre
  useEffect(() => {
    let cancelled = false;
    setApiLoading(true);
    setApiError(null);
    ApiClient.searchTrips({
      from: filters.fromId,
      to: filters.toId,
      date: filters.date,
      passengers: filters.passengers,
    })
      .then((data) => {
        if (cancelled) return;
        setApiTrips(data.trips.map(adaptApiTrip));
      })
      .catch((err) => {
        if (cancelled) return;
        setApiError(err.message ?? 'Backend indisponible');
        setApiTrips(null);
      })
      .finally(() => { if (!cancelled) setApiLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  // Fallback : si l'API n'a rien renvoyé, on affiche les mocks
  const mockResults = useMemo(() => searchTrips(filters), [filters]);
  const allResults = apiTrips ?? mockResults;
  const isLive = apiTrips !== null;

  // Filtrage par catégorie
  const results = useMemo(() => {
    if (categoryFilter === 'all') return allResults;
    return allResults.filter((t) =>
      computeTripCategory(t.driver.car.type, t.driver.car.year, t.options) === categoryFilter,
    );
  }, [allResults, categoryFilter]);

  // Compteurs par catégorie (pour afficher dans les pills "Confort (3)")
  const countsByCategory = useMemo(() => {
    const counts: Record<TripCategory, number> = { economique: 0, confort: 0, premium: 0 };
    for (const t of allResults) {
      const cat = computeTripCategory(t.driver.car.type, t.driver.car.year, t.options);
      counts[cat]++;
    }
    return counts;
  }, [allResults]);

  function swapCities() {
    setFilters((f) => ({ ...f, fromId: f.toId, toId: f.fromId }));
  }

  return (
    <div className="min-h-screen bg-sbs-cream pb-10">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-sbs-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="grid h-10 w-10 place-items-center rounded-pill border border-sbs-border text-sbs-dark transition-colors hover:bg-sbs-border-soft"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <SbsLogo size="sm" />
            <div className="leading-tight">
              <div className="font-display text-base font-extrabold tracking-tight">
                Recherche
              </div>
              <div className="text-[10px] text-sbs-muted">Trouvez votre prochain trajet</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* Carte de recherche */}
        <section className="rounded-card-lg border border-sbs-border bg-white p-4 shadow-card sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <CitySelect
              label="Départ"
              value={filters.fromId}
              onChange={(v) => setFilters({ ...filters, fromId: v })}
              excludeId={filters.toId}
            />
            <div className="relative">
              <CitySelect
                label="Arrivée"
                value={filters.toId}
                onChange={(v) => setFilters({ ...filters, toId: v })}
                excludeId={filters.fromId}
              />
              <button
                type="button"
                onClick={swapCities}
                aria-label="Inverser départ et arrivée"
                className="absolute -left-3 top-7 hidden h-8 w-8 -translate-x-1/2 place-items-center rounded-full border border-sbs-border bg-white text-sbs-blue shadow-soft transition-transform hover:rotate-180 sm:grid"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input
              label="Date du trajet"
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              min={todayISO()}
              leftIcon={<Calendar className="h-4 w-4" />}
            />
            <Input
              label="Nombre de passagers"
              type="number"
              min={1}
              max={4}
              value={filters.passengers}
              onChange={(e) => setFilters({ ...filters, passengers: Math.max(1, Math.min(4, Number(e.target.value) || 1)) })}
              leftIcon={<Users className="h-4 w-4" />}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-sbs-blue hover:underline"
            >
              <Filter className="h-3.5 w-3.5" />
              {showFilters ? 'Masquer les filtres' : 'Filtres avancés'}
            </button>
            <div className="flex items-center gap-2">
              {apiLoading ? (
                <span className="inline-flex items-center gap-1 rounded-pill border border-sbs-border bg-white px-2 py-0.5 text-[10px] font-semibold text-sbs-muted">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Recherche…
                </span>
              ) : isLive ? (
                <span className="inline-flex items-center gap-1 rounded-pill border border-sbs-green/30 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-sbs-green" title="Données en direct du serveur">
                  <Cloud className="h-3 w-3" />
                  Live
                </span>
              ) : apiError ? (
                <span className="inline-flex items-center gap-1 rounded-pill border border-sbs-yellow/30 bg-sbs-yellow-light px-2 py-0.5 text-[10px] font-semibold text-sbs-yellow-dark" title={apiError}>
                  <CloudOff className="h-3 w-3" />
                  Hors-ligne
                </span>
              ) : null}
              <Badge tone="blue">{results.length} trajet{results.length > 1 ? 's' : ''}</Badge>
            </div>
          </div>

          {showFilters && <AdvancedFilters filters={filters} onChange={setFilters} />}
        </section>

        {/* Filtre catégorie — pills Économique / Confort / Premium VIP */}
        <section className="mt-4 -mx-1 flex items-center gap-2 overflow-x-auto scrollbar-hide px-1">
          {(['all', 'premium', 'confort', 'economique'] as const).map((cat) => {
            const active = categoryFilter === cat;
            const info = cat === 'all' ? null : CATEGORY_INFO[cat];
            const count = cat === 'all' ? allResults.length : countsByCategory[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'shrink-0 inline-flex items-center gap-1.5 rounded-pill border-2 px-3 py-1.5 text-xs font-bold transition-all',
                  active
                    ? info
                      ? cn(info.bgClass, info.textClass, info.borderClass, 'shadow-soft scale-[1.02]')
                      : 'bg-sbs-blue text-white border-sbs-blue shadow-soft scale-[1.02]'
                    : 'border-sbs-border bg-white text-sbs-muted hover:border-sbs-blue/40 hover:text-sbs-dark',
                )}
              >
                {info ? <span aria-hidden>{info.emoji}</span> : '✨'}
                {info ? info.label : 'Tous niveaux'}
                <span className={cn(
                  'inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold',
                  active ? 'bg-white/30 text-current' : 'bg-sbs-border-soft text-sbs-muted',
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </section>

        {/* Résultats */}
        <section className="mt-6">
          <h2 className="mb-3 font-display text-lg font-extrabold text-sbs-dark">
            Trajets disponibles
          </h2>
          {results.length === 0 ? (
            <EmptyResults onNavigate={onNavigate} />
          ) : (
            <ul className="space-y-3">
              {results.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  passengers={filters.passengers}
                  onSelect={() => onNavigate('trip-detail', { tripId: trip.id })}
                />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

/* ----------------------------- CitySelect ----------------------------- */

function CitySelect({
  label,
  value,
  onChange,
  excludeId,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  excludeId?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-sbs-dark">{label}</label>
      <div className="relative flex items-center rounded-btn border border-sbs-border bg-white focus-within:border-sbs-blue focus-within:ring-2 focus-within:ring-sbs-blue/20">
        <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-muted">
          <MapPin className="h-4 w-4" />
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 flex-1 appearance-none bg-transparent pr-4 text-sm font-semibold text-sbs-dark focus:outline-none"
        >
          {CITIES.filter((c) => c.id !== excludeId).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.region}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ----------------------------- Filters ----------------------------- */

function AdvancedFilters({
  filters,
  onChange,
}: {
  filters: SearchFilters;
  onChange: (f: SearchFilters) => void;
}) {
  const options: TripOption[] = ['bagages', 'animaux', 'non-fumeur', 'musique', 'climatisation'];
  const selected = filters.options ?? [];

  function toggle(opt: TripOption) {
    const next = selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt];
    onChange({ ...filters, options: next });
  }

  return (
    <div className="mt-4 border-t border-sbs-border-soft pt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Prix maximum (F CFA)"
          type="number"
          min={0}
          step={500}
          value={filters.maxPrice ?? ''}
          onChange={(e) => onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="ex. 5000"
        />
        <Input
          label="Note minimale chauffeur"
          type="number"
          min={0}
          max={5}
          step={0.5}
          value={filters.minRating ?? ''}
          onChange={(e) => onChange({ ...filters, minRating: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="ex. 4.5"
          leftIcon={<Star className="h-4 w-4" />}
        />
      </div>
      <div className="mt-4">
        <label className="text-xs font-semibold text-sbs-dark">Options souhaitées</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((opt) => {
            const { icon: Icon, label } = optionIcons[opt];
            const active = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors',
                  active
                    ? 'border-sbs-blue bg-sbs-blue text-white'
                    : 'border-sbs-border bg-white text-sbs-muted hover:border-sbs-blue/40 hover:text-sbs-blue',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- TripCard ----------------------------- */

function TripCard({ trip, passengers, onSelect }: { trip: Trip; passengers: number; onSelect: () => void }) {
  const departure = new Date(trip.departureAt);
  const arrival = new Date(departure.getTime() + trip.durationMin * 60 * 1000);
  const category = computeTripCategory(trip.driver.car.type, trip.driver.car.year, trip.options);
  const bargain = isBargainPrice(trip.pricePerSeat, category);

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'w-full rounded-card-lg border bg-white p-4 text-left shadow-soft transition-all hover:shadow-card sm:p-5',
          bargain
            ? 'border-sbs-yellow ring-2 ring-sbs-yellow/30 hover:border-sbs-yellow'
            : 'border-sbs-border hover:border-sbs-blue/40',
        )}
      >
        {/* Badge catégorie + badge Bon plan si applicable */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CategoryBadge category={category} size="md" />
            {bargain && (
              <span className="inline-flex items-center gap-1 rounded-pill border border-sbs-yellow bg-sbs-yellow-light px-2 py-0.5 text-[10px] font-extrabold text-sbs-yellow-dark">
                🎁 Bon plan
              </span>
            )}
          </div>
          <span className="text-[11px] text-sbs-muted">
            {VEHICLE_TYPE_LABEL[trip.driver.car.type]} · {trip.driver.car.year}
          </span>
        </div>

        <div className="flex gap-4">
          {/* Timeline */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <span className="h-2.5 w-2.5 rounded-full bg-sbs-blue ring-4 ring-sbs-blue/15" />
            <span className="h-12 w-0.5 border-l-2 border-dashed border-sbs-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-sbs-yellow ring-4 ring-sbs-yellow/20" />
          </div>

          {/* Infos */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-lg font-extrabold text-sbs-dark">{formatTime(departure)}</span>
                  <span className="text-sm font-semibold text-sbs-dark">{trip.from.name}</span>
                </div>
                <div className="ml-0 truncate text-xs text-sbs-muted">{trip.pickupPoint}</div>
              </div>
              <Badge tone={trip.seatsLeft <= 1 ? 'red' : trip.seatsLeft <= 2 ? 'yellow' : 'green'}>
                {trip.seatsLeft} place{trip.seatsLeft > 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="my-2 flex items-center gap-1.5 text-[11px] text-sbs-muted">
              <Clock className="h-3 w-3" />
              {formatDuration(trip.durationMin)}
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-lg font-extrabold text-sbs-dark">{formatTime(arrival)}</span>
                  <span className="text-sm font-semibold text-sbs-dark">{trip.to.name}</span>
                </div>
                <div className="truncate text-xs text-sbs-muted">{trip.dropoffPoint}</div>
              </div>
            </div>
          </div>

          {/* Prix */}
          <div className="flex shrink-0 flex-col items-end justify-between text-right">
            <div>
              <div className="font-display text-xl font-extrabold text-sbs-blue">
                {formatXAF(trip.pricePerSeat * passengers)}
              </div>
              <div className="text-[10px] text-sbs-muted">
                {passengers > 1 ? `${passengers} × ${formatXAF(trip.pricePerSeat)}` : 'par place'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: driver + options */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-sbs-border-soft pt-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={trip.driver.name} size="sm" />
            <div className="leading-tight">
              <div className="flex items-center gap-1.5 text-sm font-bold text-sbs-dark">
                {trip.driver.name}
                {trip.driver.trustLevel && (
                  <TrustBadge level={trip.driver.trustLevel} size="sm" showLabel={false} />
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-sbs-muted">
                <Star className="h-3 w-3 fill-sbs-yellow text-sbs-yellow" />
                {trip.driver.rating} · {trip.driver.tripsCompleted} trajets
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {trip.options.map((opt) => {
              const { icon: Icon, label } = optionIcons[opt];
              return (
                <span
                  key={opt}
                  className="inline-flex items-center gap-1 rounded-pill border border-sbs-border bg-sbs-cream px-2 py-0.5 text-[10px] font-semibold text-sbs-muted"
                  title={label}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </button>
    </li>
  );
}

/* ----------------------------- Empty ----------------------------- */

function EmptyResults({ onNavigate }: { onNavigate: (s: Screen, params?: Record<string, string>) => void }) {
  return (
    <div className="rounded-card-lg border border-dashed border-sbs-border bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-sbs-yellow-light text-3xl">
        🔍
      </div>
      <p className="font-display text-base font-extrabold text-sbs-dark">
        Aucun trajet ne correspond à votre recherche
      </p>
      <p className="mt-1 text-sm text-sbs-muted">
        Essayez une autre date, un autre itinéraire, ou réduisez les filtres.
      </p>
      <div className="mt-5">
        <Button variant="primary" size="md" onClick={() => onNavigate('publish-trip')} className="rounded-pill">
          Devenir chauffeur sur ce trajet
        </Button>
      </div>
    </div>
  );
}

/* ===================================================================
   Adaptateur ApiTrip → Trip (le type "local" attendu par les composants)
   =================================================================== */

const API_OPTION_TO_LOCAL: Record<ApiTrip['options'][number], TripOption> = {
  BAGAGES: 'bagages',
  ANIMAUX: 'animaux',
  NON_FUMEUR: 'non-fumeur',
  MUSIQUE: 'musique',
  CLIMATISATION: 'climatisation',
};

const API_TRUST_TO_LOCAL: Record<ApiTrip['driver']['trustLevel'], 'basic' | 'verified' | 'premium'> = {
  BASIC: 'basic',
  VERIFIED: 'verified',
  PREMIUM: 'premium',
};

function adaptApiTrip(a: ApiTrip): Trip {
  const fromCity = findCity(a.fromCity) ?? { id: a.fromCity, name: a.fromCity, region: '' };
  const toCity = findCity(a.toCity) ?? { id: a.toCity, name: a.toCity, region: '' };
  return {
    id: a.id,
    driver: {
      id: a.driver.id,
      name: `${a.driver.firstName} ${a.driver.lastName}`,
      rating: a.driver.ratingAvg ?? 5,
      tripsCompleted: a.driver.tripsCompleted,
      yearsActive: 0,
      car: {
        model: a.vehicle?.model ?? 'Véhicule',
        color: a.vehicle?.color ?? '',
        plate: maskPlate(a.vehicle?.plate ?? ''),
        // L'API ne renvoie pas encore ces champs — fallback raisonnable
        type: 'berline',
        year: new Date().getFullYear() - 3,
      },
      verified: a.driver.trustLevel !== 'BASIC',
      trustLevel: API_TRUST_TO_LOCAL[a.driver.trustLevel],
    },
    from: fromCity,
    to: toCity,
    pickupPoint: a.pickupPoint,
    dropoffPoint: a.dropoffPoint,
    departureAt: a.departureAt,
    durationMin: a.durationMin,
    seatsTotal: a.seatsTotal,
    seatsLeft: a.seatsLeft,
    pricePerSeat: a.pricePerSeat,
    options: a.options.map((o) => API_OPTION_TO_LOCAL[o]),
    status: a.status === 'AVAILABLE' ? 'available'
      : a.status === 'FULL' ? 'full'
      : a.status === 'DEPARTED' ? 'departed'
      : a.status === 'COMPLETED' ? 'completed'
      : 'cancelled',
  };
}

/** Masque une plaque type "LT 489 AA" en "LT 4** AA". */
function maskPlate(plate: string): string {
  if (plate.length < 5) return plate;
  return plate.replace(/(\S+\s\d)\d+/, '$1**');
}
