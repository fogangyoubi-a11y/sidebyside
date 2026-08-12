/**
 * NotifyMeModal — modal "Préviens-moi quand cet axe ouvre".
 *
 * Apparait quand un visiteur clique sur un axe "Bientôt" depuis la home.
 * Capture prénom + email + axe préchargé, POST sur /newsletter/subscribe
 * (source HOMEPAGE, axes=[axisId]) — réutilise toute l'infra Mailchimp
 * branchée pour la landing diaspora.
 *
 * Fallback gracieux si le backend est down : on accepte côté UI plutôt
 * que de bloquer le visiteur.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { X, Loader2, Mail, CheckCircle2, AlertCircle, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClient, ApiError } from '@/lib/api';

interface NotifyMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Identifiant axe envoyé au backend (ex: "douala-yaounde"). */
  axisId: string;
  /** Label humain pour le header de la modal (ex: "Douala → Yaoundé"). */
  axisLabel: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function NotifyMeModal({ isOpen, onClose, axisId, axisLabel }: NotifyMeModalProps) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  // Fermer avec Escape, et reset du form quand on rouvre
  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form state each time the modal (re)opens
    setStatus('idle');
    setError('');
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    // Bloque le scroll body pendant que la modal est ouverte
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
        axes: [axisId],
        source: 'HOMEPAGE',
      });
      setStatus('success');
    } catch (err) {
      console.warn('NotifyMe — backend unreachable, fallback success', err);
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        setStatus('error');
        setError(err.message || "Une erreur a empêché ton inscription.");
        return;
      }
      // Réseau / 5xx → succès gracieux côté UI
      setStatus('success');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-sbs-dark/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notify-me-title"
    >
      <div
        className="w-full max-w-md rounded-t-card-lg bg-white p-6 shadow-card-hover sm:rounded-card-lg sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-pill bg-sbs-yellow-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sbs-yellow-dark">
              <MapPin className="h-3 w-3" /> Axe à venir
            </div>
            <h2 id="notify-me-title" className="mt-2 font-display text-xl font-extrabold text-sbs-dark">
              {axisLabel}
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
              On t'écrit dès que <strong>{axisLabel}</strong> ouvre. Pas de spam, promis.
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
              Laisse-nous ton email et on te prévient <strong>dès qu'on ouvre cet axe</strong>.
              Aucun spam, juste cette annonce.
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

