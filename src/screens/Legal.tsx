/**
 * Page /legal — agrège CGU, Politique de confidentialité, Cookies en 3 sections ancrées.
 *
 * Approche bêta : on est honnête sur le fait que ces documents seront
 * enrichis avant le lancement commercial. L'important est qu'ils existent
 * et soient cliquables (vs `href="#"` morts).
 *
 * Les liens du footer pointent vers /legal#terms, /legal#privacy, /legal#cookies.
 */
import { useEffect } from 'react';
import { ArrowLeft, FileText, Shield, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SbsLogo } from '@/components/ui/SbsLogo';
import type { Screen } from '@/lib/types';

interface LegalProps {
  onNavigate: (s: Screen) => void;
}

export function Legal({ onNavigate }: LegalProps) {
  // Scroll vers l'ancre si présente dans l'URL au chargement (router ne le fait pas par défaut)
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, []);

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
          Informations légales
        </h1>
        <p className="mt-3 text-sbs-muted">
          SideBySide est en phase bêta. Ces documents sont une <strong>première version
          honnête</strong> et seront enrichis avant le lancement commercial — notamment
          après audit juridique au Cameroun et en Union européenne.
        </p>

        {/* Sommaire */}
        <nav className="mt-8 grid gap-2 rounded-card-lg border border-sbs-border bg-white p-4 sm:grid-cols-3">
          <a href="#terms" className="flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-bold text-sbs-blue hover:bg-sbs-blue-light">
            <FileText className="h-4 w-4" /> Conditions générales
          </a>
          <a href="#privacy" className="flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-bold text-sbs-blue hover:bg-sbs-blue-light">
            <Shield className="h-4 w-4" /> Confidentialité
          </a>
          <a href="#cookies" className="flex items-center gap-2 rounded-btn px-3 py-2 text-sm font-bold text-sbs-blue hover:bg-sbs-blue-light">
            <Cookie className="h-4 w-4" /> Cookies
          </a>
        </nav>

        {/* CGU */}
        <section id="terms" className="mt-12 scroll-mt-24">
          <h2 className="font-display text-2xl font-extrabold text-sbs-dark">
            1. Conditions générales d'utilisation
          </h2>
          <p className="mt-1 text-xs text-sbs-muted">Dernière mise à jour : 2026-06-07</p>

          <div className="prose-sbs mt-5 space-y-4 text-sm leading-relaxed text-sbs-dark">
            <p>
              <strong>SideBySide</strong> est un service de mise en relation entre conducteurs
              et passagers pour le partage de trajets interurbains au Cameroun. L'éditeur du
              service est joignable à <a href="mailto:contact@sidebyside.cm" className="text-sbs-blue underline">contact@sidebyside.cm</a>.
            </p>
            <p>
              En t'inscrivant et en utilisant SideBySide, tu acceptes :
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>De fournir des informations exactes (identité, numéro de téléphone, CNI pour les chauffeurs).</li>
              <li>De respecter les autres utilisateurs (politesse, ponctualité, propreté du véhicule).</li>
              <li>De ne pas utiliser la plateforme pour du transport public commercial non déclaré.</li>
              <li>Que SideBySide est <strong>un intermédiaire</strong> et non un transporteur : la responsabilité du trajet incombe au conducteur.</li>
            </ul>
            <p>
              SideBySide se réserve le droit de suspendre tout compte présentant des
              comportements abusifs (faux profil, agressivité, fraude au paiement, signalements
              répétés).
            </p>
            <p className="rounded-card border border-sbs-yellow/40 bg-sbs-yellow-light px-4 py-3 text-sbs-dark">
              <strong>Version bêta :</strong> les conditions tarifaires (commission, frais de
              service) pourront évoluer avec un préavis de 30 jours. Tu seras notifié·e par
              email à toute modification substantielle.
            </p>
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="mt-16 scroll-mt-24">
          <h2 className="font-display text-2xl font-extrabold text-sbs-dark">
            2. Politique de confidentialité
          </h2>
          <p className="mt-1 text-xs text-sbs-muted">Dernière mise à jour : 2026-06-07</p>

          <div className="prose-sbs mt-5 space-y-4 text-sm leading-relaxed text-sbs-dark">
            <p>
              <strong>Données collectées :</strong>
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>Identité : prénom, nom, date de naissance, numéro de téléphone, email.</li>
              <li>Pièces justificatives : CNI (recto/verso), selfie, permis et carte grise (chauffeurs uniquement).</li>
              <li>Données de trajet : itinéraire, horaires, paiements, échanges de messagerie (numéros masqués automatiquement).</li>
              <li>Données techniques : adresse IP, type d'appareil, journaux de connexion (à des fins de sécurité).</li>
            </ul>
            <p>
              <strong>Finalités :</strong> fournir le service de covoiturage, vérifier l'identité,
              prévenir la fraude, te contacter en cas d'incident, améliorer l'expérience.
            </p>
            <p>
              <strong>Durée de conservation :</strong> les données du compte sont conservées tant
              que le compte est actif, puis 36 mois après la dernière connexion (obligations
              comptables et anti-fraude). Les pièces d'identité sont supprimées 12 mois après la
              clôture du compte.
            </p>
            <p>
              <strong>Tes droits :</strong> tu peux à tout moment accéder à tes données, les
              corriger, les exporter ou demander leur suppression en écrivant à <a href="mailto:contact@sidebyside.cm" className="text-sbs-blue underline">contact@sidebyside.cm</a>.
              Pour l'Union européenne : tu peux saisir l'autorité de contrôle compétente (CNIL en
              France, APD en Belgique) en cas de litige.
            </p>
            <p>
              <strong>Hébergement :</strong> les données sont hébergées dans l'Union européenne
              (région Francfort) pour garantir une latence acceptable au Cameroun et un cadre
              juridique RGPD strict.
            </p>
            <p className="rounded-card border border-sbs-yellow/40 bg-sbs-yellow-light px-4 py-3 text-sbs-dark">
              <strong>Version bêta :</strong> la politique sera mise à jour après l'audit RGPD
              prévu avant le lancement commercial.
            </p>
          </div>
        </section>

        {/* Cookies */}
        <section id="cookies" className="mt-16 scroll-mt-24">
          <h2 className="font-display text-2xl font-extrabold text-sbs-dark">
            3. Cookies et traceurs
          </h2>
          <p className="mt-1 text-xs text-sbs-muted">Dernière mise à jour : 2026-06-07</p>

          <div className="prose-sbs mt-5 space-y-4 text-sm leading-relaxed text-sbs-dark">
            <p>
              SideBySide utilise des cookies strictement nécessaires au fonctionnement du
              service (session, préférence de langue, sécurité). Ces cookies sont posés sans
              consentement préalable car ils sont indispensables au service.
            </p>
            <p>
              <strong>Analytics :</strong> nous prévoyons d'utiliser <a href="https://plausible.io" target="_blank" rel="noopener noreferrer" className="text-sbs-blue underline">Plausible Analytics</a>,
              un outil européen sans cookie ni traçage individuel, pour mesurer la fréquentation
              du site sans collecter de données personnelles.
            </p>
            <p>
              <strong>Pas de cookies publicitaires</strong> : nous ne posons aucun cookie de
              régie publicitaire ou de réseau social tiers.
            </p>
          </div>
        </section>

        <div className="mt-16 rounded-card-lg border border-sbs-border bg-white p-6 text-center">
          <p className="text-sm text-sbs-muted">
            Une question sur ces documents ?
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => onNavigate('contact')}
            className="mt-3 rounded-pill"
          >
            Nous contacter
          </Button>
        </div>
      </main>
    </div>
  );
}

export default Legal;
