import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, MapPin, Calendar, Users, Coins,
  Briefcase, Cat, Cigarette, Music, Wind, CheckCircle2, Car, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { Input } from '@/components/ui/Input';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { TimeInput } from '@/components/security/TimeInput';
import { DateInput } from '@/components/security/DateInput';
import { TrustBadge } from '@/components/security/TrustBadge';
import { CITIES } from '@/data/cities';
import { cn, formatXAF } from '@/lib/utils';
import { todayISO } from '@/lib/search';
import { SBS_COMMISSION_RATE } from '@/lib/booking';
import { computeTripCategory, VEHICLE_TYPE_LABEL } from '@/lib/category';
import type { Screen, TripOption, VehicleType } from '@/lib/types';

interface PublishTripProps {
  onNavigate: (s: Screen) => void;
}

interface FormState {
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
  const [form, setForm] = useState<FormState>(initialForm);
  const [published, setPublished] = useState(false);

  function update(patch: Partial<FormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function toggleOption(opt: TripOption) {
    const next = form.options.includes(opt)
      ? form.options.filter((o) => o !== opt)
      : [...form.options, opt];
    update({ options: next });
  }

  const fromCity = CITIES.find((c) => c.id === form.fromId)!;
  const toCity = CITIES.find((c) => c.id === form.toId)!;

  const commission = Math.round(form.pricePerSeat * SBS_COMMISSION_RATE);
  const driverEarningPerSeat = form.pricePerSeat - commission;
  const driverTotalEarning = driverEarningPerSeat * form.seats;

  const valid =
    form.fromId !== form.toId &&
    form.date.length === 10 &&
    /^\d{2}:\d{2}$/.test(form.time) &&
    form.pickupPoint.trim().length >= 5 &&
    form.dropoffPoint.trim().length >= 5 &&
    form.seats >= 1 && form.seats <= 4 &&
    form.pricePerSeat >= 1000 && form.pricePerSeat <= 20000;

  if (published) return <PublishSuccess form={form} fromCity={fromCity} toCity={toCity} onNavigate={onNavigate} />;

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

        {/* Places & prix */}
        <Section title="👥 Places & prix par passager">
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
                  onClick={() => update({ seats: Math.min(4, form.seats + 1) })}
                  className="grid h-11 w-11 place-items-center text-sbs-dark transition-colors hover:bg-sbs-border-soft"
                >+</button>
              </div>
              <p className="mt-1 text-[11px] text-sbs-muted">1 à 4 passagers</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-sbs-dark">Prix par place (F CFA)</label>
              <div className="mt-1.5 flex items-center rounded-btn border border-sbs-border bg-white">
                <span className="grid h-11 w-11 place-items-center text-sbs-muted">
                  <Coins className="h-4 w-4" />
                </span>
                <input
                  type="number"
                  min={1000}
                  max={20000}
                  step={500}
                  value={form.pricePerSeat}
                  onChange={(e) => update({ pricePerSeat: Number(e.target.value) || 0 })}
                  className="h-11 flex-1 bg-transparent text-sm font-bold text-sbs-dark focus:outline-none"
                />
                <span className="pr-3 text-[11px] font-semibold text-sbs-muted">F CFA</span>
              </div>
              <p className="mt-1 text-[11px] text-sbs-muted">entre 1 000 et 20 000 F CFA</p>
            </div>
          </div>
        </Section>

        {/* Véhicule */}
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
                  type="number"
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  step={1}
                  value={form.vehicleYear}
                  onChange={(e) => update({ vehicleYear: Number(e.target.value) || new Date().getFullYear() })}
                  className="h-11 flex-1 bg-transparent text-sm font-bold text-sbs-dark focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Aperçu LIVE de la catégorie selon ce que le chauffeur déclare */}
          <div className="mt-4 rounded-card border border-sbs-blue/15 bg-sbs-blue-light/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] text-sbs-blue">
                <div className="font-semibold">Avec ces infos, votre trajet sera classé :</div>
                <div className="mt-0.5 text-[10px] text-sbs-muted">
                  Catégorie calculée automatiquement selon le type, l'année et les options
                </div>
              </div>
              <CategoryBadge
                category={computeTripCategory(form.vehicleType, form.vehicleYear, form.options)}
                size="lg"
              />
            </div>
          </div>
        </Section>

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
        </Section>

        {/* Récap gains */}
        <Section title="💰 Estimation de vos gains">
          <div className="rounded-card-lg border-2 border-sbs-yellow/30 bg-sbs-yellow-light/40 p-5">
            <dl className="space-y-2 text-sm">
              <Row label={`Prix par passager`} value={formatXAF(form.pricePerSeat)} />
              <Row label={`Nombre de places`} value={`× ${form.seats}`} subtle />
              <Row label="Sous-total" value={formatXAF(form.pricePerSeat * form.seats)} subtle />
              <Row label={`Commission SideBySide (${(SBS_COMMISSION_RATE * 100).toFixed(0)} %)`} value={`− ${formatXAF(commission * form.seats)}`} subtle />
              <div className="border-t border-sbs-yellow/40 pt-2" />
              <Row label="Vos gains nets" value={formatXAF(driverTotalEarning)} highlight />
            </dl>
            <p className="mt-3 text-center text-[11px] font-semibold text-sbs-yellow-dark">
              Versés en Mobile Money 24h après le trajet
            </p>
          </div>
        </Section>
      </main>

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
            onClick={() => setPublished(true)}
            disabled={!valid}
            className="rounded-pill min-w-[200px]"
          >
            <Car className="h-4 w-4" />
            Publier le trajet
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function PublishSuccess({ form, fromCity, toCity, onNavigate }: {
  form: FormState;
  fromCity: { name: string };
  toCity: { name: string };
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
        <h2 className="font-display text-2xl font-extrabold text-sbs-dark">Trajet publié ! 🎉</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-sbs-muted">
          Votre trajet <strong className="text-sbs-dark">{fromCity.name} → {toCity.name}</strong> le {form.date} à {form.time} est désormais visible des passagers.
        </p>

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
