import { useState } from 'react';
import { ArrowLeft, ArrowRight, Phone, Mail, User, Car, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { Screen, Role } from '@/lib/types';

interface OnboardingProps {
  onNavigate: (s: Screen) => void;
}

type Step = 'role' | 'identity' | 'otp' | 'done';

export function Onboarding({ onNavigate }: OnboardingProps) {
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<Role | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sbs-blue-light via-sbs-cream to-sbs-yellow-light">
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
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Stepper */}
        <Stepper step={step} />

        <div className="mt-6 rounded-card-lg border border-sbs-border bg-white p-6 shadow-card sm:p-8">
          {step === 'role' && (
            <RoleStep
              role={role}
              onPick={setRole}
              onNext={() => role && setStep('identity')}
            />
          )}
          {step === 'identity' && (
            <IdentityStep
              role={role!}
              name={name}
              phone={phone}
              onName={setName}
              onPhone={setPhone}
              onBack={() => setStep('role')}
              onNext={() => setStep('otp')}
            />
          )}
          {step === 'otp' && (
            <OtpStep
              phone={phone}
              otp={otp}
              onOtp={setOtp}
              onBack={() => setStep('identity')}
              onNext={() => setStep('done')}
            />
          )}
          {step === 'done' && (
            <DoneStep role={role!} name={name} onNavigate={onNavigate} />
          )}
        </div>
      </main>
    </div>
  );
}

/* ----------------------------- Stepper ----------------------------- */

function Stepper({ step }: { step: Step }) {
  const steps: Step[] = ['role', 'identity', 'otp', 'done'];
  const idx = steps.indexOf(step);
  const labels = ['Rôle', 'Identité', 'Vérification', 'Terminé'];

  return (
    <ol className="flex items-center gap-2">
      {labels.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              'grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-colors',
              i < idx && 'bg-sbs-green text-white',
              i === idx && 'bg-sbs-blue text-white shadow-soft',
              i > idx && 'bg-white text-sbs-muted border border-sbs-border',
            )}
          >
            {i < idx ? (
              <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2,7 6,11 12,3" />
              </svg>
            ) : (
              i + 1
            )}
          </span>
          <span
            className={cn(
              'hidden text-xs font-semibold sm:inline',
              i === idx ? 'text-sbs-dark' : 'text-sbs-muted',
            )}
          >
            {label}
          </span>
          {i < labels.length - 1 && <span className="hidden h-px w-6 bg-sbs-border sm:block" />}
        </li>
      ))}
    </ol>
  );
}

/* ----------------------------- Role ----------------------------- */

function RoleStep({ role, onPick, onNext }: { role: Role | null; onPick: (r: Role) => void; onNext: () => void }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-extrabold text-sbs-dark">Bienvenue !</h2>
      <p className="mt-1 text-sm text-sbs-muted">Comment souhaitez-vous utiliser SideBySide ?</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <RoleCard
          active={role === 'passenger'}
          onClick={() => onPick('passenger')}
          icon={<User className="h-7 w-7" />}
          color="blue"
          title="Je suis passager"
          desc="Je cherche un trajet partagé pour me déplacer entre les villes."
          perks={['Réserver des places', 'Payer en Mobile Money', 'Noter mes chauffeurs']}
        />
        <RoleCard
          active={role === 'driver'}
          onClick={() => onPick('driver')}
          icon={<Car className="h-7 w-7" />}
          color="yellow"
          title="Je suis chauffeur"
          desc="Je conduis régulièrement et je veux partager mes places vides."
          perks={['Publier des trajets', 'Recevoir mes gains', 'Vérification CNI']}
        />
      </div>

      <p className="mt-4 text-[11px] text-sbs-muted">
        Vous pourrez basculer entre les deux rôles depuis votre profil à tout moment.
      </p>

      <div className="mt-6 flex justify-end">
        <Button variant="primary" size="lg" disabled={!role} onClick={onNext} className="rounded-pill">
          Continuer
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  color,
  title,
  desc,
  perks,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  color: 'blue' | 'yellow';
  title: string;
  desc: string;
  perks: string[];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col gap-3 rounded-card-lg border-2 p-5 text-left transition-all',
        active
          ? color === 'blue'
            ? 'border-sbs-blue bg-sbs-blue-light shadow-card'
            : 'border-sbs-yellow bg-sbs-yellow-light shadow-card'
          : 'border-sbs-border bg-white hover:border-sbs-blue/30 hover:shadow-soft',
      )}
    >
      <div
        className={cn(
          'grid h-14 w-14 place-items-center rounded-card-lg',
          color === 'blue' ? 'bg-sbs-blue text-white' : 'bg-sbs-yellow text-sbs-dark',
        )}
      >
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

/* ----------------------------- Identity ----------------------------- */

function IdentityStep({
  role,
  name,
  phone,
  onName,
  onPhone,
  onBack,
  onNext,
}: {
  role: Role;
  name: string;
  phone: string;
  onName: (s: string) => void;
  onPhone: (s: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const valid = name.trim().length >= 2 && /^[+]?[0-9\s]{8,15}$/.test(phone.trim());

  return (
    <div>
      <Badge tone={role === 'passenger' ? 'blue' : 'yellow'}>
        {role === 'passenger' ? 'Passager' : 'Chauffeur'}
      </Badge>
      <h2 className="mt-3 font-display text-2xl font-extrabold text-sbs-dark">Vos informations</h2>
      <p className="mt-1 text-sm text-sbs-muted">
        On vérifiera votre numéro par SMS dans un instant.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <Input
          label="Nom complet"
          placeholder="ex. Achille Nkomo"
          value={name}
          onChange={(e) => onName(e.target.value)}
          leftIcon={<User className="h-4 w-4" />}
        />
        <Input
          label="Numéro de téléphone (Cameroun)"
          placeholder="+237 6XX XX XX XX"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          leftIcon={<Phone className="h-4 w-4" />}
          hint="MTN ou Orange — utilisé pour recevoir le code de vérification"
        />
        <div className="rounded-card border border-sbs-border-soft bg-sbs-cream px-4 py-3 text-xs text-sbs-muted">
          <p className="flex items-start gap-2">
            <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sbs-blue" />
            Vous préférez vous inscrire avec un email ou via Google/Facebook ? C'est possible aussi.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" size="md" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button variant="primary" size="lg" onClick={onNext} disabled={!valid} className="rounded-pill">
          Recevoir le code SMS
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ----------------------------- OTP ----------------------------- */

function OtpStep({
  phone,
  otp,
  onOtp,
  onBack,
  onNext,
}: {
  phone: string;
  otp: string[];
  onOtp: (v: string[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const complete = otp.every((d) => d.length === 1);

  function handleChange(i: number, v: string) {
    if (v.length > 1) v = v.slice(-1);
    if (v && !/^\d$/.test(v)) return;
    const next = [...otp];
    next[i] = v;
    onOtp(next);
    if (v && i < 3) {
      const el = document.getElementById(`otp-${i + 1}`);
      el?.focus();
    }
  }

  return (
    <div>
      <div className="mb-4 inline-grid h-14 w-14 place-items-center rounded-card-lg bg-sbs-blue text-white">
        <KeyRound className="h-7 w-7" />
      </div>
      <h2 className="font-display text-2xl font-extrabold text-sbs-dark">Vérifiez votre numéro</h2>
      <p className="mt-1 text-sm text-sbs-muted">
        Code à 4 chiffres envoyé au <strong className="text-sbs-dark">{phone || '+237 ...'}</strong>
      </p>

      <div className="mt-6 flex justify-center gap-3">
        {otp.map((d, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            className="h-16 w-14 rounded-card border-2 border-sbs-border bg-white text-center font-display text-2xl font-extrabold text-sbs-dark transition-colors focus:border-sbs-blue focus:outline-none focus:ring-2 focus:ring-sbs-blue/20"
          />
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-sbs-muted">
        Pas reçu de SMS ?{' '}
        <button type="button" className="font-bold text-sbs-blue hover:underline">
          Renvoyer le code
        </button>
      </p>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" size="md" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button variant="primary" size="lg" disabled={!complete} onClick={onNext} className="rounded-pill">
          Valider
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ----------------------------- Done ----------------------------- */

function DoneStep({ role, name, onNavigate }: { role: Role; name: string; onNavigate: (s: Screen) => void }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-sbs-green text-white">
        <ShieldCheck className="h-8 w-8" />
      </div>
      <h2 className="font-display text-2xl font-extrabold text-sbs-dark">
        Bienvenue {name.split(' ')[0] || 'à bord'} ! 🎉
      </h2>
      <p className="mt-2 text-sm text-sbs-muted">
        Votre compte SideBySide est créé.
        {role === 'driver'
          ? " Pour publier votre premier trajet, on vous demandera votre CNI."
          : ' Vous pouvez chercher votre premier trajet dès maintenant.'}
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {role === 'passenger' ? (
          <Button variant="primary" size="lg" onClick={() => onNavigate('search')} className="rounded-pill">
            Chercher un trajet
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={() => onNavigate('publish-trip')} className="rounded-pill">
            Publier mon premier trajet
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="lg" onClick={() => onNavigate('landing')}>
          Aller à l'accueil
        </Button>
      </div>
    </div>
  );
}
