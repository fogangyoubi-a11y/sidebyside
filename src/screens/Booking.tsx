import { useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ShieldCheck, Lock, CheckCircle2, MapPin,
  Clock, User, Loader2, Phone, Gift, Users as UsersIcon, Baby, Plus, Trash2, AlertTriangle, IdCard, CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { Input } from '@/components/ui/Input';
import { PayPalLogo } from '@/components/ui/PayPalLogo';
import { TrustBadge } from '@/components/security/TrustBadge';
import { PhoneInput } from '@/components/security/PhoneInput';
import { DocumentUpload } from '@/components/security/DocumentUpload';
import { findTrip } from '@/data/trips';
import {
  computePrice, computeFamilyPrice, getChildTier, generateBookingRef,
  getOrderedPaymentMethods, getPaymentInfo,
} from '@/lib/booking';
import { DIGITAL_PAYMENT_DISCOUNT_XAF, isDigitalPayment } from '@/lib/commissionTiers';
import { cn, formatDate, formatTime, formatXAF } from '@/lib/utils';
import { formatDualCFAEUR, formatEUR, cfaToEur } from '@/lib/currency';
import { isDiasporaFlow, clearDiasporaFlow } from '@/lib/diasporaFlow';
import { validatePhoneCM } from '@/lib/security';
import { ApiClient, ApiError } from '@/lib/api';
import { adaptApiTrip } from '@/lib/tripAdapter';
import type { Screen, PaymentMethod, BookingMode, Beneficiary, Child, ChildRelation, Trip } from '@/lib/types';

interface BookingProps {
  tripId: string;
  seats: number;
  /** Mode pré-sélectionné — utile pour le deep-link depuis /diaspora qui passe `?mode=gift`. */
  initialMode?: BookingMode;
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}

type Step = 'who' | 'recap' | 'method' | 'pay' | 'success';

/** Étend PaymentMethod avec 'cash' sans modifier types.ts */
type ExtendedPaymentMethod = PaymentMethod | 'cash';

const CASH_PAYMENT_INFO = {
  id: 'cash' as const,
  label: 'Espèces (Cash)',
  shortLabel: 'Cash',
  description: 'Paiement direct au chauffeur à l\'arrivée · Aucun frais',
  brandColor: '#16A34A',
  textColor: '#FFFFFF',
  emoji: '💵',
  available: true,
};

function getExtendedPaymentInfo(id: ExtendedPaymentMethod) {
  if (id === 'cash') return CASH_PAYMENT_INFO;
  return getPaymentInfo(id);
}

const RELATIONS: { id: ChildRelation; label: string }[] = [
  { id: 'fils', label: 'Mon fils' },
  { id: 'fille', label: 'Ma fille' },
  { id: 'neveu', label: 'Mon neveu' },
  { id: 'niece', label: 'Ma nièce' },
  { id: 'petit-fils', label: 'Mon petit-fils' },
  { id: 'petite-fille', label: 'Ma petite-fille' },
  { id: 'frere', label: 'Mon frère' },
  { id: 'soeur', label: 'Ma sœur' },
  { id: 'autre', label: 'Autre' },
];

export function Booking({ tripId, seats, initialMode, onNavigate }: BookingProps) {
  const mockTrip = findTrip(tripId);
  const [liveTrip, setLiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState<boolean>(!mockTrip);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>('who');
  // initialMode permet de pre-selectionner le bon onglet 'who' depuis un deep-link
  // (ex. /booking/t1?mode=gift depuis la landing /diaspora ou une pub Facebook).
  // En l'absence d'initialMode, on regarde le flag sessionStorage pose par la
  // landing /diaspora quand l'utilisateur a cliqué "Offrir un trajet" puis
  // a traverse Search et TripDetail.
  const [bookingMode, setBookingMode] = useState<BookingMode>(() => {
    if (initialMode) return initialMode;
    if (isDiasporaFlow()) return 'gift';
    return 'self';
  });

  // Bénéficiaire (mode "gift")
  const [beneficiary, setBeneficiary] = useState<Beneficiary>({
    firstName: '', lastName: '', phone: '', cniFile: null,
  });

  // Famille (mode "family")
  const [children, setChildren] = useState<Child[]>([]);
  const [parentAboard, setParentAboard] = useState<boolean>(false);

  const [paymentMethod, setPaymentMethod] = useState<ExtendedPaymentMethod | null>(null);
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  // Référence de réservation : utilisée comme valeur initiale pour la page de succès.
  // Sera remplacée par la vraie référence backend une fois le POST /bookings réussi.
  const [bookingRef, setBookingRef] = useState<string>(() => generateBookingRef());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [campayRef, setCampayRef] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'polling' | 'success' | 'failed'>('idle');

  // Fallback API si le trajet n'est pas dans les mocks (id = CUID Prisma).
  useEffect(() => {
    if (mockTrip) return;
    let cancelled = false;
    ApiClient.getTrip(tripId)
      .then(({ trip }) => { if (!cancelled) setLiveTrip(adaptApiTrip(trip)); })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : 'Trajet introuvable');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tripId, mockTrip]);

  // ── Polling paiement Campay ───────────────────────────────────
  // Placé avant les `return` conditionnels ci-dessous pour respecter les
  // Rules of Hooks (un hook ne doit jamais être appelé conditionnellement).
  useEffect(() => {
    if (!campayRef || pollingStatus !== 'polling') return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 40; // 40 × 3s = 2 minutes max

    const interval = setInterval(async () => {
      if (cancelled) return;
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        clearInterval(interval);
        setPollingStatus('failed');
        setPayError('Délai dépassé. Vérifiez votre téléphone et réessayez.');
        return;
      }

      try {
        const { status } = await ApiClient.getPaymentStatus(campayRef);
        if (cancelled) return;

        if (status === 'SUCCESSFUL') {
          clearInterval(interval);
          setPollingStatus('success');
          setStep('success');
          clearDiasporaFlow();
        } else if (status === 'FAILED') {
          clearInterval(interval);
          setPollingStatus('failed');
          setPayError('Paiement refusé ou annulé. Vérifiez votre solde et réessayez.');
        }
        // PENDING → continuer à poller
      } catch {
        // Erreur réseau passagère — on continue
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [campayRef, pollingStatus]);

  const trip = mockTrip ?? liveTrip;

  if (loading) {
    return (
      <div className="min-h-screen bg-sbs-cream p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-sbs-blue" />
        <p className="mt-3 text-sm text-sbs-muted">Chargement du trajet…</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-sbs-cream p-8 text-center">
        <p className="text-sbs-muted">{loadError ?? 'Trajet introuvable.'}</p>
        <Button variant="primary" size="md" onClick={() => onNavigate('search')} className="mt-4 rounded-pill">
          Retour à la recherche
        </Button>
      </div>
    );
  }

  // Calcul du prix selon le mode
  const price = bookingMode === 'family'
    ? computeFamilyPrice(trip, seats, children)
    : computePrice(trip, seats);

  // Remise -200 F CFA pour paiement digital (MTN / Orange)
  const digitalDiscount = paymentMethod && isDigitalPayment(paymentMethod) ? DIGITAL_PAYMENT_DISCOUNT_XAF : 0;
  const effectiveTotal = Math.max(0, price.total - digitalDiscount);

  const departure = new Date(trip.departureAt);

  /**
   * Tente de créer la réservation via POST /api/bookings (uniquement si le trajet
   * vient de la DB — id CUID). Pour les trajets mock, on simule comme avant.
   * Quand le paiement Mobile Money / carte sera branché, ce handler appellera
   * l'endpoint paiement après la création de booking.
   */
  async function handlePay() {
    setProcessing(true);
    setPayError(null);

    const isLive = !mockTrip; // trip vient de l'API

    // ── Trajets mock : comportement démo inchangé ──────────────
    if (!isLive) {
      setTimeout(() => {
        setProcessing(false);
        setStep('success');
        clearDiasporaFlow();
      }, 2500);
      return;
    }

    try {
      // 1. Créer la réservation (statut PENDING)
      const apiPaymentMethod = paymentMethod === 'cash' ? 'CASH' : 'MOBILE_MONEY';
      const { booking } = await ApiClient.createBooking({ tripId, seats, paymentMethod: apiPaymentMethod });
      setBookingRef(booking.reference);
      if (booking.conversationId) setConversationId(booking.conversationId);

      // 2a. Cash → aucun paiement électronique, succès immédiat
      if (paymentMethod === 'cash') {
        setStep('success');
        clearDiasporaFlow();
        return;
      }

      // 2b. MTN / Orange → initier paiement Campay
      if (paymentMethod === 'mtn' || paymentMethod === 'orange') {
        const operator = paymentMethod === 'mtn' ? 'MTN' : 'ORANGE';
        const result = await ApiClient.initiatePayment({
          bookingId: booking.id,
          phone,
          operator,
        });
        setCampayRef(result.campayRef);
        setPollingStatus('polling');
        // Le useEffect de polling prend le relais
        return;
      }

      // 2c. Autres méthodes (card, paypal, bancontact…) → succès démo pour l'instant
      setStep('success');
      clearDiasporaFlow();
    } catch (err) {
      if (err instanceof ApiError) {
        setPayError(err.message);
      } else {
        setPayError('Réservation impossible. Réessayez dans un instant.');
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-sbs-cream pb-20">
      <header className="sticky top-0 z-30 border-b border-sbs-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => {
              if (step === 'who') onNavigate('trip-detail', { tripId });
              else if (step === 'recap') setStep('who');
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
                {step === 'who'     && 'Pour qui réservez-vous ?'}
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
        {/* Stepper 4 étapes */}
        {step !== 'success' && (
          <ol className="mb-5 flex items-center justify-center gap-1">
            {(['who', 'recap', 'method', 'pay'] as Step[]).map((s, i) => {
              const idx = (['who', 'recap', 'method', 'pay'] as Step[]).indexOf(step);
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
                  {i < 3 && <span className={cn('h-px w-4', done ? 'bg-sbs-green' : 'bg-sbs-border')} />}
                </li>
              );
            })}
          </ol>
        )}

        {step === 'who' && (
          <WhoStep
            bookingMode={bookingMode}
            onSelectMode={(m) => {
              setBookingMode(m);
              // L'utilisateur a explicitement change de mode → on quitte le flow diaspora
              if (m !== 'gift') clearDiasporaFlow();
            }}
            beneficiary={beneficiary}
            onBeneficiary={setBeneficiary}
            children={children}
            onChildren={setChildren}
            parentAboard={parentAboard}
            onParentAboard={setParentAboard}
            onNext={() => setStep('recap')}
          />
        )}

        {step === 'recap' && (
          <RecapStep
            trip={trip}
            departure={departure}
            seats={seats}
            bookingMode={bookingMode}
            beneficiary={beneficiary}
            children={children}
            price={price}
            onNext={() => setStep('method')}
          />
        )}

        {step === 'method' && (
          <MethodStep
            total={price.total}
            paymentMethod={paymentMethod}
            bookingMode={bookingMode}
            onSelect={setPaymentMethod}
            onNext={() => setStep('pay')}
          />
        )}

        {step === 'pay' && paymentMethod && (
          <>
            {/* Écran de polling Mobile Money */}
            {pollingStatus === 'polling' && (
              <div className="flex flex-col items-center gap-5 py-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-sbs-blue" />
                <div>
                  <p className="font-display text-base font-bold text-sbs-dark">
                    En attente de confirmation…
                  </p>
                  <p className="mt-1 text-sm text-sbs-muted">
                    Validez le paiement sur votre téléphone
                  </p>
                </div>
                <div className="rounded-card border border-sbs-border bg-white p-4 text-sm text-sbs-muted w-full max-w-sm">
                  <p className="font-semibold text-sbs-dark mb-1">Comment valider ?</p>
                  <p>MTN : composez <strong>*126#</strong> ou approuvez la notification reçue sur votre téléphone.</p>
                  <p className="mt-1">Orange : composez <strong>#150#</strong> ou approuvez via l'app Orange Money.</p>
                </div>
              </div>
            )}

            {pollingStatus !== 'polling' && (
              <>
                {payError && (
                  <div role="alert" className="mb-4 rounded-card border border-sbs-red/30 bg-sbs-red/5 p-3 text-[12px] text-sbs-red">
                    <p className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {payError}
                    </p>
                  </div>
                )}

                <PaymentForm
                  method={paymentMethod}
                  bookingMode={bookingMode}
                  phone={phone}
                  onPhoneChange={setPhone}
                  totalAmount={effectiveTotal}
                  originalTotal={price.total}
                  digitalDiscount={digitalDiscount}
                  processing={processing}
                  onPay={handlePay}
                />
              </>
            )}
          </>
        )}

        {step === 'success' && (
          <SuccessScreen
            trip={trip}
            seats={seats}
            bookingRef={bookingRef}
            departure={departure}
            paymentMethod={paymentMethod}
            totalPaid={effectiveTotal}
            bookingMode={bookingMode}
            beneficiary={beneficiary}
            childrenCount={children.length}
            conversationId={conversationId}
            onNavigate={onNavigate}
          />
        )}
      </main>
    </div>
  );
}

/* ============================================================
   ÉTAPE 1 — Pour qui ?
   ============================================================ */

function WhoStep({
  bookingMode, onSelectMode, beneficiary, onBeneficiary,
  children, onChildren, parentAboard, onParentAboard, onNext,
}: {
  bookingMode: BookingMode;
  onSelectMode: (m: BookingMode) => void;
  beneficiary: Beneficiary;
  onBeneficiary: (b: Beneficiary) => void;
  children: Child[];
  onChildren: (c: Child[]) => void;
  parentAboard: boolean;
  onParentAboard: (v: boolean) => void;
  onNext: () => void;
}) {
  function canContinue(): boolean {
    if (bookingMode === 'self') return true;
    if (bookingMode === 'gift') {
      return (
        beneficiary.firstName.trim().length >= 2 &&
        beneficiary.lastName.trim().length >= 2 &&
        validatePhoneCM(beneficiary.phone).valid &&
        beneficiary.cniFile !== null
      );
    }
    // family
    if (children.length === 0) return false;
    if (!parentAboard) return false;
    return children.every((c) => c.firstName.trim().length >= 1 && c.age >= 0 && c.age <= 17);
  }

  function addChild() {
    onChildren([...children, { firstName: '', age: 5, relation: 'fils' }]);
  }
  function updateChild(i: number, patch: Partial<Child>) {
    onChildren(children.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  }
  function removeChild(i: number) {
    onChildren(children.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-sbs-muted">
        Choisissez qui voyage. Ces informations seront communiquées au chauffeur pour votre sécurité.
      </p>

      <ModeCard
        active={bookingMode === 'self'}
        onClick={() => onSelectMode('self')}
        icon={<User className="h-5 w-5" />}
        color="blue"
        title="C'est pour moi"
        desc="Je suis la personne qui voyage."
      />

      <ModeCard
        active={bookingMode === 'gift'}
        onClick={() => onSelectMode('gift')}
        icon={<Gift className="h-5 w-5" />}
        color="yellow"
        title="J'offre à un proche"
        desc="Je paie, mais c'est une autre personne qui voyage."
        badge="Diaspora"
      />

      <ModeCard
        active={bookingMode === 'family'}
        onClick={() => onSelectMode('family')}
        icon={<UsersIcon className="h-5 w-5" />}
        color="green"
        title="Je voyage avec ma famille"
        desc="Avec mon/mes enfant(s) ou un mineur dont je suis responsable."
      />

      {/* Formulaire bénéficiaire si mode gift */}
      {bookingMode === 'gift' && (
        <section className="mt-4 rounded-card-lg border-2 border-sbs-yellow/30 bg-sbs-yellow-light/30 p-4 sm:p-5">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold text-sbs-dark">
            <Gift className="h-4 w-4 text-sbs-yellow-dark" />
            Informations du voyageur
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Prénom du voyageur"
              placeholder="ex. Marie"
              value={beneficiary.firstName}
              onChange={(e) => onBeneficiary({ ...beneficiary, firstName: e.target.value })}
              leftIcon={<User className="h-4 w-4" />}
            />
            <Input
              label="Nom du voyageur"
              placeholder="ex. Tchoumi"
              value={beneficiary.lastName}
              onChange={(e) => onBeneficiary({ ...beneficiary, lastName: e.target.value })}
              leftIcon={<User className="h-4 w-4" />}
            />
          </div>
          <div className="mt-3">
            <PhoneInput
              label="Numéro de téléphone du voyageur"
              value={beneficiary.phone}
              onChange={(p) => onBeneficiary({ ...beneficiary, phone: p })}
              hint="Pour recevoir le billet par SMS et activer le SOS"
            />
          </div>
          <div className="mt-3">
            <label className="mb-1.5 block text-xs font-semibold text-sbs-dark">
              CNI du voyageur (obligatoire)
            </label>
            <DocumentUpload
              label="CNI du voyageur"
              hint="Recto avec photo — bien lisible"
              value={beneficiary.cniFile}
              onChange={(f) => onBeneficiary({ ...beneficiary, cniFile: f })}
              icon={<IdCard className="h-6 w-6" />}
            />
          </div>
          <p className="mt-3 flex items-start gap-2 rounded-card bg-white px-3 py-2 text-[11px] text-sbs-muted">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sbs-green" />
            Le voyageur recevra le billet par SMS. Il devra présenter sa CNI au chauffeur au moment du départ.
          </p>
        </section>
      )}

      {/* Formulaire famille si mode family */}
      {bookingMode === 'family' && (
        <section className="mt-4 rounded-card-lg border-2 border-sbs-green/30 bg-sbs-green/5 p-4 sm:p-5">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-extrabold text-sbs-dark">
            <UsersIcon className="h-4 w-4 text-sbs-green" />
            Vos enfants à bord
          </h3>

          {children.length === 0 && (
            <p className="rounded-card border border-dashed border-sbs-green/30 bg-white px-4 py-6 text-center text-xs text-sbs-muted">
              Aucun enfant ajouté. Cliquez sur "Ajouter un enfant" ci-dessous.
            </p>
          )}

          <ul className="space-y-2">
            {children.map((c, i) => {
              const tier = getChildTier(c.age);
              return (
                <li key={i} className="rounded-card border border-sbs-border bg-white p-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      label={`Enfant ${i + 1} · Prénom`}
                      placeholder="ex. Jean"
                      value={c.firstName}
                      onChange={(e) => updateChild(i, { firstName: e.target.value })}
                    />
                    <div>
                      <label className="text-xs font-semibold text-sbs-dark">Âge</label>
                      <input
                        type="number"
                        min={0}
                        max={17}
                        value={c.age}
                        onChange={(e) => updateChild(i, { age: Math.max(0, Math.min(17, Number(e.target.value) || 0)) })}
                        className="mt-1.5 h-11 w-full rounded-btn border border-sbs-border bg-white px-3 text-sm font-bold text-sbs-dark focus:border-sbs-blue focus:outline-none focus:ring-2 focus:ring-sbs-blue/20"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-sbs-dark">Lien</label>
                      <select
                        value={c.relation}
                        onChange={(e) => updateChild(i, { relation: e.target.value as ChildRelation })}
                        className="mt-1.5 h-11 w-full appearance-none rounded-btn border border-sbs-border bg-white px-3 text-sm font-semibold text-sbs-dark focus:border-sbs-blue focus:outline-none focus:ring-2 focus:ring-sbs-blue/20"
                      >
                        {RELATIONS.map((r) => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-[10px] font-bold',
                      tier === 'free'  && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                      tier === 'half'  && 'border-sbs-blue/30 bg-sbs-blue-light text-sbs-blue',
                      tier === 'full'  && 'border-sbs-yellow/40 bg-sbs-yellow-light text-sbs-yellow-dark',
                    )}>
                      {tier === 'free' && '🎁 Gratuit (sur les genoux)'}
                      {tier === 'half' && '👦 Demi-tarif (4-11 ans)'}
                      {tier === 'full' && '🧑 Tarif plein (12+ ans)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChild(i)}
                      aria-label="Retirer cet enfant"
                      className="grid h-7 w-7 place-items-center rounded-full bg-sbs-border-soft text-sbs-muted transition-colors hover:bg-sbs-red hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={addChild}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-btn border-2 border-dashed border-sbs-green/40 bg-white px-3 py-2.5 text-xs font-bold text-sbs-green transition-colors hover:bg-sbs-green/5"
          >
            <Plus className="h-4 w-4" />
            Ajouter un enfant
          </button>

          {children.length > 0 && (
            <label className="mt-4 flex items-start gap-2 rounded-card border border-sbs-yellow/40 bg-sbs-yellow-light/30 p-3 text-[11px] cursor-pointer">
              <input
                type="checkbox"
                checked={parentAboard}
                onChange={(e) => onParentAboard(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-sbs-yellow"
              />
              <span className="text-sbs-dark">
                <strong>Je confirme</strong> être à bord avec ces enfants ou leur parent légal.
                Les enfants ne peuvent jamais voyager seuls sur SideBySide.
              </span>
            </label>
          )}

          <p className="mt-3 flex items-start gap-2 text-[10px] text-sbs-muted">
            <Baby className="mt-0.5 h-3 w-3 shrink-0" />
            Tarification : <strong>0-3 ans</strong> gratuit (sur les genoux), <strong>4-11 ans</strong> demi-tarif, <strong>12+ ans</strong> tarif plein.
          </p>
        </section>
      )}

      {bookingMode === 'family' && children.length === 0 && (
        <p className="text-center text-[11px] text-sbs-red">
          ⚠️ Ajoutez au moins un enfant pour continuer
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        onClick={onNext}
        disabled={!canContinue()}
        className="w-full rounded-pill"
      >
        Continuer
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ModeCard({ active, onClick, icon, color, title, desc, badge }: {
  active: boolean; onClick: () => void; icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green'; title: string; desc: string; badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-card-lg border-2 p-4 text-left transition-all',
        active
          ? color === 'blue'   ? 'border-sbs-blue   bg-sbs-blue-light shadow-card scale-[1.01]'
          : color === 'yellow' ? 'border-sbs-yellow bg-sbs-yellow-light shadow-card scale-[1.01]'
          : 'border-sbs-green bg-sbs-green/5 shadow-card scale-[1.01]'
          : 'border-sbs-border bg-white hover:border-sbs-blue/30 hover:shadow-soft',
      )}
    >
      <span className={cn(
        'grid h-11 w-11 shrink-0 place-items-center rounded-card-lg',
        color === 'blue'   && 'bg-sbs-blue text-white',
        color === 'yellow' && 'bg-sbs-yellow text-sbs-dark',
        color === 'green'  && 'bg-sbs-green text-white',
      )}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-extrabold text-sbs-dark">{title}</span>
          {badge && <Badge tone="yellow">{badge}</Badge>}
        </div>
        <p className="mt-0.5 text-xs text-sbs-muted">{desc}</p>
      </div>
      {active && <CheckCircle2 className="h-5 w-5 shrink-0 text-sbs-blue" />}
    </button>
  );
}

/* ============================================================
   ÉTAPE 2 — Récapitulatif
   ============================================================ */

function RecapStep({ trip, departure, seats, bookingMode, beneficiary, children, price, onNext }: {
  trip: NonNullable<ReturnType<typeof findTrip>>;
  departure: Date;
  seats: number;
  bookingMode: BookingMode;
  beneficiary: Beneficiary;
  children: Child[];
  price: ReturnType<typeof computePrice> | ReturnType<typeof computeFamilyPrice>;
  onNext: () => void;
}) {
  const isFamily = bookingMode === 'family';
  const isGift = bookingMode === 'gift';

  return (
    <div className="space-y-4">
      <TripCardCompact trip={trip} departure={departure} seats={seats} />

      {/* Qui voyage ? */}
      <section className="rounded-card-lg border border-sbs-border bg-white p-5 shadow-card">
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-extrabold text-sbs-dark">
          {bookingMode === 'self' && <><User className="h-4 w-4" /> Vous voyagez</>}
          {bookingMode === 'gift' && <><Gift className="h-4 w-4 text-sbs-yellow-dark" /> Vous offrez ce trajet</>}
          {bookingMode === 'family' && <><UsersIcon className="h-4 w-4 text-sbs-green" /> Vous + votre famille</>}
        </h2>

        {bookingMode === 'self' && (
          <p className="text-sm text-sbs-muted">{seats} place{seats > 1 ? 's' : ''} à votre nom.</p>
        )}

        {isGift && (
          <div className="rounded-card border border-sbs-yellow/30 bg-sbs-yellow-light/30 p-3">
            <div className="font-bold text-sbs-dark">{beneficiary.firstName} {beneficiary.lastName}</div>
            <div className="text-xs text-sbs-muted">{beneficiary.phone}</div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-sbs-yellow-dark">
              <ShieldCheck className="h-3 w-3" /> CNI fournie · billet envoyé par SMS
            </div>
          </div>
        )}

        {isFamily && (
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-sbs-dark">👤 Vous (1 adulte)</span>
              <span className="font-semibold text-sbs-dark">{formatXAF(trip.pricePerSeat)}</span>
            </li>
            {children.map((c, i) => {
              const tier = getChildTier(c.age);
              const childPrice = tier === 'free' ? 0 : tier === 'half' ? Math.round(trip.pricePerSeat * 0.5) : trip.pricePerSeat;
              return (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-sbs-dark">
                    {tier === 'free' ? '👶' : tier === 'half' ? '👦' : '🧑'} {c.firstName} ({c.age} ans, {c.relation})
                  </span>
                  <span className={cn('font-semibold', tier === 'free' && 'text-sbs-green')}>
                    {tier === 'free' ? 'Gratuit' : formatXAF(childPrice)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Détail prix */}
      <section className="rounded-card-lg border border-sbs-border bg-white p-5 shadow-card">
        <h2 className="mb-3 font-display text-base font-extrabold text-sbs-dark">Détail du prix</h2>
        <dl className="space-y-2 text-sm">
          <Line label="Sous-total" value={formatXAF(price.basePrice)} />
          <Line label="Frais de service SideBySide" value={formatXAF(price.serviceFee)} subtle />
          <div className="mt-2 border-t border-sbs-border pt-2" />
          <Line
            label="Total à payer"
            value={isGift ? formatDualCFAEUR(price.total) : formatXAF(price.total)}
            highlight
          />
        </dl>
        {isGift && (
          <p className="mt-3 flex items-start gap-2 rounded-card border border-sbs-blue/20 bg-sbs-blue-light/30 p-3 text-[12px] leading-relaxed text-sbs-blue">
            <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Tu seras débité·e en <strong>euros</strong> ({formatEUR(cfaToEur(price.total))}) via PayPal,
              Carte ou Bancontact. Taux fixe garanti — pas de frais de change.
            </span>
          </p>
        )}
      </section>

      <Button variant="primary" size="lg" onClick={onNext} className="w-full rounded-pill">
        Choisir mon mode de paiement
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ============================================================
   Sous-composants existants (Method, PaymentForm, Success, helpers)
   ============================================================ */

function MethodStep({ total, paymentMethod, bookingMode, onSelect, onNext }: {
  total: number;
  paymentMethod: ExtendedPaymentMethod | null;
  bookingMode: BookingMode;
  onSelect: (m: ExtendedPaymentMethod) => void;
  onNext: () => void;
}) {
  const methods = getOrderedPaymentMethods(bookingMode);
  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-sbs-muted">
        Choisissez comment payer vos{' '}
        <strong className="text-sbs-dark">
          {bookingMode === 'gift' ? formatDualCFAEUR(total) : formatXAF(total)}
        </strong>
      </p>

      {/* Bannière remise paiement digital */}
      {bookingMode !== 'gift' && (
        <div className="rounded-card border border-emerald-200 bg-emerald-50 p-3 text-[12px] leading-relaxed text-emerald-700">
          <p className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Payez par <strong>MTN MoMo</strong> ou <strong>Orange Money</strong> et
              bénéficiez d'une remise de{' '}
              <strong className="text-emerald-800">−{DIGITAL_PAYMENT_DISCOUNT_XAF.toLocaleString('fr-FR')} F CFA</strong>.
            </span>
          </p>
        </div>
      )}

      {bookingMode === 'gift' && (
        <div className="rounded-card border border-sbs-blue/20 bg-sbs-blue-light/40 p-3 text-[12px] leading-relaxed text-sbs-blue">
          <p className="flex items-start gap-2">
            <Gift className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Depuis l'étranger ? <strong>PayPal</strong> et <strong>Carte bancaire</strong> sont
              les méthodes les plus adaptées — protection acheteur incluse.
            </span>
          </p>
        </div>
      )}

      <div className="space-y-2">
        {/* Option Cash — toujours en premier pour les non-diaspora */}
        {bookingMode !== 'gift' && (
          <button
            type="button"
            onClick={() => onSelect('cash')}
            className={cn(
              'relative flex w-full items-center gap-3 rounded-card-lg border-2 p-4 text-left transition-all',
              paymentMethod === 'cash'
                ? 'border-sbs-green bg-emerald-50 shadow-card scale-[1.01]'
                : 'border-sbs-border bg-white hover:border-sbs-green/40 hover:shadow-soft',
            )}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-card-lg text-2xl"
              style={{ background: CASH_PAYMENT_INFO.brandColor, color: CASH_PAYMENT_INFO.textColor }}>
              {CASH_PAYMENT_INFO.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-display text-sm font-extrabold text-sbs-dark">{CASH_PAYMENT_INFO.label}</span>
              </div>
              <div className="text-xs text-sbs-muted">{CASH_PAYMENT_INFO.description}</div>
            </div>
            {paymentMethod === 'cash' && <CheckCircle2 className="h-5 w-5 shrink-0 text-sbs-green" />}
          </button>
        )}

        {methods.map((m) => {
          const isPayPal = m.id === 'paypal';
          const recommended = bookingMode === 'gift' && (m.id === 'paypal' || m.id === 'card');
          const hasDiscount = bookingMode !== 'gift' && isDigitalPayment(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => m.available && onSelect(m.id)}
              disabled={!m.available}
              className={cn(
                'relative flex w-full items-center gap-3 rounded-card-lg border-2 p-4 text-left transition-all',
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
                {isPayPal ? <PayPalLogo size={18} /> : m.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-display text-sm font-extrabold text-sbs-dark">{m.label}</span>
                  {recommended && <Badge tone="blue" className="text-[10px]">Recommandé</Badge>}
                  {hasDiscount && (
                    <span className="rounded-pill border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      −{DIGITAL_PAYMENT_DISCOUNT_XAF} F
                    </span>
                  )}
                </div>
                <div className="text-xs text-sbs-muted">{m.description}</div>
              </div>
              {!m.available && <Badge tone="muted">Bientôt</Badge>}
              {paymentMethod === m.id && <CheckCircle2 className="h-5 w-5 shrink-0 text-sbs-blue" />}
            </button>
          );
        })}
      </div>
      <Button variant="primary" size="lg" onClick={onNext} disabled={!paymentMethod} className="w-full rounded-pill">
        Continuer
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function TripCardCompact({ trip, departure, seats }: { trip: NonNullable<ReturnType<typeof findTrip>>; departure: Date; seats: number }) {
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
          <div className="font-display text-base font-extrabold text-sbs-dark">{trip.to.name}</div>
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
      <dd className={cn('font-display font-extrabold', highlight ? 'text-xl text-sbs-blue' : subtle ? 'text-sm text-sbs-muted' : 'text-base text-sbs-dark')}>
        {value}
      </dd>
    </div>
  );
}

function PaymentForm({ method, bookingMode, phone, onPhoneChange, totalAmount, originalTotal, digitalDiscount, processing, onPay }: {
  method: ExtendedPaymentMethod;
  bookingMode: BookingMode;
  phone: string;
  onPhoneChange: (v: string) => void;
  totalAmount: number;
  originalTotal: number;
  digitalDiscount: number;
  processing: boolean;
  onPay: () => void;
}) {
  const info = getExtendedPaymentInfo(method);
  const isCash = method === 'cash';
  const phoneValid = (method === 'mtn' || method === 'orange') ? validatePhoneCM(phone).valid : true;
  const canPay = phoneValid;
  const isPayPal = method === 'paypal';
  // En mode diaspora (gift) + PayPal/Carte/Bancontact, on facture en EUR.
  // Pour MTN/Orange on reste en F CFA (paiement local).
  const useEurAsPrimary = bookingMode === 'gift' && (method === 'paypal' || method === 'card');
  const totalEur = cfaToEur(totalAmount);

  return (
    <>
      <div className="rounded-card-lg p-5 shadow-card" style={{ background: info.brandColor, color: info.textColor }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Paiement par</div>
            <div className="font-display text-xl font-extrabold">{info.label}</div>
          </div>
          {isPayPal
            ? <PayPalLogo size={28} className="opacity-95" />
            : <span className="text-4xl" aria-hidden>{info.emoji}</span>}
        </div>
        {useEurAsPrimary ? (
          <>
            <div className="mt-4 text-3xl font-extrabold tracking-tight">{formatEUR(totalEur)}</div>
            <div className="text-[11px] opacity-80">
              ≈ {formatXAF(totalAmount)} · taux fixe garanti
            </div>
          </>
        ) : (
          <>
            {digitalDiscount > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg line-through opacity-60">{formatXAF(originalTotal)}</span>
                <span className="rounded-pill bg-white/20 px-2 py-0.5 text-[11px] font-bold">
                  −{digitalDiscount} F
                </span>
              </div>
            )}
            <div className="mt-1 text-3xl font-extrabold tracking-tight">{formatXAF(totalAmount)}</div>
            <div className="text-[11px] opacity-80">
              {isCash ? 'à remettre au chauffeur à l\'arrivée' : 'à débiter en une fois'}
            </div>
          </>
        )}
      </div>

      {/* Instruction Cash */}
      {isCash && (
        <section className="rounded-card-lg border-2 border-emerald-200 bg-emerald-50 p-5 shadow-card">
          <h3 className="mb-2 font-display text-sm font-extrabold text-emerald-800">Instructions paiement Cash</h3>
          <ul className="space-y-1.5 text-[12px] text-emerald-700">
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Préparez l'appoint exact : <strong>{formatXAF(totalAmount)}</strong></li>
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Remettez la somme au chauffeur <strong>à destination</strong>, après le trajet</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Demandez un reçu oral ou par SMS pour confirmation</li>
          </ul>
        </section>
      )}

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
              <input type="text" placeholder="1234 5678 9012 3456"
                className="mt-1.5 h-11 w-full rounded-btn border border-sbs-border bg-white px-3.5 font-mono text-sm focus:border-sbs-blue focus:outline-none focus:ring-2 focus:ring-sbs-blue/20" />
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

      {isPayPal && (
        <section className="rounded-card-lg border border-sbs-border bg-white p-5 shadow-card">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#003087]/10">
              <PayPalLogo size={16} />
            </div>
            <div>
              <h3 className="font-display text-sm font-extrabold text-sbs-dark">
                Connexion sécurisée PayPal
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-sbs-muted">
                En cliquant sur <strong>Payer avec PayPal</strong>, vous serez redirigé vers la
                page sécurisée PayPal pour vous identifier (email + mot de passe ou Touch ID).
                Aucune information bancaire n'est partagée avec SideBySide.
              </p>
              <ul className="mt-3 space-y-1.5 text-[11px] text-sbs-muted">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-sbs-green" />
                  Protection acheteur incluse
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-sbs-green" />
                  Remboursement en cas de trajet annulé
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-sbs-green" />
                  Conversion EUR / XAF automatique
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      <div className="rounded-card border border-sbs-green/20 bg-sbs-green/5 p-3 text-[11px] leading-relaxed text-sbs-green">
        <p className="flex items-start gap-2">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Transaction chiffrée. SideBySide n'enregistre jamais vos identifiants MoMo, Orange, carte ou PayPal.
        </p>
      </div>

      <Button variant="primary" size="lg" onClick={onPay} disabled={!canPay || processing} className="w-full rounded-pill">
        {processing ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Traitement en cours…</>
        ) : isCash ? (
          <><CheckCircle2 className="h-4 w-4" /> Confirmer la réservation (Cash)</>
        ) : isPayPal ? (
          <><PayPalLogo size={16} /> Payer avec PayPal {useEurAsPrimary ? formatEUR(totalEur) : formatXAF(totalAmount)}</>
        ) : (
          <><Lock className="h-4 w-4" /> Payer {useEurAsPrimary ? formatEUR(totalEur) : formatXAF(totalAmount)}</>
        )}
      </Button>
    </>
  );
}

function SuccessScreen({ trip, seats, bookingRef, departure, paymentMethod, totalPaid, bookingMode, beneficiary, childrenCount, conversationId, onNavigate }: {
  trip: NonNullable<ReturnType<typeof findTrip>>;
  seats: number;
  bookingRef: string;
  departure: Date;
  paymentMethod: ExtendedPaymentMethod | null;
  totalPaid: number;
  bookingMode: BookingMode;
  beneficiary: Beneficiary;
  childrenCount: number;
  conversationId: string | null;
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}) {
  const isCash = paymentMethod === 'cash';
  return (
    <div className="space-y-4 text-center">
      <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full text-white shadow-card ${isCash ? 'bg-gradient-to-br from-amber-400 to-orange-400' : 'bg-gradient-to-br from-sbs-green to-emerald-400'}`}>
        {isCash ? <Clock className="h-10 w-10" /> : <CheckCircle2 className="h-10 w-10" />}
      </div>
      <div>
        <h2 className="font-display text-2xl font-extrabold text-sbs-dark">
          {isCash ? 'Demande envoyée !' : 'Réservation confirmée !'}
        </h2>
        <p className="mt-1 text-sm text-sbs-muted">
          {paymentMethod && (isCash
            ? 'En attente de confirmation du chauffeur'
            : `Paiement par ${getExtendedPaymentInfo(paymentMethod).shortLabel} validé`)}
        </p>
        {isCash && (
          <p className="mt-2 rounded-card border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            ⏳ Le chauffeur va accepter ou refuser votre demande. Vous serez notifié dans la messagerie.
          </p>
        )}
      </div>
        {bookingMode === 'gift' && (
          <p className="mt-2 text-sm font-semibold text-sbs-yellow-dark">
            🎁 SMS envoyé à {beneficiary.firstName} {beneficiary.lastName}
          </p>
        )}
        {bookingMode === 'family' && childrenCount > 0 && (
          <p className="mt-2 text-sm font-semibold text-sbs-green">
            👨‍👧 {childrenCount} enfant{childrenCount > 1 ? 's' : ''} déclaré{childrenCount > 1 ? 's' : ''}
          </p>
        )}

      <article className="mx-auto max-w-md overflow-hidden rounded-card-lg border-2 border-sbs-blue/20 bg-white text-left shadow-card">
        <div className="bg-sbs-blue px-5 py-3 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Référence</div>
              <div className="font-mono text-lg font-bold">{bookingRef}</div>
            </div>
            <SbsLogo size="md" />
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-muted">Trajet</div>
            <div className="font-display text-base font-extrabold text-sbs-dark">{trip.from.name} → {trip.to.name}</div>
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
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-muted">
                {isCash ? 'Montant à payer' : 'Montant payé'}
              </div>
              <div className="text-sm font-bold text-sbs-dark">{formatXAF(totalPaid)}</div>
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

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          variant="primary"
          size="lg"
          onClick={() => onNavigate('messages')}
          className="rounded-pill"
        >
          <Phone className="h-4 w-4" />
          {conversationId ? 'Parler au chauffeur' : 'Messagerie'}
        </Button>
        <Button variant="ghost" size="lg" onClick={() => onNavigate('landing')}>
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
}


