import { useState } from 'react';
import { ArrowLeft, ArrowRight, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { PhoneInput } from '@/components/security/PhoneInput';
import { useAuth, consumePendingAction } from '@/hooks/useAuth';
import { validatePhoneCM } from '@/lib/security';
import { cn } from '@/lib/utils';
import type { Screen } from '@/lib/types';

interface LoginProps {
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}

export function Login({ onNavigate }: LoginProps) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneValid = validatePhoneCM(phone).valid;
  const canSubmit = phoneValid && password.length > 0 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const validation = validatePhoneCM(phone);
      await login(validation.e164, password);

      // Si on avait une action en attente (réserver un trajet), on la reprend
      const pending = consumePendingAction();
      if (pending?.type === 'booking') {
        onNavigate('booking', { tripId: pending.tripId, seats: String(pending.seats) });
      } else {
        onNavigate('landing');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Identifiants invalides';
      setError(msg.includes('UNAUTHORIZED') || msg.includes('invalides')
        ? 'Numéro ou mot de passe incorrect'
        : msg.includes('fetch') || msg.includes('Network')
          ? 'Impossible de joindre le serveur — vérifiez votre connexion'
          : msg);
    } finally {
      setSubmitting(false);
    }
  }

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
          <span className="inline-flex items-center gap-1 rounded-pill border border-sbs-green/30 bg-sbs-green/5 px-2 py-1 text-[10px] font-bold text-sbs-green">
            <ShieldCheck className="h-3 w-3" />
            Sécurisé
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-card-lg border border-sbs-border bg-white p-6 shadow-card sm:p-8">
          <div className="mb-4 inline-grid h-14 w-14 place-items-center rounded-card-lg bg-sbs-blue text-white">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-sbs-dark">Connexion</h2>
          <p className="mt-1 text-sm text-sbs-muted">
            Heureux de vous revoir ! Entrez votre numéro et votre mot de passe.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <PhoneInput
              value={phone}
              onChange={setPhone}
              hint="Le numéro associé à votre compte SideBySide"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-sbs-dark">Mot de passe</label>
              <div className="relative flex items-center rounded-btn border border-sbs-border bg-white focus-within:border-sbs-blue focus-within:ring-2 focus-within:ring-sbs-blue/20">
                <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-muted">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  className="h-11 flex-1 bg-transparent text-sm text-sbs-dark placeholder:text-sbs-muted/70 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="grid h-11 w-11 shrink-0 place-items-center text-sbs-muted transition-colors hover:text-sbs-dark"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-card border border-sbs-red/30 bg-red-50 px-3 py-2 text-[11px] font-medium text-sbs-red">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!canSubmit}
              className={cn('w-full rounded-pill', submitting && 'opacity-80')}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion…
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-5 border-t border-sbs-border-soft pt-4 text-center text-xs">
            <span className="text-sbs-muted">Pas encore de compte ? </span>
            <button
              type="button"
              onClick={() => onNavigate('onboarding')}
              className="font-bold text-sbs-blue hover:underline"
            >
              Créer un compte
            </button>
          </div>
        </div>

        <p className="mx-auto mt-4 flex max-w-md items-start gap-2 px-2 text-[11px] leading-relaxed text-sbs-muted">
          <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-sbs-green" />
          Vos données sont chiffrées et protégées par la loi camerounaise de protection des données.
        </p>
      </main>
    </div>
  );
}
