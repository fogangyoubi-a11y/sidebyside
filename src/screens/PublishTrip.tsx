import { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, MapPin, Calendar, Users, Coins,
  Briefcase, Cat, Cigarette, Music, Wind, CheckCircle2, Car, Bus, Sparkles, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { Input } from '@/components/ui/Input';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { TimeInput } from '@/components/security/TimeInput';
import { DateInput } from '@/components/security/DateInput';
import { TrustBadge } from '@/components/security/TrustBadge';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { CITIES } from '@/data/cities';
import { useAuth } from '@/hooks/useAuth';
import { ApiClient, ApiError, type ApiAgency } from '@/lib/api';
import { cn, formatXAF } from '@/lib/utils';
import { todayISO } from '@/lib/search';
import { computeTripCategory, VEHICLE_TYPE_LABEL, PRICE_RANGE_BY_CATEGORY, isPriceValidForCategory, isBargainPrice, ABSOLUTE_MIN_PRICE, CATEGORY_INFO } from '@/lib/category';
import type { Screen, TripOption, TripType, VehicleType } from '@/lib/types';

/** Places max selon le type de trajet — voiture (4) ou bus (70, cf. schema Prisma). */
const MAX_SEATS_BY_TYPE: Record<TripType, number> = { car: 4, bus: 70 };

/** Commission SBS — taux fixe différencié CAR/BUS (cf. bookings.ts backend). */
const COMMISSION_RATE_BY_TYPE: Record<TripType, number> = { car: 0.12, bus: 0.06 };

/** Mapping options local → enum API (majuscules). */
const OPTION_TO_API: Record<TripOption, 'BAGAGES' | 'ANIMAUX' | 'NON_FUMEUR' | 'MUSIQUE' | 'CLIMATISATION'> = {
  bagages: 'BAGAGES',
  animaux: 'ANIMAUX',
  'non-fumeur': 'NON_FUMEUR',
  musique: 'MUSIQUE',
  climatisation: 'CLIMATISATION',
};

/**
 * Estimation de durée par couple de villes (en minutes).
 * Valeurs cohérentes avec ce qu'affiche la Landing + le seed backend.
 * Fallback : 180 min pour les axes non listés.
 */
const ROUTE_DURATION_MIN: Record<string, number> = {
  'douala->bafoussam': 240,
  'bafoussam->douala': 245,
  'douala->yaounde': 210,
  'yaounde->douala': 210,
  'bafoussam->bamenda': 90,
  'bamenda->bafoussam': 90,
  'douala->kribi': 165,
  'kribi->douala': 165,
  'bafoussam->dschang': 60,
  'dschang->bafoussam': 60,
};

function estimateDurationMin(fromId: string, toId: string): number {
  return ROUTE_DURATION_MIN[`${fromId}->${toId}`] ?? 180;
}

interface PublishTripProps {
  onNavigate: (s: Screen) => void;
}

interface FormState {
  tripType: TripType;    // 'car' (défaut) ou 'bus' (agence)
  agencyId: string;      // requis si tripType === 'bus'
  fromId: string;
  toId: string;
  date: string;
  time: string;          // HH:mm
  pickupPoint: string;
  dropoffPoint: string;
  seats: number;
  pricePerSeat: number;  // F CFA
  options: TripOption[];
  vehicleType: VehicleType;
  vehicleYear: number;
}

const OPTION_DEFS: Array<{ id: TripOption; icon: typeof Briefcase; label: string }> = [
  { id: 'bagages',       icon: Briefcase, label: 'Bagages volumineux' },
  { id: 'animaux',       icon: Cat,       label: 'Animaux acceptés' },
  { id: 'non-fumeur',    icon: Cigarette, label: 'Non-fumeur' },
  { id: 'musique',       icon: Music,     label: 'Musique à bord' },
  { id: 'climatisation', icon: Wind,      label: 'Climatisation' },
];

const initialForm: FormState = {
  tripType: 'car',
  agencyId: '',
  fromId: 'douala',
  toId: 'bafoussam',
  date: todayISO(),
  time: '07:00',
  pickupPoint: '',
  dropoffPoint: '',
  seats: 3,
  pricePerSeat: 3500,
  options: ['climatisation', 'non-fumeur'],
  vehicleType: 'berline',
  vehicleYear: new Date().getFullYear() - 3,
};

const VEHICLE_TYPES: VehicleType[] = ['berline', 'citadine', 'suv', '4x4', 'monospace'];

/** Date max acceptée pour la publication = aujourd'hui + 90 jours. */
function maxDateISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function PublishTrip({ onNavigate }: PublishTripProps) {
  const { isAuthenticated, user } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [published, setPublished] = useState(false);
  const [publishedTripId, setPublishedTripId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Aller-retour
  const [withReturn, setWithReturn] = useState(false);
  const [returnTime, setReturnTime] = useState('17:00');
  // Agences de l'utilisateur — chargées uniquement quand il choisit "Bus"
  const [myAgencies, setMyAgencies] = useState<ApiAgency[]>([]);
  const [agenciesLoading, setAgenciesLoading] = useState(false);

  // Charge les agences VÉRIFIÉES appartenant à l'utilisateur dès qu'il passe en mode "Bus"
  // (seule une agence VERIFIED peut publier — même contrainte que côté backend).
  useEffect(() => {
    let cancelled = false;
    if (isAuthenticated) {
      setAgenciesLoading(true);
      ApiClient.listAgencies()
        .then(({ agencies }) => {
          if (!cancelled) setMyAgencies(agencies.filter((a) => a.userId === user?.id));
        })
        .catch(() => { if (!cancelled) setMyAgencies([]); })
        .finally(() => { if (!cancelled) setAgenciesLoading(false); });
    }
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  // Si l'utilisateur arrive ici sans être connecté (ex. URL directe), on lui
  // demande d'abord de se connecter / créer un compte avant le formulaire.
  if (!isAuthenticated) {
    return (
      <AuthGateModal
        action="publier un trajet"
        onClose={() => onNavigate('landing')}
        onLogin={() => onNavigate('login')}
        onRegister={() => onNavigate('onboarding')}
      />
    );
  }

  // Restriction côté API : POST /trips exige role=DRIVER. On préviens l'utilisateur
  // avant qu'il remplisse tout le formulaire si son compte est en mode PASSENGER.
  if (user && user.role !== 'DRIVER') {
    return (
      <DriverRequired onNavigate={onNavigate} />
    );
  }

  function update(patch: Partial<FormState>) {
    setForm((f) => {
      const next = { ...f, ...patch };
      // Si on change le véhicule ou les options, la catégorie peut changer
      // → on n'ajuste le prix QUE s'il dépasse le plafond de la nouvelle catégorie
      // (un prix bas reste valide même après changement — l'utilisateur garde sa volonté)
      const categoryChanged =
        patch.vehicleType !== undefined ||
        patch.vehicleYear !== undefined ||
        patch.options !== undefined;
      if (categoryChanged) {
        const newCat = computeTripCategory(next.vehicleType, next.vehicleYear, next.options);
        const newMax = PRICE_RANGE_BY_CATEGORY[newCat].max;
        if (next.pricePerSeat > newMax || next.pricePerSeat < ABSOLUTE_MIN_PRICE) {
          next.pricePerSeat = PRICE_RANGE_BY_CATEGORY[newCat].suggested;
        }
      }
      return next;
    });
  }

  function toggleOption(opt: TripOption) {
    const next = form.options.includes(opt)
      ? form.options.filter((o) => o !== opt)
      : [...form.options, opt];
    update({ options: next });
  }

  const fromCity = CITIES.find((c) => c.id === form.fromId)!;
  const toCity = CITIES.find((c) => c.id === form.toId)!;
  const isBus = form.tripType === 'bus';
  const maxSeats = MAX_SEATS_BY_TYPE[form.tripType];

  // Taux SBS réel — fixe et différencié CAR (12 %) / BUS (6 %), cf. bookings.ts backend.
  const commissionRate = COMMISSION_RATE_BY_TYPE[form.tripType];
  const commission = Math.round(form.pricePerSeat * commissionRate);
  const driverEarningPerSeat = form.pricePerSeat - commission;
  const driverTotalEarning = driverEarningPerSeat * form.seats;

  // Catégorie calculée d'après le véhicule + options + la fourchette de prix associée.
  // Le système de catégorie (économique/confort/premium) est pensé pour les voitures ;
  // pour un bus on retombe sur une simple fourchette de prix autorisée côté backend.
  const category = computeTripCategory(form.vehicleType, form.vehicleYear, form.options);
  const priceRange = PRICE_RANGE_BY_CATEGORY[category];
  const priceValid = isBus
    ? form.pricePerSeat >= 1000 && form.pricePerSeat <= 50000
    : isPriceValidForCategory(form.pricePerSeat, category);
  const isBargain = !isBus && isBargainPrice(form.pricePerSeat, category);

  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(form.date);
  const valid =
    form.fromId !== form.toId &&
    validDate &&
    /^\d{2}:\d{2}$/.test(form.time) &&
    form.pickupPoint.trim().length >= 5 &&
    form.dropoffPoint.trim().length >= 5 &&
    form.seats >= 1 && form.seats <= maxSeats &&
    (!isBus || form.agencyId !== '') &&
    priceValid;

  /** Construit le payload backend et POSTe /api/trips. */
  async function handlePublish() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      // ISO datetime — on combine date locale (YYYY-MM-DD) + heure (HH:mm) en local,
      // puis on convertit en UTC via Date(). Le backend stocke en UTC.
      const [hh, mm] = form.time.split(':').map(Number);
      const departure = new Date(form.date);
      departure.setHours(hh ?? 0, mm ?? 0, 0, 0);

      const { trip } = await ApiClient.publishTrip({
        type: isBus ? 'BUS' : 'CAR',
        providerType: isBus ? 'AGENCY' : 'INDIVIDUAL',
        agencyId: isBus ? form.agencyId : undefined,
        fromCity: form.fromId,
        toCity: form.toId,
        pickupPoint: form.pickupPoint.trim(),
        dropoffPoint: form.dropoffPoint.trim(),
        departureAt: departure.toISOString(),
        durationMin: estimateDurationMin(form.fromId, form.toId),
        seatsTotal: form.seats,
        pricePerSeat: form.pricePerSeat,
        options: form.options.map((o) => OPTION_TO_API[o]),
      });
      setPublishedTripId(trip.id);

      // Si aller-retour : publier aussi le trajet retour (villes inversées, même date)
      if (withReturn) {
        const [rhh, rmm] = returnTime.split(':').map(Number);
        const returnDeparture = new Date(form.date);
        returnDeparture.setHours(rhh ?? 0, rmm ?? 0, 0, 0);
        await ApiClient.publishTrip({
          type: isBus ? 'BUS' : 'CAR',
          providerType: isBus ? 'AGENCY' : 'INDIVIDUAL',
          agencyId: isBus ? form.agencyId : undefined,
          fromCity: form.toId,
          toCity: form.fromId,
          pickupPoint: form.dropoffPoint.trim(),
          dropoffPoint: form.pickupPoint.trim(),
          departureAt: returnDeparture.toISOString(),
          durationMin: estimateDurationMin(form.toId, form.fromId),
          seatsTotal: form.seats,
          pricePerSeat: form.pricePerSeat,
          options: form.options.map((o) => OPTION_TO_API[o]),
        });
      }

      setPublished(true);
    } catch (err) {
      if (err instanceof ApiError) {
        // 403 = pas chauffeur ; 400 = validation. On affiche le message tel quel.
        setSubmitError(err.message);
      } else {
        setSubmitError('Publication impossible. Vérifiez votre connexion.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (published) return <PublishSuccess form={form} fromCity={fromCity} toCity={toCity} tripId={publishedTripId} withReturn={withReturn} returnTime={returnTime} onNavigate={onNavigate} />;

  return (
    <div className="min-h-screen bg-sbs-cream pb-32">
      <header className="sticky top-0 z-30 border-b border-sbs-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
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
                <div className="font-display text-base font-extrabold tracking-tight">Publier un trajet</div>
                <div className="text-[10px] text-sbs-muted">Espace chauffeur</div>
              </div>
            </div>
          </div>
          <TrustBadge level="verified" size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Type de trajet */}
        <Section title="🚐 Type de trajet">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => update({ tripType: 'car', agencyId: '' })}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-card border-2 px-4 py-3 text-sm font-semibold transition-colors',
                !isBus ? 'border-sbs-blue bg-sbs-blue-light/40 text-sbs-blue' : 'border-sbs-border bg-white text-sbs-muted hover:border-sbs-blue/40',
              )}
            >
              <Car className="h-5 w-5" />
              Voiture
              <span className="text-[10px] font-normal text-sbs-muted">Particulier · 1 à 4 places</span>
            </button>
            <button
              type="button"
              onClick={() => update({ tripType: 'bus' })}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-card border-2 px-4 py-3 text-sm font-semibold transition-colors',
                isBus ? 'border-sbs-blue bg-sbs-blue-light/40 text-sbs-blue' : 'border-sbs-border bg-white text-sbs-muted hover:border-sbs-blue/40',
              )}
            >
              <Bus className="h-5 w-5" />
              Bus
              <span className="text-[10px] font-normal text-sbs-muted">Agence · jusqu'à 70 places</span>
            </button>
          </div>

          {isBus && (
            <div className="mt-4 rounded-card border border-sbs-blue/20 bg-sbs-blue-light/30 p-3">
              <label className="text-xs font-semibold text-sbs-dark">Agence</label>
              {agenciesLoading ? (
                <p className="mt-1.5 text-[11px] text-sbs-muted">Chargement de vos agences…</p>
              ) : myAgencies.length === 0 ? (
                <p className="mt-1.5 text-[11px] text-sbs-red">
                  🚫 Aucune agence vérifiée associée à votre compte. Enregistrez une agence et attendez sa validation par SideBySide avant de publier un trajet Bus.
                </p>
              ) : (
                <div className="relative mt-1.5 flex items-center rounded-btn border border-sbs-border bg-white">
                  <select
                    value={form.agencyId}
                    onChange={(e) => update({ agencyId: e.target.value })}
                    className="h-11 w-full flex-1 appearance-none bg-transparent px-3 text-sm font-semibold text-sbs-dark focus:outline-none"
                  >
                    <option value="" disabled>Sélectionnez une agence</option>
                    {myAgencies.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}{a.city ? ` · ${a.city}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Itinéraire */}
        <Section title="📍 Itinéraire">
          <div className="grid gap-3 sm:grid-cols-2">
            <CitySelect label="Ville de départ" value={form.fromId} onChange={(v) => update({ fromId: v })} excludeId={form.toId} />
            <CitySelect label="Ville d'arrivée" value={form.toId} onChange={(v) => update({ toId: v })} excludeId={form.fromId} />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input
              label="Point de RDV départ"
              placeholder="ex. Rond-point Bonamoussadi"
              value={form.pickupPoint}
              onChange={(e) => update({ pickupPoint: e.target.value })}
              leftIcon={<MapPin className="h-4 w-4" />}
            />
            <Input
              label="Point d'arrivée"
              placeholder="ex. Carrefour Akwa"
              value={form.dropoffPoint}
              onChange={(e) => update({ dropoffPoint: e.target.value })}
              leftIcon={<MapPin className="h-4 w-4" />}
            />
          </div>
        </Section>

        {/* Date & heure */}
        <Section title="📅 Quand partez-vous ?">
          <div className="grid gap-3 sm:grid-cols-2">
            <DateInput
              label="Date du départ"
              value={form.date}
              min={todayISO()}
              max={maxDateISO()}
              onChange={(date) => update({ date })}
            />
            <TimeInput
              label="Heure de départ"
              value={form.time}
              onChange={(time) => update({ time })}
            />
          </div>
        </Section>

        {/* Aller-retour */}
        <Section title="🔄 Trajet retour">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-sbs-dark">Publier aussi le retour</p>
              <p className="text-[11px] text-sbs-muted">{toCity.name} → {fromCity.name} le même jour</p>
            </div>
            <button
              type="button"
              onClick={() => setWithReturn((v) => !v)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                withReturn ? 'bg-sbs-blue' : 'bg-gray-200',
              )}
              role="switch"
              aria-checked={withReturn}
            >
              <span className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200',
                withReturn ? 'translate-x-5' : 'translate-x-0',
              )} />
            </button>
          </div>

          {withReturn && (
            <div className="mt-4 rounded-card border border-sbs-blue/20 bg-sbs-blue-light/30 p-3">
              <TimeInput
                label={`Heure de départ retour (${toCity.name} → ${fromCity.name})`}
                value={returnTime}
                onChange={setReturnTime}
              />
              <p className="mt-2 text-[11px] text-sbs-muted">
                💡 Les points de RDV seront automatiquement inversés (départ = votre point d'arrivée aller).
              </p>
            </div>
          )}
        </Section>

        {/* Véhicule — pertinent uniquement pour les trajets Voiture (catégorie économique/confort/premium) */}
        {!isBus && (
        <Section title="🚗 Votre véhicule">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-sbs-dark">Type de véhicule</label>
              <div className="relative mt-1.5 flex items-center rounded-btn border border-sbs-border bg-white focus-within:border-sbs-blue focus-within:ring-2 focus-within:ring-sbs-blue/20">
                <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-muted">
                  <Car className="h-4 w-4" />
                </span>
                <select
                  value={form.vehicleType}
                  onChange={(e) => update({ vehicleType: e.target.value as VehicleType })}
                  className="h-11 flex-1 appearance-none bg-transparent pr-4 text-sm font-semibold text-sbs-dark focus:outline-none"
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>{VEHICLE_TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-sbs-dark">Année du véhicule</label>
              <div className="mt-1.5 flex items-center rounded-btn border border-sbs-border bg-white">
                <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-muted">
                  <Calendar className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={String(new Date().getFullYear() - 3)}
                  value={form.vehicleYear > 0 ? String(form.vehicleYear) : ''}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                    update({ vehicleYear: digits === '' ? 0 : parseInt(digits, 10) });
                  }}
                  onFocus={(e) => e.target.select()}
                  className="h-11 flex-1 bg-transparent text-sm font-bold text-sbs-dark placeholder:font-normal placeholder:text-sbs-muted/60 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Aperçu LIVE de la catégorie + fourchette de prix associée */}
          <div className="mt-4 rounded-card border border-sbs-blue/15 bg-sbs-blue-light/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] text-sbs-blue">
                <div className="font-semibold">Avec ces infos, votre trajet est classé :</div>
                <div className="mt-0.5 text-[10px] text-sbs-muted">
                  Catégorie calculée automatiquement
                </div>
              </div>
              <CategoryBadge category={category} size="lg" />
            </div>
            <div className="mt-3 rounded-card bg-white px-3 py-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sbs-dark">Tarif normal {CATEGORY_INFO[category].label} :</span>
                <span className="font-mono font-bold text-sbs-blue">
                  {priceRange.min.toLocaleString('fr-FR')} – {priceRange.max.toLocaleString('fr-FR')} F CFA
                </span>
              </div>
              {category !== 'economique' && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-sbs-yellow-dark">🎁 Vous pouvez aussi baisser jusqu'à :</span>
                  <span className="font-mono text-[10px] font-bold text-sbs-yellow-dark">
                    {ABSOLUTE_MIN_PRICE.toLocaleString('fr-FR')} F CFA (Bon plan)
                  </span>
                </div>
              )}
              <p className="mt-1 text-[10px] text-sbs-muted">
                💡 {category === 'premium'
                  ? 'Vous êtes déjà au plus haut niveau ! Vous pouvez aussi vendre moins cher pour remplir vite.'
                  : 'Pour facturer plus, équipez-vous d\'un SUV/4×4 récent avec climatisation.'}
              </p>
            </div>
          </div>
        </Section>
        )}

        {/* Options */}
        <Section title="🛋 Options du trajet">
          <div className="flex flex-wrap gap-2">
            {OPTION_DEFS.map(({ id, icon: Icon, label }) => {
              const active = form.options.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleOption(id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors',
                    active
                      ? 'border-sbs-blue bg-sbs-blue text-white shadow-soft'
                      : 'border-sbs-border bg-white text-sbs-muted hover:border-sbs-blue/40 hover:text-sbs-blue',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-sbs-muted">
            💡 La climatisation peut faire passer votre trajet en catégorie supérieure.
          </p>
        </Section>

        {/* Places & prix — APRÈS le véhicule pour que le chauffeur connaisse déjà sa catégorie */}
        <Section title="👥 Places & prix par passager">
          {/* Rappel visuel de la catégorie pour préparer le chauffeur à la fourchette — non applicable au Bus */}
          {!isBus && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-card bg-sbs-cream px-3 py-2">
              <div className="text-[11px] text-sbs-muted">
                Votre trajet est classé :
              </div>
              <CategoryBadge category={category} size="md" />
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-sbs-dark">Nombre de places</label>
              <div className="mt-1.5 inline-flex w-full items-center justify-between rounded-btn border border-sbs-border bg-white">
                <button
                  type="button"
                  onClick={() => update({ seats: Math.max(1, form.seats - 1) })}
                  className="grid h-11 w-11 place-items-center text-sbs-dark transition-colors hover:bg-sbs-border-soft"
                >−</button>
                <span className="font-display text-lg font-extrabold text-sbs-dark">{form.seats}</span>
                <button
                  type="button"
                  onClick={() => update({ seats: Math.min(maxSeats, form.seats + 1) })}
                  className="grid h-11 w-11 place-items-center text-sbs-dark transition-colors hover:bg-sbs-border-soft"
                >+</button>
              </div>
              <p className="mt-1 text-[11px] text-sbs-muted">1 à {maxSeats} passagers</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-sbs-dark">
                Prix par place (F CFA)
              </label>
              <div className={cn(
                'mt-1.5 flex items-center rounded-btn border bg-white transition-colors',
                priceValid
                  ? 'border-sbs-border focus-within:border-sbs-blue focus-within:ring-2 focus-within:ring-sbs-blue/20'
                  : 'border-sbs-red focus-within:ring-2 focus-within:ring-sbs-red/20',
              )}>
                <span className="grid h-11 w-11 place-items-center text-sbs-muted">
                  <Coins className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={isBus ? '5000' : priceRange.suggested.toString()}
                  value={form.pricePerSeat > 0 ? String(form.pricePerSeat) : ''}
                  onChange={(e) => {
                    // On accepte uniquement les chiffres et on cap à 5 (max 99 999 F)
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 5);
                    update({ pricePerSeat: digits === '' ? 0 : parseInt(digits, 10) });
                  }}
                  onFocus={(e) => e.target.select()}
                  className="h-11 flex-1 bg-transparent text-sm font-bold text-sbs-dark placeholder:font-normal placeholder:text-sbs-muted/60 focus:outline-none"
                />
                <span className="pr-3 text-[11px] font-semibold text-sbs-muted">F CFA</span>
              </div>

              {/* Message contextuel selon le prix */}
              {isBus ? (
                <>
                  {priceValid ? (
                    <p className="mt-1 text-[11px] text-sbs-muted">
                      ✓ Tarif autorisé : 1 000 – 50 000 F CFA
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] font-semibold text-sbs-red">
                      🚫 Le prix doit être compris entre 1 000 et 50 000 F CFA
                    </p>
                  )}
                </>
              ) : (
                <>
                  {priceValid && isBargain && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-sbs-yellow-dark">
                      🎁 Bon plan ! Vous proposez votre {CATEGORY_INFO[category].label} sous le tarif normal — le passager va adorer.
                    </p>
                  )}
                  {priceValid && !isBargain && (
                    <p className="mt-1 text-[11px] text-sbs-muted">
                      ✓ Tarif normal {CATEGORY_INFO[category].label} : {priceRange.min.toLocaleString('fr-FR')} – {priceRange.max.toLocaleString('fr-FR')} F CFA
                    </p>
                  )}
                  {!priceValid && form.pricePerSeat > priceRange.max && (
                    <>
                      <p className="mt-1 text-[11px] font-semibold text-sbs-red">
                        🚫 Trop élevé pour votre catégorie {CATEGORY_INFO[category].label} (plafond {priceRange.max.toLocaleString('fr-FR')} F CFA)
                      </p>
                      <button
                        type="button"
                        onClick={() => update({ pricePerSeat: priceRange.suggested })}
                        className="mt-1.5 text-[11px] font-bold text-sbs-blue hover:underline"
                      >
                        ✨ Utiliser le prix suggéré ({priceRange.suggested.toLocaleString('fr-FR')} F CFA)
                      </button>
                    </>
                  )}
                  {!priceValid && form.pricePerSeat < ABSOLUTE_MIN_PRICE && (
                    <>
                      <p className="mt-1 text-[11px] font-semibold text-sbs-red">
                        🚫 Trop bas — prix minimum {ABSOLUTE_MIN_PRICE.toLocaleString('fr-FR')} F CFA
                      </p>
                      <button
                        type="button"
                        onClick={() => update({ pricePerSeat: ABSOLUTE_MIN_PRICE })}
                        className="mt-1.5 text-[11px] font-bold text-sbs-blue hover:underline"
                      >
                        ✨ Mettre {ABSOLUTE_MIN_PRICE.toLocaleString('fr-FR')} F CFA
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </Section>

        {/* Récap gains */}
        <Section title="💰 Estimation de vos gains">
          <div className="rounded-card-lg border-2 border-sbs-yellow/30 bg-sbs-yellow-light/40 p-5">
            <dl className="space-y-2 text-sm">
              <Row label={`Prix par passager`} value={formatXAF(form.pricePerSeat)} />
              <Row label={`Nombre de places`} value={`× ${form.seats}`} subtle />
              <Row label="Sous-total" value={formatXAF(form.pricePerSeat * form.seats)} subtle />
              <Row label={`Commission SideBySide (${Math.round(commissionRate * 100)} % — ${isBus ? 'bus' : 'voiture'})`} value={`− ${formatXAF(commission * form.seats)}`} subtle />
              <div className="border-t border-sbs-yellow/40 pt-2" />
              <Row label="Vos gains nets" value={formatXAF(driverTotalEarning)} highlight />
            </dl>
            <p className="mt-3 text-center text-[11px] font-semibold text-sbs-yellow-dark">
              Versés en Mobile Money 24h après le trajet
            </p>
          </div>
        </Section>
      </main>

      {/* Erreur backend (validation, conflit, etc.) — affichée au-dessus du CTA */}
      {submitError && (
        <div className="fixed bottom-[80px] left-0 right-0 z-30 px-4 sm:px-6">
          <div role="alert" className="mx-auto max-w-2xl rounded-card border border-sbs-red/30 bg-white p-3 text-[12px] text-sbs-red shadow-card">
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {submitError}
            </p>
          </div>
        </div>
      )}

      {/* Sticky CTA bas */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-sbs-border bg-white px-4 py-3 shadow-card sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div>
            <div className="font-display text-lg font-extrabold text-sbs-green">{formatXAF(driverTotalEarning)}</div>
            <div className="text-[10px] text-sbs-muted">gains estimés</div>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handlePublish}
            disabled={!valid || submitting}
            className="rounded-pill min-w-[200px]"
          >
            {isBus ? <Bus className="h-4 w-4" /> : <Car className="h-4 w-4" />}
            {submitting ? 'Publication…' : withReturn ? 'Publier aller + retour' : 'Publier le trajet'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Affiché si l'utilisateur connecté est PASSENGER au lieu de DRIVER. */
function DriverRequired({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="min-h-screen bg-sbs-cream p-8">
      <div className="mx-auto max-w-md rounded-card-lg border border-sbs-border bg-white p-6 text-center shadow-card">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-sbs-yellow-light text-sbs-yellow-dark">
          <Car className="h-6 w-6" />
        </div>
        <h2 className="font-display text-xl font-extrabold text-sbs-dark">Compte chauffeur requis</h2>
        <p className="mt-2 text-sm text-sbs-muted">
          Votre compte actuel est en mode passager. Pour publier des trajets, il vous faut un
          compte chauffeur (vérification renforcée : permis + carte grise).
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="primary" size="md" onClick={() => onNavigate('onboarding')} className="rounded-pill">
            Créer un compte chauffeur
          </Button>
          <Button variant="ghost" size="md" onClick={() => onNavigate('landing')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}

function PublishSuccess({ form, fromCity, toCity, tripId, withReturn, returnTime, onNavigate }: {
  form: FormState;
  fromCity: { name: string };
  toCity: { name: string };
  tripId: string | null;
  withReturn: boolean;
  returnTime: string;
  onNavigate: (s: Screen) => void;
}) {
  return (
    <div className="min-h-screen bg-sbs-cream">
      <header className="border-b border-sbs-border bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
          <SbsLogo size="sm" />
          <span className="font-display text-base font-extrabold">Publier un trajet</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-sbs-green to-emerald-400 text-white shadow-card">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="font-display text-2xl font-extrabold text-sbs-dark">
          {withReturn ? '2 trajets publiés ! 🎉' : 'Trajet publié ! 🎉'}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-sbs-muted">
          Votre trajet <strong className="text-sbs-dark">{fromCity.name} → {toCity.name}</strong> le {form.date} à {form.time} est désormais visible des passagers.
        </p>
        {withReturn && (
          <p className="mx-auto mt-1 max-w-md text-sm text-sbs-muted">
            + Retour <strong className="text-sbs-dark">{toCity.name} → {fromCity.name}</strong> le {form.date} à {returnTime} également publié.
          </p>
        )}
        {tripId && (
          <p className="mt-2 text-[11px] text-sbs-muted">
            ID trajet : <code className="rounded bg-sbs-border-soft px-1 font-mono text-[10px]">{tripId}</code>
          </p>
        )}

        <div className="mx-auto mt-6 max-w-md rounded-card-lg border border-sbs-border bg-white p-5 text-left shadow-card">
          <h3 className="mb-3 font-display text-sm font-extrabold text-sbs-dark">Prochaines étapes</h3>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sbs-yellow-dark" />
              <span>Les passagers intéressés vous contactent via la messagerie</span>
            </li>
            <li className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-sbs-blue" />
              <span>Vous validez ou refusez chaque réservation</span>
            </li>
            <li className="flex items-start gap-2">
              <Coins className="mt-0.5 h-4 w-4 shrink-0 text-sbs-green" />
              <span>Le paiement est encaissé par SideBySide à la réservation</span>
            </li>
            <li className="flex items-start gap-2">
              <Car className="mt-0.5 h-4 w-4 shrink-0 text-sbs-blue" />
              <span>Vous recevez vos gains 24h après le trajet en Mobile Money</span>
            </li>
          </ul>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="primary" size="lg" onClick={() => onNavigate('publish-trip')} className="rounded-pill">
            <Car className="h-4 w-4" />
            Publier un autre trajet
          </Button>
          <Button variant="ghost" size="lg" onClick={() => onNavigate('landing')}>
            Retour à l'accueil
          </Button>
        </div>
      </main>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-card-lg border border-sbs-border bg-white p-5 shadow-card first:mt-0 sm:p-6">
      <h2 className="mb-3 font-display text-base font-extrabold text-sbs-dark">{title}</h2>
      {children}
    </section>
  );
}

function CitySelect({ label, value, onChange, excludeId }: {
  label: string; value: string; onChange: (id: string) => void; excludeId?: string;
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
            <option key={c.id} value={c.id}>{c.name} · {c.region}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Row({ label, value, highlight, subtle }: { label: string; value: string; highlight?: boolean; subtle?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className={cn('text-sm', subtle ? 'text-sbs-muted' : 'text-sbs-dark')}>{label}</dt>
      <dd className={cn(
        'font-display font-extrabold',
        highlight ? 'text-2xl text-sbs-green' : subtle ? 'text-sm text-sbs-muted' : 'text-base text-sbs-dark',
      )}>
        {value}
      </dd>
    </div>
  );
}

// inutile mais évite warning unused
void Badge;
