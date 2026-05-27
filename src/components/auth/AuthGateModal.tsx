import { useEffect } from 'react';
import { X, Lock, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { SbsLogo } from '@/components/ui/SbsLogo';

interface AuthGateModalProps {
  /** Action que l'utilisateur essaie de faire (ex. "réserver ce trajet"). */
  action?: string;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

/**
 * Popup affichée quand un visiteur essaie de réserver sans être connecté.
 * Deux choix : se connecter (compte existant) ou s'inscrire (nouveau compte).
 */
export function AuthGateModal({ action = 'réserver ce trajet', onClose, onLogin, onRegister }: AuthGateModalProps) {
  // Empêche le scroll de la page derrière
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Fermer avec Échap
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-t-card-lg bg-white shadow-card-hover sm:rounded-card-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bleu */}
        <header className="relative bg-gradient-to-br from-sbs-blue to-sbs-blue-dark px-5 py-5 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <SbsLogo size="md" bare />
            <div>
              <h2 id="auth-gate-title" className="font-display text-xl font-extrabold leading-tight">
                Connexion requise
              </h2>
              <p className="text-[12px] leading-snug opacity-90">
                Vous devez avoir un compte pour {action}.
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-3 px-5 py-5">
          {/* Pourquoi un compte */}
          <div className="rounded-card border border-sbs-blue/15 bg-sbs-blue-light/30 p-3 text-[11px] leading-relaxed text-sbs-blue">
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                <strong>Pour votre sécurité</strong> et celle des chauffeurs : un compte permet de
                vérifier votre identité, de masquer votre numéro, et de bénéficier du SOS pendant le trajet.
              </span>
            </p>
          </div>

          {/* Choix : se connecter */}
          <button
            type="button"
            onClick={onLogin}
            className="group flex w-full items-center gap-3 rounded-card-lg border-2 border-sbs-border bg-white p-4 text-left transition-all hover:border-sbs-blue hover:shadow-card"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-card bg-sbs-blue-light text-sbs-blue group-hover:bg-sbs-blue group-hover:text-white">
              <LogIn className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-extrabold text-sbs-dark">J'ai déjà un compte</div>
              <div className="text-xs text-sbs-muted">Connexion en 10 secondes (numéro + mot de passe)</div>
            </div>
          </button>

          {/* Choix : s'inscrire */}
          <button
            type="button"
            onClick={onRegister}
            className="group flex w-full items-center gap-3 rounded-card-lg border-2 border-sbs-yellow/30 bg-sbs-yellow-light/40 p-4 text-left transition-all hover:border-sbs-yellow hover:shadow-card"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-card bg-sbs-yellow text-sbs-dark">
              <UserPlus className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-extrabold text-sbs-dark">Créer un compte</div>
              <div className="text-xs text-sbs-muted">Inscription sécurisée — 2 minutes seulement</div>
            </div>
          </button>

          <p className="mt-2 text-center text-[10px] text-sbs-muted">
            Votre trajet vous attend — on revient dessus dès que vous êtes connecté.
          </p>
        </div>

        {/* Footer rassurant */}
        <footer className="border-t border-sbs-border bg-sbs-cream px-5 py-3">
          <p className="flex items-center justify-center gap-1.5 text-[10px] text-sbs-muted">
            <Lock className="h-3 w-3" />
            Aucune donnée personnelle n'est exigée à l'inscription, sauf votre numéro de téléphone.
          </p>
        </footer>
      </div>
    </div>
  );
}
