/**
 * Page /contact — minimal, pas de formulaire pour l'instant.
 * Email mailto + canaux directs + adresse de l'éditeur.
 *
 * Pas de formulaire web parce qu'il faudrait un endpoint backend dédié
 * et un anti-spam — superflu pour la bêta. Un mailto est tracké correctement
 * par les outils analytics et préserve la conversation pour l'utilisateur.
 */
import { ArrowLeft, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SbsLogo } from '@/components/ui/SbsLogo';
import type { Screen } from '@/lib/types';

interface ContactProps {
  onNavigate: (s: Screen) => void;
}

export function Contact({ onNavigate }: ContactProps) {
  return (
    <div className="min-h-screen bg-sbs-cream">
      <header className="sticky top-0 z-30 border-b border-sbs-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2"
            aria-label="Retour à l'accueil"
          >
            <SbsLogo size="sm" />
            <span className="font-display text-base font-extrabold">
              Side<span className="text-sbs-yellow-dark">By</span>Side
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('landing')}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Button>

        <h1 className="font-display text-3xl font-extrabold tracking-tight text-sbs-dark sm:text-4xl">
          Nous contacter
        </h1>
        <p className="mt-3 max-w-xl text-sbs-muted">
          SideBySide est une petite équipe qui répond personnellement à chaque message.
          Choisis le canal qui te convient — on revient vers toi sous 48h ouvrées.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href="mailto:contact@sidebyside.cm"
            className="group flex items-start gap-4 rounded-card-lg border border-sbs-border bg-white p-5 transition-all hover:border-sbs-blue/40 hover:shadow-card"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-card bg-sbs-blue-light text-sbs-blue">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-sm font-extrabold text-sbs-dark">
                Email général
              </div>
              <div className="mt-0.5 text-sm text-sbs-blue group-hover:underline">
                contact@sidebyside.cm
              </div>
              <p className="mt-2 text-xs text-sbs-muted">
                Pour toute question, demande presse, partenariat ou suggestion.
              </p>
            </div>
          </a>

          <a
            href="mailto:support@sidebyside.cm"
            className="group flex items-start gap-4 rounded-card-lg border border-sbs-border bg-white p-5 transition-all hover:border-sbs-blue/40 hover:shadow-card"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-card bg-sbs-yellow-light text-sbs-yellow-dark">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-sm font-extrabold text-sbs-dark">
                Support utilisateur
              </div>
              <div className="mt-0.5 text-sm text-sbs-blue group-hover:underline">
                support@sidebyside.cm
              </div>
              <p className="mt-2 text-xs text-sbs-muted">
                Si tu as un problème avec une réservation, un paiement ou un trajet.
              </p>
            </div>
          </a>
        </div>

        <div className="mt-8 rounded-card-lg border border-sbs-border bg-white p-6">
          <h2 className="font-display text-lg font-extrabold text-sbs-dark">
            Éditeur du service
          </h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sbs-blue" />
              <div>
                <dt className="font-bold text-sbs-dark">Localisation principale</dt>
                <dd className="text-sbs-muted">Bruxelles, Belgique 🇧🇪 — équipe produit</dd>
                <dd className="text-sbs-muted">Douala, Cameroun 🇨🇲 — opérations terrain</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sbs-blue" />
              <div>
                <dt className="font-bold text-sbs-dark">Délai de réponse</dt>
                <dd className="text-sbs-muted">Sous 48h ouvrées (du lundi au vendredi)</dd>
              </div>
            </div>
          </dl>

          <p className="mt-5 text-xs text-sbs-muted">
            En phase bêta, SideBySide est porté par <strong>Fogang Youbi Brice Arnold</strong>
            depuis Bruxelles. Une structure juridique au Cameroun et en Belgique sera
            constituée avant le lancement commercial.
          </p>
        </div>

        <div className="mt-10 rounded-card-lg bg-sbs-blue p-6 text-center text-white sm:p-8">
          <h2 className="font-display text-xl font-extrabold">
            🚨 Urgence pendant un trajet ?
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Utilise le <strong>bouton SOS</strong> dans l'application — il alerte directement
            la police, la gendarmerie, une ambulance ou notre support, selon ta situation.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Contact;
