import { ArrowLeft, Construction } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SbsLogo } from '@/components/ui/SbsLogo';
import type { Screen } from '@/lib/types';

interface ComingSoonProps {
  screen: Screen;
  onNavigate: (s: Screen) => void;
}

const labels: Partial<Record<Screen, string>> = {
  'home-passenger': 'Accueil Passager',
  'home-driver': 'Accueil Chauffeur',
  'trip-detail': 'Détail du trajet',
  'booking': 'Réservation',
  'payment': 'Paiement Mobile Money',
  'booking-confirmed': 'Réservation confirmée',
  'publish-trip': 'Publier un trajet',
  'driver-trips': 'Mes trajets',
  'profile': 'Profil',
  'admin': 'Administration',
};

export function ComingSoon({ screen, onNavigate }: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-sbs-cream">
      <header className="border-b border-sbs-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
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
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-card-lg bg-sbs-yellow-light text-sbs-yellow-dark">
          <Construction className="h-10 w-10" />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-sbs-dark sm:text-4xl">
          {labels[screen] ?? 'Bientôt disponible'}
        </h1>
        <p className="mt-3 text-sbs-muted">
          Cet écran sera livré dans un prochain sprint. <br />
          Le MVP actuel couvre la landing, la recherche de trajets et l'onboarding.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="primary" size="lg" onClick={() => onNavigate('search')} className="rounded-pill">
            Chercher un trajet
          </Button>
          <Button variant="ghost" size="lg" onClick={() => onNavigate('landing')}>
            Retour à l'accueil
          </Button>
        </div>
      </main>
    </div>
  );
}
