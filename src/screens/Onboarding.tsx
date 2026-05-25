import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, User, Car, ShieldCheck, KeyRound, Lock,
  IdCard, Camera, FileCheck, Shield, Sparkles, AlertTriangle, Smartphone, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PhoneInput } from '@/components/security/PhoneInput';
import { OtpInput6 } from '@/components/security/OtpInput6';
import { PasswordStrength } from '@/components/security/PasswordStrength';
import { DocumentUpload, SelfieUpload } from '@/components/security/DocumentUpload';
import { TrustBadge } from '@/components/security/TrustBadge';
import { DateOfBirthInput } from '@/components/security/DateOfBirthInput';
import { cn } from '@/lib/utils';
import {
  validatePhoneCM,
  checkPassword,
  createOtpState,
  isOtpComplete,
  isOtpExpired,
  type OtpState,
  type TrustLevel,
} from '@/lib/security';
import type { Screen, Role } from '@/lib/types';

interface OnboardingProps {
  onNavigate: (s: Screen) => void;
}

type Step =
  | 'role'
  | 'phone'
  | 'otp'
  | 'identity'
  | 'password'
  | 'kyc-cni'
  | 'kyc-selfie'
  | 'kyc-driver'   // permis + carte grise + véhicule (chauffeurs uniquement)
  | 'done';

interface FormState {
  role: Role | null;
  phoneLocal: string;          // saisie sans préfixe
  otp: OtpState;
  firstName: string;
  lastName: string;
  birthDate: string;           // YYYY-MM-DD
  password: string;
  passwordConfirm: string;
  cniFront: File | null;
  cniBack: File | null;
  selfie: File | null;
  license: File | null;
  vehicleRegistration: File | null;
  vehiclePhoto: File | null;
}

const initialForm: FormState = {
  role: null,
  phoneLocal: '',
  otp: createOtpState(),
  firstName: '',
  lastName: '',
  birthDate: '',
  password: '',
  passwordConfirm: '',
  cniFront: null,
  cniBack: null,
  selfie: null,
  license: null,
  vehicleRegistration: null,
  vehiclePhoto: null,
};

export function Onboarding({ onNavigate }: OnboardingProps) {
  const [step, setStep] = useState<Step>('role');
  const [form, setForm] = useState<FormState>(initialForm);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-sbs-blue-light via-sbs-cream to-sbs-yellow-light">
      <Header onNavigate={onNavigate} />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <Stepper step={step} role={form.role} />

        <div className="mt-6 rounded-card-lg border border-sbs-border bg-white shadow-card sm:rounded-card-lg">
          {step === 'role' && (
            <RoleStep
              role={form.role}
              onPick={(role) => update({ role })}
              onNext={() => form.role && setStep('phone')}
            />
          )}
          {step === 'phone' && (
            <PhoneStep
              phoneLocal={form.phoneLocal}
              onPhone={(phoneLocal) => update({ phoneLocal })}
              onBack={() => setStep('role')}
              onNext={() => {
                update({ otp: createOtpState() });
                setStep('otp');
              }}
            />
          )}
          {step === 'otp' && (
            <OtpStep
              phoneLocal={form.phoneLocal}
              otp={form.otp}
              onOtp={(otp) => update({ otp })}
              onResend={() => update({ otp: createOtpState() })}
              onBack={() => setStep('phone')}
              onNext={() => setStep('identity')}
            />
          )}
          {step === 'identity' && (
            <IdentityStep
              form={form}
              onUpdate={update}
              onBack={() => setStep('otp')}
              onNext={() => setStep('password')}
            />
          )}
          {step === 'password' && (
            <PasswordStep
              form={form}
              onUpdate={update}
              onBack={() => setStep('identity')}
              onNext={() => setStep('kyc-cni')}
            />
          )}
          {step === 'kyc-cni' && (
            <KycCniStep
              form={form}
              onUpdate={update}
              onBack={() => setStep('password')}
              onNext={() => setStep('kyc-selfie')}
            />
          )}
          {step === 'kyc-selfie' && (
            <KycSelfieStep
              form={form}
              onUpdate={update}
              onBack={() => setStep('kyc-cni')}
              onNext={() => setStep(form.role === 'driver' ? 'kyc-driver' : 'done')}
            />
          )}
          {step === 'kyc-driver' && form.role === 'driver' && (
            <KycDriverStep
              form={form}
              onUpdate={update}
              onBack={() => setStep('kyc-selfie')}
              onNext={() => setStep('done')}
            />
          )}
          {step === 'done' && (
            <DoneStep form={form} onNavigate={onNavigate} />
          )}
        </div>

        {/* Bandeau de réassurance bas */}
        {step !== 'done' && (
          <p className="mx-auto mt-4 flex max-w-md items-start gap-2 px-2 text-[11px] leading-relaxed text-sbs-muted">
            <Shield className="mt-0.5 h-3 w-3 shrink-0 text-sbs-green" />
            Vos données sont chiffrées et protégées par la loi camerounaise de protection des données.
            SideBySide ne les revend jamais.
          </p>
        )}
      </main>
    </div>
  );
}

/* ----------------------------- Header ----------------------------- */

function Header({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <header className="border-b border-sbs-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
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
          <span className="font-display text-base font-extrabold">
            Side<span className="text-sbs-yellow-dark">By</span>Side
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-pill border border-sbs-green/30 bg-sbs-green/5 px-2 py-1 text-[10px] font-bold text-sbs-green">
          <Shield className="h-3 w-3" />
          Sécurisé
        </span>
      </div>
    </header>
  );
}

/* ----------------------------- Stepper ----------------------------- */

function Stepper({ step, role }: { step: Step; role: Role | null }) {
  const allSteps: { key: Step; icon: typeof Shield; label: string }[] = [
    { key: 'role',       icon: User,       label: 'Rôle' },
    { key: 'phone',      icon: Smartphone, label: 'Téléphone' },
    { key: 'otp',        icon: KeyRound,   label: 'Code SMS' },
    { key: 'identity',   icon: IdCard,     label: 'Identité' },
    { key: 'password',   icon: Lock,       label: 'Mot de passe' },
    { key: 'kyc-cni',    icon: FileCheck,  label: 'CNI' },
    { key: 'kyc-selfie', icon: Camera,     label: 'Selfie' },
    ...(role === 'driver' ? [{ key: 'kyc-driver' as Step, icon: Car, label: 'Véhicule' }] : []),
    { key: 'done',       icon: ShieldCheck, label: 'OK' },
  ];

  const currentIdx = allSteps.findIndex((s) => s.key === step);
  const total = allSteps.length;
  const progressPct = total === 1 ? 0 : (currentIdx / (total - 1)) * 100;

  return (
    <div>
      {/* Barre de progression mobile-friendly */}
      <div className="mb-3 sm:hidden">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sbs-muted">
            Étape {currentIdx + 1} / {total}
          </span>
          <span className="text-[10px] font-semibold text-sbs-dark">
            {allSteps[currentIdx]?.label}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-pill bg-sbs-border-soft">
          <div
            className="h-full rounded-pill bg-gradient-to-r from-sbs-blue to-sbs-yellow transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Stepper desktop */}
      <ol className="hidden items-center justify-center gap-1 sm:flex">
        {allSteps.map((s, i) => {
          const Icon = s.icon;
          const done = i < currentIdx;
          const current = i === currentIdx;
          return (
            <li key={s.key} className="flex items-center gap-1">
              <span
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-full border-2 transition-all',
                  done && 'border-sbs-green bg-sbs-green text-white',
                  current && 'border-sbs-blue bg-sbs-blue text-white shadow-soft scale-110',
                  !done && !current && 'border-sbs-border bg-white text-sbs-muted',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              {i < total - 1 && (
                <span className={cn('h-px w-4', i < currentIdx ? 'bg-sbs-green' : 'bg-sbs-border')} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ----------------------------- 1. ROLE ----------------------------- */

function RoleStep({ role, onPick, onNext }: { role: Role | null; onPick: (r: Role) => void; onNext: () => void }) {
  return (
    <StepWrapper title="Bienvenue sur SideBySide !" subtitle="Comment souhaitez-vous utiliser l'application ?">
      <div className="grid gap-3 sm:grid-cols-2">
        <RoleCard
          active={role === 'passenger'}
          onClick={() => onPick('passenger')}
          icon={<User className="h-7 w-7" />}
          color="blue"
          title="Je suis passager"
          desc="Je cherche un trajet partagé entre les villes du Cameroun."
          perks={['Réserver des places', 'Payer en Mobile Money', 'Noter mes chauffeurs']}
        />
        <RoleCard
          active={role === 'driver'}
          onClick={() => onPick('driver')}
          icon={<Car className="h-7 w-7" />}
          color="yellow"
          title="Je suis chauffeur"
          desc="Je conduis régulièrement, je partage mes places vides."
          perks={['Publier des trajets', 'Recevoir mes gains', 'Vérification renforcée']}
        />
      </div>

      <p className="mt-4 text-[11px] text-sbs-muted">
        Vous pourrez basculer entre les deux rôles depuis votre profil à tout moment.
      </p>

      <NavRow onlyNext disabled={!role} onNext={onNext} />
    </StepWrapper>
  );
}

function RoleCard({ active, onClick, icon, color, title, desc, perks }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; color: 'blue' | 'yellow';
  title: string; desc: string; perks: string[];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col gap-3 rounded-card-lg border-2 p-5 text-left transition-all',
        active
          ? color === 'blue'
            ? 'border-sbs-blue bg-sbs-blue-light shadow-card scale-[1.02]'
            : 'border-sbs-yellow bg-sbs-yellow-light shadow-card scale-[1.02]'
          : 'border-sbs-border bg-white hover:border-sbs-blue/30 hover:shadow-soft',
      )}
    >
      <div className={cn(
        'grid h-14 w-14 place-items-center rounded-card-lg',
        color === 'blue' ? 'bg-sbs-blue text-white' : 'bg-sbs-yellow text-sbs-dark',
      )}>
        {icon}
      </div>
      <div>
        <div className="font-display text-base font-extrabold text-sbs-dark">{title}</div>
        <p className="mt-1 text-xs leading-relaxed text-sbs-muted">{desc}</p>
      </div>
      <ul className="mt-1 space-y-1">
        {perks.map((p) => (
          <li key={p} className="flex items-center gap-1.5 text-[11px] text-sbs-dark">
            <span className={cn('h-1.5 w-1.5 rounded-full', color === 'blue' ? 'bg-sbs-blue' : 'bg-sbs-yellow-dark')} />
            {p}
          </li>
        ))}
      </ul>
    </button>
  );
}

/* ----------------------------- 2. PHONE ----------------------------- */

function PhoneStep({ phoneLocal, onPhone, onBack, onNext }: {
  phoneLocal: string; onPhone: (v: string) => void; onBack: () => void; onNext: () => void;
}) {
  const validation = validatePhoneCM(phoneLocal);

  return (
    <StepWrapper
      title="Votre numéro de téléphone"
      subtitle="Un seul compte par numéro. Nous l'utilisons pour vous identifier et envoyer les codes de sécurité."
      icon={<Smartphone className="h-7 w-7" />}
      iconColor="blue"
    >
      <PhoneInput
        value={phoneLocal}
        onChange={onPhone}
        hint="Format camerounais uniquement (MTN, Orange, Camtel)"
      />

      <div className="mt-5 rounded-card border border-sbs-blue/15 bg-sbs-blue-light/30 p-3 text-[11px] leading-relaxed text-sbs-blue">
        <p className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Votre numéro sera <strong>masqué</strong> aux autres utilisateurs (passagers/chauffeurs).
          Les échanges se font via la messagerie interne SideBySide.
        </p>
      </div>

      <NavRow onBack={onBack} onNext={onNext} disabled={!validation.valid} />
    </StepWrapper>
  );
}

/* ----------------------------- 3. OTP ----------------------------- */

function OtpStep({ phoneLocal, otp, onOtp, onResend, onBack, onNext }: {
  phoneLocal: string; otp: OtpState; onOtp: (o: OtpState) => void;
  onResend: () => void; onBack: () => void; onNext: () => void;
}) {
  const validation = validatePhoneCM(phoneLocal);
  const complete = isOtpComplete(otp);
  const expired = isOtpExpired(otp);
  const canResend = Date.now() >= otp.resendAt;

  return (
    <StepWrapper
      title="Vérifiez votre numéro"
      subtitle={
        <>
          Code à <strong>6 chiffres</strong> envoyé au <strong className="text-sbs-dark font-mono">{validation.formatted || phoneLocal}</strong>
        </>
      }
      icon={<KeyRound className="h-7 w-7" />}
      iconColor="blue"
    >
      <OtpInput6 state={otp} onChange={onOtp} />

      <p className="mt-5 text-center text-xs text-sbs-muted">
        Pas reçu de SMS ?{' '}
        <button
          type="button"
          onClick={onResend}
          disabled={!canResend}
          className={cn(
            'font-bold transition-colors',
            canResend ? 'text-sbs-blue hover:underline' : 'cursor-not-allowed text-sbs-muted/60',
          )}
        >
          {canResend ? 'Renvoyer le code' : `Renvoyer dans ${Math.max(0, Math.ceil((otp.resendAt - Date.now()) / 1000))}s`}
        </button>
      </p>

      <NavRow onBack={onBack} onNext={onNext} disabled={!complete || expired} nextLabel="Valider" />
    </StepWrapper>
  );
}

/* ----------------------------- 4. IDENTITY ----------------------------- */

function IdentityStep({ form, onUpdate, onBack, onNext }: {
  form: FormState; onUpdate: (p: Partial<FormState>) => void; onBack: () => void; onNext: () => void;
}) {
  // La date de naissance est validée par DateOfBirthInput. Si elle est au format
  // ISO complet (YYYY-MM-DD), elle est valide ; si "partial:..." ou vide, elle ne l'est pas.
  const validBirth = /^\d{4}-\d{2}-\d{2}$/.test(form.birthDate);
  const valid = form.firstName.trim().length >= 2 && form.lastName.trim().length >= 2 && validBirth;

  return (
    <StepWrapper
      title="Vos informations"
      subtitle="Telles qu'elles apparaissent sur votre CNI. Vous devez avoir 18 ans ou plus."
      icon={<IdCard className="h-7 w-7" />}
      iconColor="blue"
    >
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Prénom"
            placeholder="ex. Achille"
            value={form.firstName}
            onChange={(e) => onUpdate({ firstName: e.target.value })}
            leftIcon={<User className="h-4 w-4" />}
          />
          <Input
            label="Nom"
            placeholder="ex. Nkomo"
            value={form.lastName}
            onChange={(e) => onUpdate({ lastName: e.target.value })}
            leftIcon={<User className="h-4 w-4" />}
          />
        </div>
        <DateOfBirthInput
          value={form.birthDate}
          onChange={(birthDate) => onUpdate({ birthDate })}
        />
      </div>

      <NavRow onBack={onBack} onNext={onNext} disabled={!valid} />
    </StepWrapper>
  );
}

/* ----------------------------- 5. PASSWORD ----------------------------- */

function PasswordStep({ form, onUpdate, onBack, onNext }: {
  form: FormState; onUpdate: (p: Partial<FormState>) => void; onBack: () => void; onNext: () => void;
}) {
  const check = checkPassword(form.password);
  const matches = form.password === form.passwordConfirm && form.password.length > 0;
  const valid = check.valid && matches;

  return (
    <StepWrapper
      title="Créez un mot de passe robuste"
      subtitle="Il protégera votre compte et vos paiements. Mémorisez-le bien : nous ne pouvons pas le récupérer."
      icon={<Lock className="h-7 w-7" />}
      iconColor="blue"
    >
      <PasswordStrength
        value={form.password}
        onChange={(password) => onUpdate({ password })}
        confirmValue={form.passwordConfirm}
        onConfirmChange={(passwordConfirm) => onUpdate({ passwordConfirm })}
      />

      <div className="mt-4 rounded-card border border-sbs-blue/15 bg-sbs-blue-light/30 p-3 text-[11px] leading-relaxed text-sbs-blue">
        <p className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Astuce : combinez 3 mots faciles à retenir + un chiffre + un symbole. Exemple : <code className="rounded bg-white px-1">Douala-Café-Maïs!2026</code>
        </p>
      </div>

      <NavRow onBack={onBack} onNext={onNext} disabled={!valid} />
    </StepWrapper>
  );
}

/* ----------------------------- 6. KYC CNI ----------------------------- */

function KycCniStep({ form, onUpdate, onBack, onNext }: {
  form: FormState; onUpdate: (p: Partial<FormState>) => void; onBack: () => void; onNext: () => void;
}) {
  const valid = !!form.cniFront && !!form.cniBack;

  return (
    <StepWrapper
      title="Vérification de votre identité"
      subtitle="Photographiez votre Carte Nationale d'Identité (CNI). Sans cette étape, vous ne pouvez ni réserver ni publier."
      icon={<FileCheck className="h-7 w-7" />}
      iconColor="blue"
    >
      <div className="mb-3 inline-flex items-center gap-2 rounded-pill border border-sbs-yellow/40 bg-sbs-yellow-light/60 px-3 py-1.5 text-[11px] font-bold text-sbs-yellow-dark">
        <AlertTriangle className="h-3.5 w-3.5" />
        Étape obligatoire — vérifiée manuellement sous 24 h
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DocumentUpload
          label="CNI — Recto"
          hint="Côté photo"
          value={form.cniFront}
          onChange={(cniFront) => onUpdate({ cniFront })}
          icon={<IdCard className="h-6 w-6" />}
        />
        <DocumentUpload
          label="CNI — Verso"
          hint="Côté infos"
          value={form.cniBack}
          onChange={(cniBack) => onUpdate({ cniBack })}
          icon={<IdCard className="h-6 w-6" />}
        />
      </div>

      <ul className="mt-4 space-y-1.5 text-[11px] text-sbs-muted">
        <li className="flex gap-2"><span className="text-sbs-blue">•</span> Photo nette, sans reflet sur les lettres</li>
        <li className="flex gap-2"><span className="text-sbs-blue">•</span> Les 4 coins doivent être visibles</li>
        <li className="flex gap-2"><span className="text-sbs-blue">•</span> Document en cours de validité uniquement</li>
      </ul>

      <NavRow onBack={onBack} onNext={onNext} disabled={!valid} />
    </StepWrapper>
  );
}

/* ----------------------------- 7. KYC SELFIE ----------------------------- */

function KycSelfieStep({ form, onUpdate, onBack, onNext }: {
  form: FormState; onUpdate: (p: Partial<FormState>) => void; onBack: () => void; onNext: () => void;
}) {
  const valid = !!form.selfie;

  return (
    <StepWrapper
      title="Selfie de vérification"
      subtitle="Une photo de vous, regard face caméra. Nous la comparerons à votre CNI pour confirmer que c'est bien vous."
      icon={<Camera className="h-7 w-7" />}
      iconColor="blue"
    >
      <div className="mx-auto max-w-sm">
        <SelfieUpload
          label="Votre selfie"
          hint="Visage centré, bien éclairé, sans lunettes de soleil ni masque"
          value={form.selfie}
          onChange={(selfie) => onUpdate({ selfie })}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px]">
        <div className="rounded-card border border-sbs-green/20 bg-sbs-green/5 p-2 text-sbs-green">
          ✓ Bien éclairé
        </div>
        <div className="rounded-card border border-sbs-green/20 bg-sbs-green/5 p-2 text-sbs-green">
          ✓ Face caméra
        </div>
        <div className="rounded-card border border-sbs-red/20 bg-red-50 p-2 text-sbs-red">
          ✗ Pas de filtre
        </div>
      </div>

      <NavRow onBack={onBack} onNext={onNext} disabled={!valid} />
    </StepWrapper>
  );
}

/* ----------------------------- 8. KYC DRIVER (chauffeur uniquement) ----------------------------- */

function KycDriverStep({ form, onUpdate, onBack, onNext }: {
  form: FormState; onUpdate: (p: Partial<FormState>) => void; onBack: () => void; onNext: () => void;
}) {
  const valid = !!form.license && !!form.vehicleRegistration && !!form.vehiclePhoto;

  return (
    <StepWrapper
      title="Vérification chauffeur"
      subtitle="Pour la sécurité de vos passagers, nous vérifions votre permis et votre véhicule."
      icon={<Car className="h-7 w-7" />}
      iconColor="yellow"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <DocumentUpload
          label="Permis de conduire"
          hint="Recto avec photo"
          value={form.license}
          onChange={(license) => onUpdate({ license })}
          icon={<IdCard className="h-6 w-6" />}
        />
        <DocumentUpload
          label="Carte grise"
          hint="Document à jour"
          value={form.vehicleRegistration}
          onChange={(vehicleRegistration) => onUpdate({ vehicleRegistration })}
        />
        <DocumentUpload
          label="Photo du véhicule"
          hint="Plaque visible"
          value={form.vehiclePhoto}
          onChange={(vehiclePhoto) => onUpdate({ vehiclePhoto })}
          icon={<Car className="h-6 w-6" />}
        />
      </div>

      <div className="mt-4 rounded-card border border-sbs-yellow/30 bg-sbs-yellow-light/40 p-3 text-[11px] text-sbs-yellow-dark">
        <p className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Une fois vérifié, vous recevrez le badge <TrustBadge level="verified" size="sm" /> et serez plus visible
          dans les résultats. <strong>Au bout de 20 trajets sans incident, vous gagnez le statut <TrustBadge level="premium" size="sm" /></strong>.
        </p>
      </div>

      <NavRow onBack={onBack} onNext={onNext} disabled={!valid} nextLabel="Soumettre pour vérification" />
    </StepWrapper>
  );
}

/* ----------------------------- 9. DONE ----------------------------- */

function DoneStep({ form, onNavigate }: { form: FormState; onNavigate: (s: Screen) => void }) {
  // À ce stade, identityVerified est en cours — donc niveau Basic, avec annonce "Vérifié sous 24h"
  const initialLevel: TrustLevel = 'basic';

  return (
    <StepWrapper>
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-sbs-green to-emerald-400 text-white shadow-card">
          <ShieldCheck className="h-10 w-10" />
        </div>
        <h2 className="font-display text-2xl font-extrabold text-sbs-dark">
          Bienvenue {form.firstName || 'à bord'} ! 🎉
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-sbs-muted">
          Votre compte est créé. Vos documents sont en cours de vérification — vous recevrez une notification sous 24h.
        </p>

        {/* Carte de niveau de confiance */}
        <div className="mx-auto mt-6 max-w-md rounded-card-lg border border-sbs-border bg-sbs-cream p-4 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sbs-muted">
              Votre niveau actuel
            </span>
            <TrustBadge level={initialLevel} size="md" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sbs-muted">
              Après vérification CNI
            </span>
            <TrustBadge level="verified" size="md" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-sbs-border pt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sbs-muted">
              Après 20 trajets sans incident
            </span>
            <TrustBadge level="premium" size="md" />
          </div>
        </div>

        {/* Récap actions de sécurité */}
        <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-2 text-left">
          {[
            { ok: true,  label: 'Téléphone vérifié' },
            { ok: true,  label: 'Mot de passe robuste' },
            { ok: true,  label: 'CNI uploadée' },
            { ok: true,  label: 'Selfie soumis' },
            ...(form.role === 'driver'
              ? [
                  { ok: true, label: 'Permis uploadé' },
                  { ok: true, label: 'Véhicule déclaré' },
                ]
              : [
                  { ok: false, label: '20 trajets pour Premium' },
                  { ok: false, label: 'Pas d\'incident' },
                ]),
          ].map((s, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-1.5 rounded-card border px-2.5 py-1.5 text-[11px]',
                s.ok ? 'border-sbs-green/20 bg-sbs-green/5 text-sbs-green' : 'border-sbs-border bg-white text-sbs-muted',
              )}
            >
              <FileCheck className="h-3 w-3" />
              {s.label}
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {form.role === 'passenger' ? (
            <Button variant="primary" size="lg" onClick={() => onNavigate('search')} className="rounded-pill">
              <MapPin className="h-4 w-4" />
              Chercher mon premier trajet
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="primary" size="lg" onClick={() => onNavigate('publish-trip')} className="rounded-pill">
              <Car className="h-4 w-4" />
              Publier mon premier trajet
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="lg" onClick={() => onNavigate('landing')}>
            Aller à l'accueil
          </Button>
        </div>
      </div>
    </StepWrapper>
  );
}

/* ----------------------------- Helpers ----------------------------- */

function StepWrapper({
  title, subtitle, icon, iconColor, children,
}: {
  title?: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  iconColor?: 'blue' | 'yellow';
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 sm:p-8">
      {icon && (
        <div className={cn(
          'mb-4 inline-grid h-14 w-14 place-items-center rounded-card-lg',
          iconColor === 'yellow' ? 'bg-sbs-yellow text-sbs-dark' : 'bg-sbs-blue text-white',
        )}>
          {icon}
        </div>
      )}
      {title && <h2 className="font-display text-2xl font-extrabold text-sbs-dark">{title}</h2>}
      {subtitle && (
        <p className="mt-1 text-sm leading-relaxed text-sbs-muted">
          {subtitle}
        </p>
      )}
      <div className={cn(title || icon ? 'mt-6' : 'mt-0')}>{children}</div>
    </div>
  );
}

function NavRow({
  onBack, onNext, disabled, nextLabel = 'Continuer', onlyNext,
}: {
  onBack?: () => void;
  onNext: () => void;
  disabled?: boolean;
  nextLabel?: string;
  onlyNext?: boolean;
}) {
  return (
    <div className={cn('mt-6 flex items-center gap-3', onlyNext ? 'justify-end' : 'justify-between')}>
      {!onlyNext && onBack && (
        <Button variant="ghost" size="md" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      )}
      <Button variant="primary" size="lg" onClick={onNext} disabled={disabled} className="rounded-pill">
        {nextLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Unused but useful for future trust display
void Badge;
