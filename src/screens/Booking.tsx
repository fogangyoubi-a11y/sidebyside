import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, ShieldCheck, Lock, CheckCircle2, MapPin,
  Clock, User, Loader2, Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { TrustBadge } from '@/components/security/TrustBadge';
import { PhoneInput } from '@/components/security/PhoneInput';
import { findTrip } from '@/data/trips';
import {
  computePrice, generateBookingRef, PAYMENT_METHODS, getPaymentInfo,
} from '@/lib/booking';
import { cn, formatDate, formatTime, formatXAF } from '@/lib/utils';
import { validatePhoneCM } from '@/lib/security';
import type { Screen, PaymentMethod } from '@/lib/types';

interface BookingProps {
  tripId: string;
  seats: number;
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}

type Step = 'recap' | 'method' | 'pay' | 'success';

export function Booking({ tripId, seats, onNavigate }: BookingProps) {
  const trip = findTrip(tripId);
  const [step, setStep] = useState<Step>('recap');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  const [bookingRef] = useState(() => generateBookingRef());

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

  const price = computePrice(trip, seats);
  const departure = new Date(trip.departureAt);

  function handlePay() {
    setProcessing(true);
    // Simulation : 2.5s puis succès
    setTimeout(() => {
      setProcessing(false);
      setStep('success');
    }, 2500);
  }

  return (
    <div className="min-h-screen bg-sbs-cream pb-20">
      <header className="sticky top-0 z-30 border-b border-sbs-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => {
              if (step === 'recap') onNavigate('trip-detail', { tripId });
              else if (step === 'method') setStep('recap');
              else if (step === 'pay') setStep('method');
              else onNavigate('search');
            }}
            className="grid h-10 w-10 place-items-center rounded-pill border border-sbs-border text-sbs-dark transition-colors hover:bg-sbs-border-soft"
            aria-label="Retour"
            disabled={step === 'success'}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <SbsLogo size="sm" />
            <div className="leading-tight">
              <div className="font-display text-base font-extrabold tracking-tight">
                {step === 'recap'   && 'Récapitulatif'}
                {step === 'method'  && 'Mode de paiement'}
                {step === 'pay'     && 'Paiement'}
                {step === 'success' && 'Confirmé !'}
              </div>
              <div className="text-[10px] text-sbs-muted">{bookingRef}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Stepper */}
        {step !== 'success' && (
          <ol className="mb-5 flex items-center justify-center gap-1">
            {(['recap', 'method', 'pay'] as Step[]).map((s, i) => {
              const idx = (['recap', 'method', 'pay'] as Step[]).indexOf(step);
              const done = i < idx;
              const current = i === idx;
              return (
                <li key={s} className="flex items-center gap-1">
                  <span className={cn(
                    'grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold transition-all',
                    done && 'bg-sbs-green text-white',
                    current && 'bg-sbs-blue text-white shadow-soft scale-110',
                    !done && !current && 'bg-white text-sbs-muted border border-sbs-border',
                  )}>
                    {done ? '✓' : i + 1}
                  </span>
                  {i < 2 && <span className={cn('h-px w-6', done ? 'bg-sbs-green' : 'bg-sbs-border')} />}
                </li>
              );
            })}
          </ol>
        )}

        {/* CONTENU PAR ÉTAPE */}

        {step === 'recap' && (
          <div className="space-y-4">
            <TripCardCompact trip={trip} departure={departure} seats={seats} />

            <section className="rounded-card-lg border border-sbs-border bg-white p-5 shadow-card">
              <h2 className="mb-3 font-display text-base font-extrabold text-sbs-dark">Détail du prix</h2>
              <dl className="space-y-2 text-sm">
                <Line label={`Trajet × ${seats} place${seats > 1 ? 's' : ''}`} value={formatXAF(price.basePrice)} />
                <Line label="Frais de service SideBySide" value={formatXAF(price.serviceFee)} subtle />
                <div className="mt-2 border-t border-sbs-border pt-2" />
                <Line label="Total à payer" value={formatXAF(price.total)} highlight />
              </dl>
              <p className="mt-3 rounded-card border border-sbs-blue/15 bg-sbs-blue-light/30 p-3 text-[11px] leading-relaxed text-sbs-blue">
                💡 Sur les {formatXAF(price.basePrice)} du trajet, <strong>{formatXAF(price.driverEarning)}</strong>
                {' '}reviennent au chauffeur. Le reste finance la plateforme (vérification d'identité, support, etc.).
              </p>
            </section>

            <Button variant="primary" size="lg" onClick={() => setStep('method')} className="w-full rounded-pill">
              Choisir mon mode de paiement
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 'method' && (
          <div className="space-y-3">
            <p className="text-center text-sm text-sbs-muted">
              Choisissez comment payer vos <strong className="text-sbs-dark">{formatXAF(price.total)}</strong>
            </p>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => m.available && setPaymentMethod(m.id)}
                  disabled={!m.available}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-card-lg border-2 p-4 text-left transition-all',
                    !m.available && 'cursor-not-allowed opacity-50',
                    paymentMethod === m.id
                      ? 'border-sbs-blue bg-sbs-blue-light shadow-card scale-[1.01]'
                      : 'border-sbs-border bg-white hover:border-sbs-blue/30 hover:shadow-soft',
                  )}
                >
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-card-lg text-2xl"
                    style={{ background: m.brandColor, color: m.textColor }}
                    aria-hidden
                  >
                    {m.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-sm font-extrabold text-sbs-dark">{m.label}</div>
                    <div className="text-xs text-sbs-muted">{m.description}</div>
                  </div>
                  {!m.available && <Badge tone="muted">Bientôt</Badge>}
                  {paymentMethod === m.id && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-sbs-blue" />
                  )}
                </button>
              ))}
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setStep('pay')}
              disabled={!paymentMethod}
              className="w-full rounded-pill"
            >
              Continuer
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 'pay' && paymentMethod && (
          <div className="space-y-4">
            <PaymentForm
              method={paymentMethod}
              phone={phone}
              onPhoneChange={setPhone}
              totalAmount={price.total}
              processing={processing}
              onPay={handlePay}
            />
          </div>
        )}

        {step === 'success' && (
          <SuccessScreen
            trip={trip}
            seats={seats}
            bookingRef={bookingRef}
            departure={departure}
            paymentMethod={paymentMethod}
            onNavigate={onNavigate}
          />
        )}
      </main>
    </div>
  );
}

/* ----------------------------- Sub-components ----------------------------- */

function TripCardCompact({ trip, departure, seats }: { trip: ReturnType<typeof findTrip> extends infer T ? Exclude<T, undefined> : never; departure: Date; seats: number }) {
  return (
    <section className="rounded-card-lg border border-sbs-border bg-white p-5 shadow-card">
      <div className="flex items-start gap-4">
        <Avatar name={trip.driver.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-sm font-extrabold text-sbs-dark">{trip.driver.name}</span>
            {trip.driver.trustLevel && <TrustBadge level={trip.driver.trustLevel} size="sm" />}
          </div>
          <div className="text-[11px] text-sbs-muted">{trip.driver.car.model} · {trip.driver.car.color}</div>
        </div>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-sbs-blue ring-4 ring-sbs-blue/15" />
          <span className="h-10 w-0.5 border-l-2 border-dashed border-sbs-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-sbs-yellow ring-4 ring-sbs-yellow/20" />
        </div>
        <div className="flex-1 text-xs">
          <div className="font-display text-base font-extrabold text-sbs-dark">
            {formatTime(departure)} · {trip.from.name}
          </div>
          <div className="text-sbs-muted">{trip.pickupPoint}</div>
          <div className="mt-2 mb-1 flex items-center gap-1 text-[11px] text-sbs-muted">
            <Clock className="h-3 w-3" /> {formatDate(departure)}
          </div>
          <div className="font-display text-base font-extrabold text-sbs-dark">
            {trip.to.name}
          </div>
          <div className="text-sbs-muted">{trip.dropoffPoint}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-sbs-border-soft pt-3 text-xs">
        <span className="flex items-center gap-1.5 text-sbs-muted">
          <User className="h-3.5 w-3.5" />
          {seats} place{seats > 1 ? 's' : ''} réservée{seats > 1 ? 's' : ''}
        </span>
        <Badge tone="green">Place garantie</Badge>
      </div>
    </section>
  );
}

function Line({ label, value, highlight, subtle }: { label: string; value: string; highlight?: boolean; subtle?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className={cn('text-sm', subtle ? 'text-sbs-muted' : 'text-sbs-dark')}>{label}</dt>
      <dd className={cn(
        'font-display font-extrabold',
        highlight ? 'text-xl text-sbs-blue' : subtle ? 'text-sm text-sbs-muted' : 'text-base text-sbs-dark',
      )}>
        {value}
      </dd>
    </div>
  );
}

function PaymentForm({
  method, phone, onPhoneChange, totalAmount, processing, onPay,
}: {
  method: PaymentMethod;
  phone: string;
  onPhoneChange: (v: string) => void;
  totalAmount: number;
  processing: boolean;
  onPay: () => void;
}) {
  const info = getPaymentInfo(method);
  const phoneValid = (method === 'mtn' || method === 'orange') ? validatePhoneCM(phone).valid : true;
  const canPay = phoneValid;

  return (
    <>
      <div
        className="rounded-card-lg p-5 shadow-card"
        style={{ background: info.brandColor, color: info.textColor }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
              Paiement par
            </div>
            <div className="font-display text-xl font-extrabold">{info.label}</div>
          </div>
          <span className="text-4xl" aria-hidden>{info.emoji}</span>
        </div>
        <div className="mt-4 text-3xl font-extrabold tracking-tight">{formatXAF(totalAmount)}</div>
        <div className="text-[11px] opacity-80">à débiter en une fois</div>
      </div>

      {(method === 'mtn' || method === 'orange') && (
        <section className="rounded-card-lg border border-sbs-border bg-white p-5 shadow-card">
          <h3 className="mb-3 font-display text-sm font-extrabold text-sbs-dark">
            Numéro {info.shortLabel} à débiter
          </h3>
          <PhoneInput
            value={phone}
            onChange={onPhoneChange}
            label="Votre numéro"
            hint={`Vous recevrez une notification ${info.shortLabel} pour valider`}
          />
        </section>
      )}

      {method === 'card' && (
        <section className="rounded-card-lg border border-sbs-border bg-white p-5 shadow-card">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-sbs-dark">Numéro de carte</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="mt-1.5 h-11 w-full rounded-btn border border-sbs-border bg-white px-3.5 font-mono text-sm focus:border-sbs-blue focus:outline-none focus:ring-2 focus:ring-sbs-blue/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-sbs-dark">Expiration</label>
                <input type="text" placeholder="MM / AA" className="mt-1.5 h-11 w-full rounded-btn border border-sbs-border bg-white px-3.5 font-mono text-sm focus:border-sbs-blue focus:outline-none focus:ring-2 focus:ring-sbs-blue/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-sbs-dark">CVV</label>
                <input type="text" placeholder="123" maxLength={4} className="mt-1.5 h-11 w-full rounded-btn border border-sbs-border bg-white px-3.5 font-mono text-sm focus:border-sbs-blue focus:outline-none focus:ring-2 focus:ring-sbs-blue/20" />
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="rounded-card border border-sbs-green/20 bg-sbs-green/5 p-3 text-[11px] leading-relaxed text-sbs-green">
        <p className="flex items-start gap-2">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Transaction chiffrée. SideBySide n'enregistre jamais votre code MoMo / Orange / carte.
        </p>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onPay}
        disabled={!canPay || processing}
        className="w-full rounded-pill"
      >
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Traitement en cours…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Payer {formatXAF(totalAmount)}
          </>
        )}
      </Button>
    </>
  );
}

function SuccessScreen({ trip, seats, bookingRef, departure, paymentMethod, onNavigate }: {
  trip: ReturnType<typeof findTrip> extends infer T ? Exclude<T, undefined> : never;
  seats: number;
  bookingRef: string;
  departure: Date;
  paymentMethod: PaymentMethod | null;
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-sbs-green to-emerald-400 text-white shadow-card">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-extrabold text-sbs-dark">Réservation confirmée !</h2>
        <p className="mt-1 text-sm text-sbs-muted">
          {paymentMethod && `Paiement par ${getPaymentInfo(paymentMethod).shortLabel} validé`}
        </p>
      </div>

      {/* Billet numérique */}
      <article className="mx-auto max-w-md overflow-hidden rounded-card-lg border-2 border-sbs-blue/20 bg-white text-left shadow-card">
        <div className="bg-sbs-blue px-5 py-3 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                Référence
              </div>
              <div className="font-mono text-lg font-bold">{bookingRef}</div>
            </div>
            <SbsLogo size="md" />
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-muted">Trajet</div>
            <div className="font-display text-base font-extrabold text-sbs-dark">
              {trip.from.name} → {trip.to.name}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-y border-dashed border-sbs-border py-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-muted">Date</div>
              <div className="text-sm font-bold text-sbs-dark">{formatDate(departure)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-muted">Départ</div>
              <div className="text-sm font-bold text-sbs-dark">{formatTime(departure)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-muted">Places</div>
              <div className="text-sm font-bold text-sbs-dark">{seats}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-muted">Chauffeur</div>
              <div className="text-sm font-bold text-sbs-dark">{trip.driver.name.split(' ')[0]}</div>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sbs-blue" />
            <div>
              <div className="font-bold text-sbs-dark">RDV départ</div>
              <div className="text-sbs-muted">{trip.pickupPoint}</div>
            </div>
          </div>
        </div>
      </article>

      <div className="mx-auto max-w-md rounded-card border border-sbs-blue/15 bg-sbs-blue-light/30 p-3 text-[11px] leading-relaxed text-sbs-blue">
        <ShieldCheck className="mb-1 inline h-3.5 w-3.5" />
        <strong>{trip.driver.name}</strong> a été notifié(e). Vous pouvez maintenant échanger
        avec elle/lui via la messagerie sécurisée.
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button variant="primary" size="lg" onClick={() => onNavigate('messages')} className="rounded-pill">
          <Phone className="h-4 w-4" />
          Contacter le chauffeur
        </Button>
        <Button variant="ghost" size="lg" onClick={() => onNavigate('landing')}>
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
}
