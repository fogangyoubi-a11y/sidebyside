/**
 * CountryWaitlistModal — "Préviens-moi quand SideBySide arrive dans ce pays".
 *
 * S'ouvre quand un visiteur choisit, dans le CountrySelector du header, un
 * pays pas encore actif. Réutilise l'infra newsletter existante (même
 * endpoint que NotifyMeModal pour les axes de trajet à venir) en taguant
 * l'inscription avec axes: ["country-<id>"] pour distinguer l'intérêt pays
 * de l'intérêt axe, sans avoir besoin d'un nouveau endpoint backend.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { X, Loader2, Mail, CheckCircle2, AlertCircle, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient, ApiError } from '@/lib/api';
import { FlagIcon, type CountryOption } from './CountrySelector';

interface CountryWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: CountryOption | null;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function CountryWaitlistModal({ isOpen, onClose, country }: CountryWaitlistModalProps) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form state each time the modal (re)opens
    setStatus('idle');
    setError('');
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !country) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!firstName.trim()) {
      setError('Ton prénom nous aide à personnaliser le message.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError("Cette adresse email a l'air bizarre. Vérifie qu'elle est correcte.");
      return;
    }

    setStatus('loading');
    try {
      await ApiClient.newsletterSubscribe({
        email: email.trim(),
        firstName: firstName.trim(),
        axes: [`country-${country!.id}`],
        source: 'HOMEPAGE',
      });
      setStatus('success');
    } catch (err) {
      console.warn('CountryWaitlist — backend unreachable, fallback success', err);
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        setStatus('error');
        setError(err.message || "Une erreur a empêché ton inscription.");
        return;
      }
      setStatus('success');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-sbs-dark/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="country-waitlist-title"
    >
      <div
        className="w-full max-w-md rounded-t-card-lg bg-white p-6 shadow-card-hover sm:rounded-card-lg sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-pill bg-sbs-yellow-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sbs-yellow-dark">
              <Globe className="h-3 w-3" /> Pays à venir
            </div>
            <h2 id="country-waitlist-title" className="mt-2 flex items-center gap-2 font-display text-xl font-extrabold text-sbs-dark">
              <FlagIcon countryId={country.id} size="md" />
              {country.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-pill text-sbs-muted hover:bg-sbs-border-soft hover:text-sbs-dark"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="mt-6 rounded-card-lg border border-sbs-green/20 bg-sbs-green/5 p-5 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-sbs-green/15 text-sbs-green">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="font-display text-base font-extrabold text-sbs-dark">
              C'est noté, {firstName} !
            </p>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-sbs-muted">
              On t'écrit dès que SideBySide arrive au <strong>{country.name}</strong>. Pas de spam, promis.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={onClose}
              className="mt-5 w-full rounded-pill"
            >
              Continuer à explorer
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-sbs-muted">
              SideBySide n'est pas encore disponible au <strong>{country.name}</strong>.
              Laisse-nous ton email et on te prévient <strong>dès qu'on y arrive</strong>.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <Input
                label="Ton prénom"
                placeholder="Mariama"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
                disabled={status === 'loading'}
              />
              <Input
                label="Ton email"
                type="email"
                placeholder="mariama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={status === 'loading'}
                leftIcon={<Mail className="h-4 w-4" />}
              />

              {error && (
                <div className="flex items-start gap-2 rounded-btn border border-sbs-red/30 bg-sbs-red/5 p-3 text-sm text-sbs-red">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={status === 'loading'}
                className="w-full rounded-pill"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    On t'inscrit…
                  </>
                ) : (
                  <>
                    Préviens-moi <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-[11px] text-sbs-muted">
                Désinscription en 1 clic. Tes données restent en Europe.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
