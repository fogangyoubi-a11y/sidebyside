/**
 * DiasporaLanding — landing page pour la diaspora camerounaise.
 *
 * Ton familial chaleureux ("tu"), positionnement émotionnel.
 * Cible : Camerounais en Europe/USA/Canada qui veulent offrir
 *         un trajet sûr à un proche au pays.
 *
 * Structure (7 sections) :
 *   1. Hero
 *   2. Le problème (miroir émotionnel)
 *   3. La solution en 3 étapes
 *   4. 4 différenciateurs (pourquoi nous)
 *   5. 4 témoignages
 *   6. FAQ (7 questions)
 *   7. CTA final + Newsletter
 *   + Footer signature humaine
 */
import {
  ArrowRight,
  Heart,
  ShieldCheck,
  CreditCard,
  Smartphone,
  PhoneCall,
  MapPin,
  UserCheck,
  Wallet,
  CheckCircle2,
  Globe2,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { Avatar } from '@/components/ui/Avatar';
import { PayPalLogo } from '@/components/ui/PayPalLogo';
import { NewsletterForm } from '@/components/diaspora/NewsletterForm';
import { FAQAccordion, type FAQItem } from '@/components/diaspora/FAQAccordion';
import { cn } from '@/lib/utils';
import { formatEUR, cfaToEur, formatCFA } from '@/lib/currency';
import { setDiasporaFlow } from '@/lib/diasporaFlow';
import type { Screen } from '@/lib/types';

interface DiasporaLandingProps {
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}

export function DiasporaLanding({ onNavigate }: DiasporaLandingProps) {
  /**
   * Démarre le flow "offrir un trajet" :
   *  1. Pose le flag diaspora en sessionStorage (survie a la navigation)
   *  2. Envoie l'utilisateur sur /search pour qu'il CHOISISSE son trajet
   *     (axe, jour, chauffeur) AVANT de remplir le formulaire beneficiaire
   *
   * Le mode 'gift' sera automatiquement pre-selectionne dans Booking
   * grace au flag sessionStorage, sans avoir besoin de propager
   * ?mode=gift dans toutes les URLs intermediaires.
   */
  function startGiftFlow() {
    setDiasporaFlow();
    onNavigate('search');
  }

  /** Scroll fluide vers une ancre de la page. */
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen bg-sbs-cream">
      <DiasporaHeader onNavigate={onNavigate} />
      <Hero onCtaPrimary={startGiftFlow} onCtaSecondary={() => scrollTo('how')} />
      <Problem />
      <Solution id="how" />
      <Differentiators />
      <Testimonials />
      <FAQ />
      <FinalCTA onCtaPrimary={startGiftFlow} />
      <DiasporaFooter onNavigate={onNavigate} />
    </div>
  );
}

/* ============================================================
   HEADER — marketing simplifié (pas de bottom nav, pas de SOS)
   ============================================================ */

function DiasporaHeader({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-sbs-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2"
          aria-label="Retour à l'accueil SideBySide"
        >
          <SbsLogo size="sm" />
          <div className="leading-tight">
            <div className="font-display text-base font-extrabold tracking-tight text-sbs-dark">
              SideBySide
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-blue">
              Diaspora
            </div>
          </div>
        </button>

        <nav className="hidden items-center gap-1 sm:flex">
          <a
            href="#how"
            className="rounded-pill px-3 py-2 text-xs font-semibold text-sbs-muted hover:bg-sbs-border-soft hover:text-sbs-dark"
          >
            Comment ça marche
          </a>
          <a
            href="#why"
            className="rounded-pill px-3 py-2 text-xs font-semibold text-sbs-muted hover:bg-sbs-border-soft hover:text-sbs-dark"
          >
            Pourquoi nous
          </a>
          <a
            href="#faq"
            className="rounded-pill px-3 py-2 text-xs font-semibold text-sbs-muted hover:bg-sbs-border-soft hover:text-sbs-dark"
          >
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="rounded-pill px-3 py-2 text-xs font-bold text-sbs-blue hover:bg-sbs-blue-light sm:px-4 sm:text-sm"
          >
            Se connecter
          </button>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   HERO
   ============================================================ */

function Hero({
  onCtaPrimary,
  onCtaSecondary,
}: {
  onCtaPrimary: () => void;
  onCtaSecondary: () => void;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sbs-blue via-sbs-blue to-sbs-blue-dark text-white">
      {/* Décor : cercles flous */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sbs-yellow/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Texte */}
          <div>
            <Badge
              className="mb-5 border-white/20 bg-white/10 text-xs text-white backdrop-blur"
            >
              🇨🇲 Spécial diaspora camerounaise
            </Badge>

            <h1 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Pour que maman voyage en sécurité,
              <br />
              <span className="text-sbs-yellow">
                même quand tu es à 6 000 km.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:mt-6 sm:text-lg">
              Tu réserves depuis ton canapé en Belgique, en France, au Canada.
              Tu choisis le chauffeur. Tu payes en euros. Et quand ta maman arrive
              à destination, tu reçois un message — pour que cette nuit-là,
              tu dormes enfin tranquille.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-9">
              <Button
                variant="accent"
                size="lg"
                onClick={onCtaPrimary}
                className="rounded-pill px-7"
              >
                <span>Offrir un trajet maintenant</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onCtaSecondary}
                className="rounded-pill"
              >
                Voir comment ça marche
              </Button>
            </div>

            {/* Trust strip */}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-white/70 sm:text-xs">
              <span className="flex items-center gap-1.5">
                <PayPalLogo className="h-3.5" /> PayPal
              </span>
              <span>·</span>
              <span>Visa</span>
              <span>·</span>
              <span>Mastercard</span>
              <span>·</span>
              <span>Bancontact</span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Chauffeurs vérifiés CNI
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" /> Suivi en temps réel
              </span>
            </div>
          </div>

          {/* Visuel — carte de réservation simulée */}
          <div className="relative">
            <HeroCard />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Carte simulant une confirmation de réservation. */
function HeroCard() {
  return (
    <div className="relative mx-auto max-w-md">
      <div className="rounded-card-lg border border-white/20 bg-white p-5 shadow-card-hover sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <Badge tone="green" className="text-[10px]">
            ✓ Trajet réservé
          </Badge>
          <span className="text-[10px] font-bold text-sbs-muted">SBS-X9F2-K47A</span>
        </div>

        <div className="mb-4 rounded-card bg-sbs-blue-light p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-blue">
            Trajet offert à
          </div>
          <div className="mt-1 font-display text-lg font-extrabold text-sbs-dark">
            Maman Akamba 💛
          </div>
          <div className="mt-0.5 text-[11px] text-sbs-muted">+237 6XX XX XX 47 · CNI vérifiée</div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sbs-blue text-white">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-muted">
                Départ — Demain 06h30
              </div>
              <div className="text-sm font-bold text-sbs-dark">Douala · Bonamoussadi</div>
            </div>
          </div>
          <div className="ml-3.5 h-5 w-px bg-sbs-border" />
          <div className="flex items-start gap-2.5">
            <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sbs-yellow text-sbs-dark">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-muted">
                Arrivée — Demain 10h30
              </div>
              <div className="text-sm font-bold text-sbs-dark">Bafoussam · Carrefour Akwa</div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-card border border-sbs-border bg-sbs-cream/50 p-3">
          <div className="flex items-center gap-2">
            <Avatar name="Achille N." size="sm" />
            <div className="flex-1 leading-tight">
              <div className="text-xs font-bold text-sbs-dark">Achille N. · ⭐ 4.9</div>
              <div className="text-[10px] text-sbs-muted">Toyota Camry 2022 · Premium VIP</div>
            </div>
            <Badge tone="green" className="text-[10px]">
              Vérifié
            </Badge>
          </div>
        </div>

        <div className="mt-4 border-t border-sbs-border pt-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-muted">
              Payé via PayPal
            </div>
            <div className="font-display text-lg font-extrabold text-sbs-dark">
              {formatEUR(cfaToEur(5000))}
            </div>
          </div>
          <div className="mt-0.5 text-right text-[10px] text-sbs-muted">
            ≈ {formatCFA(5000)} · taux fixe garanti
          </div>
        </div>
      </div>

      {/* Petit ticket flottant "Confirmation reçue" */}
      <div className="absolute -bottom-3 -right-3 hidden rounded-card border border-sbs-green/30 bg-white p-3 shadow-card sm:block">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-sbs-green/15 text-sbs-green">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-[10px] font-bold text-sbs-green">Arrivée confirmée</div>
            <div className="text-[10px] text-sbs-muted">il y a 2 min</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SECTION 2 — LE PROBLÈME
   ============================================================ */

function Problem() {
  return (
    <section className="border-b border-sbs-border bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <Badge tone="red" className="mb-3">
            Le vrai sujet
          </Badge>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-sbs-dark sm:text-4xl">
            Tu connais cette angoisse.
          </h2>
        </div>

        <div className="mt-10 space-y-5 text-base leading-relaxed text-sbs-dark sm:text-lg">
          <p>
            Ta maman doit faire <strong>Douala–Bafoussam</strong> pour aller au village.
          </p>
          <p>
            Ton petit frère prend la route pour rentrer voir les parents.
          </p>
          <p>
            Ta tante remonte sur <strong>Bamenda</strong> pour un enterrement.
          </p>
          <p className="font-display text-xl font-extrabold sm:text-2xl">
            Toi, tu es à Bruxelles. À Paris. À Montréal. À Berlin.
          </p>

          <div className="rounded-card-lg border border-sbs-border bg-sbs-cream/60 p-5 sm:p-6">
            <p className="font-bold text-sbs-dark">
              Tu lui envoies de l'argent sur MoMo. Mais après ?
            </p>
            <ul className="mt-3 space-y-2 text-sm text-sbs-muted sm:text-base">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-sbs-red">—</span>
                <span>Tu ne sais pas dans quel car elle va monter.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-sbs-red">—</span>
                <span>Tu ne sais pas si le chauffeur est sérieux.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-sbs-red">—</span>
                <span>Tu ne sais pas si la voiture est en état.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-sbs-red">—</span>
                <span>Tu pries. Tu attends son appel. Tu ne dors pas.</span>
              </li>
            </ul>
          </div>

          <p className="text-center font-display text-lg font-extrabold text-sbs-blue sm:text-xl">
            Cette nuit-là, tu n'as aucun contrôle.
            <br />
            Et tu te sens loin. Très loin.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 3 — LA SOLUTION (3 étapes + bonus)
   ============================================================ */

const STEPS = [
  {
    n: '1',
    icon: MapPin,
    duration: '2 min',
    title: 'Tu choisis le trajet',
    body:
      "Depuis chez toi en Europe ou en Amérique, tu parcours les trajets disponibles : Douala–Bafoussam, Yaoundé–Bamenda, Douala–Limbé… Tu vois la voiture, la note du chauffeur, son nombre de trajets. Tu choisis.",
  },
  {
    n: '2',
    icon: UserCheck,
    duration: '1 min',
    title: 'Tu renseignes ton proche',
    body:
      "Nom, téléphone camerounais, photo de sa CNI. C'est obligatoire — et c'est ta garantie : le chauffeur vérifie la pièce d'identité au point de rendez-vous, comme dans un aéroport. Aucun risque qu'on prenne sa place.",
  },
  {
    n: '3',
    icon: CreditCard,
    duration: '30 sec',
    title: 'Tu payes en euros',
    body:
      "PayPal, Visa, Mastercard, Bancontact. Pas besoin de chercher MoMo international. Tu payes comme tu paies ta facture Netflix. Et ton paiement est protégé : remboursé intégralement si le trajet n'a pas lieu.",
  },
];

function Solution({ id }: { id: string }) {
  return (
    <section id={id} className="border-b border-sbs-border bg-sbs-cream">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="blue" className="mb-3">
            La solution
          </Badge>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-sbs-dark sm:text-4xl">
            SideBySide change tout.
            <br />
            Voici comment.
          </h2>
          <p className="mt-3 text-base text-sbs-muted sm:text-lg">
            En 3 étapes, tu reprends la main.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.n}
                className="relative rounded-card-lg border border-sbs-border bg-white p-6 shadow-soft transition-all hover:shadow-card-hover"
              >
                <div className="absolute -top-3 left-6 grid h-7 min-w-7 place-items-center rounded-pill bg-sbs-blue px-2 font-display text-xs font-extrabold text-white">
                  Étape {step.n}
                </div>
                <div className="mb-3 mt-2 grid h-12 w-12 place-items-center rounded-card bg-sbs-blue-light text-sbs-blue">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-yellow-dark">
                  ⏱ {step.duration}
                </div>
                <h3 className="mt-1 font-display text-lg font-extrabold text-sbs-dark">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-sbs-muted">{step.body}</p>
              </div>
            );
          })}
        </div>

        {/* Bonus : confirmation */}
        <div className="mt-6 rounded-card-lg border-2 border-dashed border-sbs-green/40 bg-sbs-green/5 p-6 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-card bg-sbs-green/15 text-sbs-green">
              <Heart className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-green">
                Bonus inclus
              </div>
              <h3 className="mt-0.5 font-display text-lg font-extrabold text-sbs-dark sm:text-xl">
                Tu reçois la confirmation d'arrivée
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-sbs-dark sm:text-base">
                Dès que ton proche arrive à destination, tu reçois{' '}
                <strong>un SMS et un message dans l'app</strong>. L'heure exacte d'arrivée.
                Tu peux enfin appeler ta mère pour lui dire <em>"maman, j'ai vu que tu es bien arrivée"</em> —
                sans qu'elle ait eu à te le dire.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 4 — POURQUOI NOUS (4 différenciateurs)
   ============================================================ */

const DIFFERENTIATORS = [
  {
    icon: ShieldCheck,
    title: 'Chauffeurs vérifiés à 100%',
    body:
      "CNI scannée. Selfie comparée. Permis vérifié. Historique propre. Aucun chauffeur sur SideBySide n'a échappé à notre processus KYC. Et si la moindre alerte tombe — on l'exclut. Sans négociation.",
    color: 'bg-sbs-blue-light text-sbs-blue',
  },
  {
    icon: CreditCard,
    title: 'Paiement en euros, protégé',
    body:
      "Tu payes avec ta carte ou ton PayPal européen — aucun frais de change caché. Et si le trajet est annulé, tu es remboursé intégralement en 48h sur ton moyen de paiement. Aucun risque pour ton argent.",
    color: 'bg-sbs-yellow-light text-sbs-yellow-dark',
  },
  {
    icon: Smartphone,
    title: 'Le numéro de ton proche masqué',
    body:
      "Ton proche ne donne jamais son vrai numéro au chauffeur. Tous les échanges passent par notre app sécurisée, avec masquage automatique. Pas d'appels intempestifs après le trajet. Jamais.",
    color: 'bg-sbs-blue-light text-sbs-blue',
  },
  {
    icon: PhoneCall,
    title: 'SOS intégré dans l\'app',
    body:
      "Un bouton d'urgence accessible à tout moment du trajet : police 117, gendarmerie 113, ambulance 119, support SideBySide. La position GPS est partagée automatiquement. Ton proche n'est jamais seul, même sur la route.",
    color: 'bg-sbs-yellow-light text-sbs-yellow-dark',
  },
];

function Differentiators() {
  return (
    <section id="why" className="border-b border-sbs-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="yellow" className="mb-3">
            Ce qui nous différencie
          </Badge>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-sbs-dark sm:text-4xl">
            Pourquoi des Camerounais de la diaspora
            <br />
            nous font déjà confiance.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {DIFFERENTIATORS.map((d) => {
            const Icon = d.icon;
            return (
              <div
                key={d.title}
                className="rounded-card-lg border border-sbs-border bg-white p-6 shadow-soft transition-all hover:border-sbs-blue/30 hover:shadow-card"
              >
                <div className={cn('mb-3 grid h-12 w-12 place-items-center rounded-card', d.color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-extrabold text-sbs-dark sm:text-xl">
                  {d.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-sbs-muted sm:text-base">{d.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 5 — TÉMOIGNAGES
   ============================================================ */

const TESTIMONIALS = [
  {
    flag: '🇧🇪',
    name: 'Aïcha',
    age: 38,
    city: 'Bruxelles',
    quote:
      "Ma maman vit à Mbouda. Avant, à chaque déplacement, je passais la nuit blanche. Avec SideBySide, je vois la voiture, je vois le chauffeur, je reçois un message quand elle arrive. C'est exactement ce que je voulais depuis 10 ans, mais personne ne le proposait.",
    rating: 5,
  },
  {
    flag: '🇫🇷',
    name: 'Patrick',
    age: 42,
    city: 'Paris',
    quote:
      "J'ai offert un trajet à mon petit frère étudiant pour qu'il rentre voir nos parents à Bafoussam. Il m'a appelé après en me disant 'frère, la voiture c'était une vraie berline, j'ai cru que c'était pour les ministres.' On a ri pendant 1 heure. C'est ça que je veux pour ma famille.",
    rating: 5,
  },
  {
    flag: '🇨🇦',
    name: 'Sandra',
    age: 35,
    city: 'Montréal',
    quote:
      "Le truc que j'apprécie : je paye en CAD avec ma carte canadienne, pas besoin de me battre avec les transferts MoMo. Et l'app est en français, claire, design moderne. On dirait pas une app camerounaise — on dirait une vraie app internationale, mais faite par chez nous.",
    rating: 5,
  },
  {
    flag: '🇩🇪',
    name: 'Joël',
    age: 29,
    city: 'Berlin',
    quote:
      "Ma sœur s'est mariée en décembre. Je n'ai pas pu rentrer, mais j'ai réservé une Premium VIP pour qu'elle et ma mère aillent à l'église en confort. Le chauffeur les a attendues 3 heures gratuitement après la cérémonie. C'est ça la différence entre SideBySide et un taxi.",
    rating: 5,
  },
];

function Testimonials() {
  return (
    <section className="border-b border-sbs-border bg-sbs-cream">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Badge tone="blue" className="mb-3">
            Ils racontent
          </Badge>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-sbs-dark sm:text-4xl">
            Ils l'ont fait. Ils racontent.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="rounded-card-lg border border-sbs-border bg-white p-5 shadow-soft transition-all hover:shadow-card sm:p-6"
            >
              <div className="flex items-start gap-3">
                <Avatar name={t.name} size="lg" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-extrabold text-sbs-dark">
                      {t.name}, {t.age} ans
                    </span>
                    <span className="text-lg">{t.flag}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-sbs-muted">{t.city}</div>
                  <div className="mt-0.5 flex items-center gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-sbs-yellow text-sbs-yellow" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm italic leading-relaxed text-sbs-dark sm:text-base">
                « {t.quote} »
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 6 — FAQ
   ============================================================ */

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'no-smartphone',
    question: 'Et si mon proche n\'a pas de smartphone ?',
    answer: (
      <p>
        Pas de problème. Il reçoit son code de réservation par <strong>SMS classique</strong>.
        Le chauffeur l'identifie avec sa CNI au point de rendez-vous.
        <strong> Aucune appli requise côté bénéficiaire.</strong>
      </p>
    ),
  },
  {
    id: 'driver-serious',
    question: 'Comment je sais que le chauffeur est sérieux ?',
    answer: (
      <p>
        Chaque chauffeur passe par notre <strong>KYC complet</strong> : CNI scannée,
        selfie biométrique comparée, permis de conduire, photos du véhicule, note
        cumulée par les passagers. Les chauffeurs qui descendent sous 4.5/5 sont
        avertis. <strong>Sous 4/5, ils sont exclus.</strong>
      </p>
    ),
  },
  {
    id: 'cancellation-driver',
    question: 'Et si le chauffeur annule à la dernière minute ?',
    answer: (
      <p>
        Tu es notifié immédiatement. Soit on te propose un autre chauffeur sur
        le même créneau (souvent en moins d'1h), soit tu es{' '}
        <strong>remboursé intégralement en 48h</strong> sur ton moyen de paiement.
      </p>
    ),
  },
  {
    id: 'price-vs-agence',
    question: 'Combien ça coûte par rapport à une agence classique ?',
    answer: (
      <p>
        Entre <strong>+15% et +50%</strong> selon la catégorie choisie
        (Économique, Confort, Premium VIP). En échange : confort d'une voiture
        privée, chauffeur vérifié, suivi en temps réel, et tu n'as pas à
        coordonner depuis 6 000 km.
      </p>
    ),
  },
  {
    id: 'axes',
    question: 'Vous opérez sur quels axes ?',
    answer: (
      <p>
        Aujourd'hui : <strong>Douala ↔ Bafoussam</strong> en priorité. Bientôt :
        Yaoundé ↔ Douala, Douala ↔ Limbé, Yaoundé ↔ Bamenda.
        <strong> Inscris-toi à la newsletter</strong> pour être prévenu de
        l'ouverture de ton axe.
      </p>
    ),
  },
  {
    id: 'payment-security',
    question: 'Est-ce sécurisé pour mes paiements ?',
    answer: (
      <p>
        Oui. Nous utilisons les standards bancaires européens (PCI-DSS pour la
        carte, PayPal pour PayPal, Bancontact pour la Belgique).{' '}
        <strong>Aucune coordonnée bancaire n'est stockée sur nos serveurs.</strong>
      </p>
    ),
  },
  {
    id: 'cancellation-me',
    question: 'Et si je veux annuler ?',
    answer: (
      <p>
        Jusqu'à 24h avant : <strong>remboursement intégral</strong>. Entre 24h et
        2h : <strong>80%</strong>. Moins de 2h ou no-show : non remboursable. Tu
        vois le détail au moment de réserver.
      </p>
    ),
  },
];

function FAQ() {
  return (
    <section id="faq" className="border-b border-sbs-border bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <Badge tone="yellow" className="mb-3">
            Questions courantes
          </Badge>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-sbs-dark sm:text-4xl">
            Tes questions. Nos réponses.
          </h2>
        </div>

        <div className="mt-10">
          <FAQAccordion items={FAQ_ITEMS} defaultOpenId="no-smartphone" />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 7 — CTA FINAL + NEWSLETTER
   ============================================================ */

function FinalCTA({ onCtaPrimary }: { onCtaPrimary: () => void }) {
  return (
    <section className="bg-gradient-to-br from-sbs-cream via-sbs-cream to-sbs-blue-light/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
        {/* Bloc CTA principal */}
        <div className="flex flex-col justify-center">
          <Badge tone="red" className="mb-4 self-start">
            Pour finir
          </Badge>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-sbs-dark sm:text-4xl lg:text-5xl">
            Ta famille mérite mieux
            <br />
            <span className="text-sbs-blue">qu'une nuit blanche.</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-sbs-muted sm:text-lg">
            Offre un trajet aujourd'hui. Ou inscris-toi pour être le premier
            prévenu quand on ouvre <strong className="text-sbs-dark">Yaoundé</strong>,
            <strong className="text-sbs-dark"> Bamenda</strong>,
            <strong className="text-sbs-dark"> Limbé</strong> et les autres axes.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={onCtaPrimary}
              className="rounded-pill px-7"
            >
              <span>Offrir un trajet maintenant</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <a
              href="#newsletter"
              className="inline-flex items-center gap-2 rounded-pill border border-sbs-border bg-white px-5 py-3 font-display text-sm font-bold text-sbs-blue transition-colors hover:border-sbs-blue/40 hover:bg-sbs-blue-light"
            >
              <Globe2 className="h-4 w-4" />
              <span>Recevoir les actus</span>
            </a>
          </div>
        </div>

        {/* Bloc newsletter */}
        <div id="newsletter" className="rounded-card-lg border border-sbs-border bg-white p-6 shadow-card sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-card bg-sbs-blue text-white">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-extrabold text-sbs-dark sm:text-xl">
                Newsletter diaspora
              </h3>
              <p className="text-[11px] text-sbs-muted">
                Sois prévenu·e à l'ouverture de nouveaux axes.
              </p>
            </div>
          </div>

          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */

function DiasporaFooter({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <footer className="bg-sbs-blue-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-3">
              <SbsLogo size="md" />
              <div>
                <div className="font-display text-lg font-extrabold tracking-tight">
                  SideBySide
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-sbs-yellow">
                  Le pont entre toi et eux.
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Construit avec <span className="text-sbs-red">♥</span> depuis Bruxelles
              pour la diaspora camerounaise, par des Camerounais qui vivent la même chose
              que toi.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-sbs-yellow">
                Navigation
              </div>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('landing')}
                    className="hover:text-white"
                  >
                    Accueil principal
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('search')}
                    className="hover:text-white"
                  >
                    Rechercher un trajet
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="hover:text-white"
                  >
                    Se connecter
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('onboarding')}
                    className="hover:text-white"
                  >
                    Créer un compte
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-sbs-yellow">
                Légal
              </div>
              <ul className="space-y-2 text-sm text-white/80">
                <li><span className="opacity-60">Conditions générales</span></li>
                <li><span className="opacity-60">Politique de confidentialité</span></li>
                <li><span className="opacity-60">Nous contacter</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-[11px] text-white/50">
          © 2026 SideBySide · Bruxelles 🇧🇪 ↔ Douala 🇨🇲
        </div>
      </div>
    </footer>
  );
}

// Default export pour React.lazy() dans App.tsx
export default DiasporaLanding;
