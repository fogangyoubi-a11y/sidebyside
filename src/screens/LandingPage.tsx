import { useState } from 'react';
import { MapPin, Shield, Wallet, MessageCircle, Star, ArrowRight, Smartphone, Users, Search, Car } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { Avatar } from '@/components/ui/Avatar';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { Screen } from '@/lib/types';

interface LandingPageProps {
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { isAuthenticated } = useAuth();
  const [authGate, setAuthGate] = useState<null | { action: string; target: Screen }>(null);

  /**
   * Si l'utilisateur n'est pas connecté, ouvre la popup "J'ai déjà un compte / Créer un compte".
   * Sinon, navigue directement vers l'écran cible.
   */
  function navigateGated(target: Screen, action: string) {
    if (isAuthenticated) {
      onNavigate(target);
    } else {
      setAuthGate({ action, target });
    }
  }

  return (
    <div className="min-h-screen bg-sbs-cream">
      <LandingHeader onNavigate={onNavigate} />
      <Hero onNavigate={onNavigate} navigateGated={navigateGated} />
      <TrustBar />
      <HowItWorks />
      <RoutesSection onNavigate={onNavigate} />
      <DriverCTA onNavigate={onNavigate} navigateGated={navigateGated} />
      <Testimonials />
      <FinalCTA onNavigate={onNavigate} />
      <Footer />

      {/* Modal d'auth gate — partagé pour toutes les actions qui requièrent un compte */}
      {authGate && (
        <AuthGateModal
          action={authGate.action}
          onClose={() => setAuthGate(null)}
          onLogin={() => {
            setAuthGate(null);
            onNavigate('login');
          }}
          onRegister={() => {
            setAuthGate(null);
            onNavigate('onboarding');
          }}
        />
      )}
    </div>
  );
}

type NavigateGated = (target: Screen, action: string) => void;

/* ----------------------------- HEADER ----------------------------- */

function LandingHeader({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-sbs-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5"
          aria-label="Accueil SideBySide"
        >
          <SbsLogo size="md" />
          <div className="text-left leading-tight">
            <div className="font-display text-base font-extrabold tracking-tight sm:text-lg">
              Side<span className="text-sbs-yellow-dark">By</span>Side
            </div>
            <div className="hidden text-[10px] uppercase tracking-[0.18em] text-sbs-muted sm:block">
              Covoiturage Cameroun
            </div>
          </div>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          <NavItem label="Comment ça marche" target="how" />
          <NavItem label="Trajets" target="routes" />
          <NavItem label="Devenir chauffeur" target="driver" />
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('messages')}
            aria-label="Messagerie"
            className="relative grid h-10 w-10 place-items-center rounded-pill border border-sbs-border text-sbs-dark transition-colors hover:bg-sbs-border-soft"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-sbs-red px-1 text-[9px] font-extrabold text-white shadow-soft">3</span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('auth')}
            className="hidden sm:inline-flex"
          >
            Connexion
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('onboarding')}
            className="rounded-pill"
          >
            S'inscrire
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function NavItem({ label, target }: { label: string; target: string }) {
  return (
    <a
      href={`#${target}`}
      className="rounded-pill px-3 py-2 text-sm font-medium text-sbs-muted transition-colors hover:bg-sbs-border-soft hover:text-sbs-dark"
    >
      {label}
    </a>
  );
}

/* ----------------------------- HERO ----------------------------- */

function Hero({ onNavigate, navigateGated }: { onNavigate: (s: Screen) => void; navigateGated: NavigateGated }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sbs-blue via-sbs-blue-dark to-sbs-dark text-white">
      {/* Pattern décoratif */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-sbs-yellow blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-sbs-blue blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-2 lg:py-28">
        {/* Texte */}
        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-sbs-yellow" />
            Disponible sur l'axe Douala – Bafoussam
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Voyagez <span className="text-sbs-yellow">côte à côte</span>,
            <br />
            partagez la route.
          </h1>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/80">
            La première plateforme de covoiturage interurbain au Cameroun.
            Trouvez un trajet, ou rentabilisez le vôtre — en toute confiance.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="accent"
              size="lg"
              onClick={() => onNavigate('search')}
              className="rounded-pill"
            >
              <Search className="h-5 w-5" />
              Chercher un trajet
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigateGated('publish-trip', 'publier un trajet en tant que chauffeur')}
              className="rounded-pill"
            >
              <Car className="h-5 w-5" />
              Publier un trajet
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-4 text-sm text-white/70">
            <div className="flex -space-x-2">
              {['Achille', 'Marlène', 'Joël', 'Émile'].map((n) => (
                <Avatar key={n} name={n} size="sm" className="ring-2 ring-sbs-blue-dark" />
              ))}
            </div>
            <span>
              <span className="font-bold text-white">+500</span> Camerounais voyagent déjà avec nous
            </span>
          </div>
        </div>

        {/* Mockup app */}
        <HeroMockup onNavigate={onNavigate} />
      </div>
    </section>
  );
}

function HeroMockup({ onNavigate }: { onNavigate: (s: Screen, params?: Record<string, string>) => void }) {
  /** Tous les "trajets" du mockup ouvrent la recherche Douala→Bafoussam. */
  const openSearch = () => onNavigate('search', { from: 'douala', to: 'bafoussam' });
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
      <div className="relative aspect-[9/16] overflow-hidden rounded-card-lg bg-white shadow-card-hover">
        {/* Header app */}
        <div className="flex items-center justify-between border-b border-sbs-border bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <SbsLogo size="sm" />
            <span className="font-display text-sm font-extrabold">SideBySide</span>
          </div>
          <span className="text-[10px] text-sbs-muted">09:24</span>
        </div>

        {/* Itinéraire — cliquable pour ouvrir la recherche */}
        <button
          type="button"
          onClick={openSearch}
          className="block w-full bg-sbs-blue-light/40 p-4 text-left transition-colors hover:bg-sbs-blue-light/70"
        >
          <div className="rounded-card bg-white p-3 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-sbs-blue ring-4 ring-sbs-blue/20" />
                <span className="h-8 w-0.5 border-l-2 border-dashed border-sbs-border" />
                <span className="h-3 w-3 rounded-full bg-sbs-yellow ring-4 ring-sbs-yellow/20" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-sbs-muted">Départ</div>
                <div className="text-sm font-bold text-sbs-dark">Douala</div>
                <div className="mt-3 text-xs text-sbs-muted">Arrivée</div>
                <div className="text-sm font-bold text-sbs-dark">Bafoussam</div>
              </div>
              <div className="text-right">
                <Badge tone="green">3 dispo</Badge>
              </div>
            </div>
          </div>
        </button>

        {/* Liste de trajets — chaque ligne cliquable */}
        <div className="space-y-2 p-3">
          {[
            { name: 'Achille N.', time: '06:30', price: 4000, rating: 4.8 },
            { name: 'Marlène T.', time: '09:00', price: 3500, rating: 4.9 },
            { name: 'Joël M.', time: '14:15', price: 3000, rating: 4.5 },
          ].map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={openSearch}
              className="flex w-full items-center gap-3 rounded-card border border-sbs-border p-2.5 text-left transition-all hover:border-sbs-blue/40 hover:bg-sbs-blue-light/30 active:scale-[0.98]"
            >
              <Avatar name={t.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-sbs-dark">{t.time}</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-sbs-muted">
                    <Star className="h-2.5 w-2.5 fill-sbs-yellow text-sbs-yellow" />
                    {t.rating}
                  </span>
                </div>
                <div className="truncate text-[11px] text-sbs-muted">{t.name}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-sm font-extrabold text-sbs-blue">
                  {t.price.toLocaleString('fr-FR')}
                </div>
                <div className="text-[9px] text-sbs-muted">F CFA</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -right-4 -top-4 rotate-6 rounded-card-lg bg-sbs-yellow px-3 py-2 text-sbs-dark shadow-card">
        <div className="font-display text-xs font-extrabold">−40 %</div>
        <div className="text-[9px] font-semibold">vs. agences</div>
      </div>
      <div className="absolute -bottom-4 -left-4 -rotate-3 rounded-card-lg bg-white px-3 py-2 shadow-card">
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-sbs-yellow text-sbs-yellow" />
          <Star className="h-3 w-3 fill-sbs-yellow text-sbs-yellow" />
          <Star className="h-3 w-3 fill-sbs-yellow text-sbs-yellow" />
          <Star className="h-3 w-3 fill-sbs-yellow text-sbs-yellow" />
          <Star className="h-3 w-3 fill-sbs-yellow text-sbs-yellow" />
        </div>
        <div className="text-[9px] font-semibold text-sbs-muted">4.8 · 500 avis</div>
      </div>
    </div>
  );
}

/* ----------------------------- TRUST BAR ----------------------------- */

function TrustBar() {
  const items = [
    { icon: Shield, label: 'Profils vérifiés', desc: 'CNI obligatoire pour chauffeurs' },
    { icon: Wallet, label: 'Paiement sécurisé', desc: 'MTN MoMo, Orange Money, carte' },
    { icon: MessageCircle, label: 'Chat intégré', desc: 'Numéros masqués, anonymat' },
    { icon: Star, label: 'Note communautaire', desc: 'Avis après chaque trajet' },
  ];
  return (
    <section className="border-b border-sbs-border bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-card-lg bg-sbs-blue-light text-sbs-blue">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-display text-sm font-extrabold text-sbs-dark">{label}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-sbs-muted">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- HOW IT WORKS ----------------------------- */

function HowItWorks() {
  const steps = [
    {
      icon: Smartphone,
      step: '01',
      title: "Créez votre compte",
      desc: "Inscription en 2 min avec votre numéro camerounais. Vérification par SMS.",
    },
    {
      icon: Search,
      step: '02',
      title: 'Cherchez ou publiez',
      desc: "Trouvez un trajet Douala–Bafoussam, ou proposez le vôtre si vous conduisez.",
    },
    {
      icon: Wallet,
      step: '03',
      title: 'Payez en Mobile Money',
      desc: "MTN MoMo ou Orange Money. Aucun cash à manipuler le jour du trajet.",
    },
    {
      icon: Car,
      step: '04',
      title: "Voyagez ensemble",
      desc: "Rencontrez votre chauffeur au point de RDV, et profitez du voyage !",
    },
  ];

  return (
    <section id="how" className="bg-sbs-cream py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <Badge tone="yellow">Simple, sécurisé, économique</Badge>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Comment ça marche ?
          </h2>
          <p className="mt-3 text-sbs-muted">
            En 4 étapes, vous êtes prêt à voyager malin entre Douala et Bafoussam.
          </p>
        </header>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, step, title, desc }, i) => (
            <div
              key={step}
              className={cn(
                'relative rounded-card-lg border bg-white p-6 shadow-soft transition-all hover:shadow-card-hover',
                i % 2 === 0 ? 'border-sbs-blue/10' : 'border-sbs-yellow/30',
              )}
            >
              <div
                className={cn(
                  'mb-4 grid h-14 w-14 place-items-center rounded-card-lg',
                  i % 2 === 0 ? 'bg-sbs-blue text-white' : 'bg-sbs-yellow text-sbs-dark',
                )}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div className="mb-1 font-mono text-xs font-bold text-sbs-muted">{step}</div>
              <h3 className="font-display text-lg font-extrabold text-sbs-dark">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-sbs-muted">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- ROUTES ----------------------------- */

function RoutesSection({ onNavigate }: { onNavigate: (s: Screen, params?: Record<string, string>) => void }) {
  const routes = [
    { from: 'Douala', to: 'Bafoussam', fromId: 'douala', toId: 'bafoussam', price: 3500, duration: '4 h 15', popular: true, available: true },
    { from: 'Bafoussam', to: 'Douala', fromId: 'bafoussam', toId: 'douala', price: 3500, duration: '4 h 00', popular: true, available: true },
    { from: 'Douala', to: 'Yaoundé', fromId: 'douala', toId: 'yaounde', price: 3000, duration: '3 h 30', popular: false, available: false },
    { from: 'Bafoussam', to: 'Bamenda', fromId: 'bafoussam', toId: 'bamenda', price: 2000, duration: '1 h 30', popular: false, available: false },
    { from: 'Douala', to: 'Kribi', fromId: 'douala', toId: 'kribi', price: 2500, duration: '2 h 45', popular: false, available: false },
    { from: 'Bafoussam', to: 'Dschang', fromId: 'bafoussam', toId: 'dschang', price: 1500, duration: '1 h 00', popular: false, available: false },
  ];

  return (
    <section id="routes" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <Badge tone="blue">Routes du Cameroun</Badge>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Notre axe Douala – Bafoussam
          </h2>
          <p className="mt-3 text-sbs-muted">
            On commence par cette route emblématique. D'autres axes arrivent bientôt.
          </p>
        </header>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((r) => {
            const inner = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <MapPin className="h-4 w-4 text-sbs-blue" />
                    {r.from}
                    <ArrowRight className="h-3.5 w-3.5 text-sbs-muted" />
                    {r.to}
                  </div>
                  {r.popular && <Badge tone="yellow">Populaire</Badge>}
                  {!r.available && <Badge tone="muted">Bientôt</Badge>}
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <div className="font-display text-xl font-extrabold text-sbs-dark">
                      {r.price.toLocaleString('fr-FR')} <span className="text-sm">F CFA</span>
                    </div>
                    <div className="text-[11px] text-sbs-muted">à partir de</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-sbs-dark">{r.duration}</div>
                    <div className="text-[11px] text-sbs-muted">durée estimée</div>
                  </div>
                </div>
              </>
            );

            if (r.available) {
              return (
                <button
                  key={`${r.from}-${r.to}`}
                  type="button"
                  onClick={() => onNavigate('search', { from: r.fromId, to: r.toId })}
                  className="rounded-card-lg border border-sbs-border bg-white p-5 text-left transition-all hover:border-sbs-blue/40 hover:shadow-card active:scale-[0.99]"
                >
                  {inner}
                </button>
              );
            }
            return (
              <div
                key={`${r.from}-${r.to}`}
                className="rounded-card-lg border border-dashed border-sbs-border bg-white p-5 opacity-70"
                title="Cette route arrive bientôt"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- DRIVER CTA ----------------------------- */

function DriverCTA({ navigateGated }: { onNavigate: (s: Screen) => void; navigateGated: NavigateGated }) {
  return (
    <section id="driver" className="bg-gradient-to-br from-sbs-yellow-light via-white to-sbs-blue-light py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge tone="yellow">Pour les conducteurs</Badge>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Rentabilisez chaque trajet
            </h2>
            <p className="mt-4 max-w-md text-sbs-muted">
              Vous faites régulièrement Douala–Bafoussam ? Partagez vos places vides
              et gagnez jusqu'à <strong className="text-sbs-dark">12 000 F CFA</strong> par voyage.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                { label: 'Vous fixez votre prix', desc: 'Entre 3 000 et 5 000 F CFA par place' },
                { label: 'Paiement automatique', desc: 'Vos gains directement en Mobile Money' },
                { label: 'Vous gardez la maîtrise', desc: 'Acceptez ou refusez chaque réservation' },
              ].map((it) => (
                <li key={it.label} className="flex gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sbs-green text-white">
                    <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,7 6,11 12,3" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-sm font-bold text-sbs-dark">{it.label}</div>
                    <div className="text-xs text-sbs-muted">{it.desc}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-7">
              <Button variant="primary" size="lg" onClick={() => navigateGated('publish-trip', 'publier votre premier trajet')} className="rounded-pill">
                <Car className="h-5 w-5" />
                Publier mon premier trajet
              </Button>
            </div>
          </div>

          {/* Calculatrice gains */}
          <div className="relative">
            <div className="rounded-card-lg border-2 border-sbs-yellow/40 bg-white p-6 shadow-card">
              <h3 className="font-display text-lg font-extrabold text-sbs-dark">
                💰 Estimation de vos gains
              </h3>
              <p className="mt-1 text-xs text-sbs-muted">
                Pour un trajet Douala–Bafoussam avec 3 passagers à 4 000 F CFA :
              </p>
              <dl className="mt-5 space-y-3">
                <Line label="Prix par passager" value="4 000 F CFA" />
                <Line label="Nombre de places" value="× 3" />
                <Line label="Sous-total" value="12 000 F CFA" />
                <Line label="Commission SideBySide" value="− 1 440 F CFA" subtle />
                <div className="border-t border-sbs-border pt-3" />
                <Line label="Vos gains nets" value="10 560 F CFA" highlight />
              </dl>
              <p className="mt-4 rounded-card bg-sbs-yellow-light px-3 py-2 text-center text-xs font-semibold text-sbs-dark">
                Soit ~ <strong>317 000 F CFA / mois</strong> pour 30 trajets
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Line({ label, value, highlight, subtle }: { label: string; value: string; highlight?: boolean; subtle?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className={cn('text-sm', subtle ? 'text-sbs-muted' : 'text-sbs-dark')}>{label}</dt>
      <dd
        className={cn(
          'font-display font-extrabold',
          highlight ? 'text-2xl text-sbs-green' : subtle ? 'text-sm text-sbs-muted' : 'text-base text-sbs-dark',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/* ----------------------------- TESTIMONIALS ----------------------------- */

function Testimonials() {
  const reviews = [
    {
      name: 'Solange F.',
      role: 'Passagère · Douala',
      rating: 5,
      text: "Première fois que je voyage sans stress vers Bafoussam ! Le chauffeur était ponctuel et l'app super claire.",
    },
    {
      name: 'Émile K.',
      role: 'Chauffeur · 5 ans',
      rating: 5,
      text: "Je fais ce trajet depuis 5 ans. Avec SideBySide je gagne 200 000 F CFA de plus par mois sans rien changer à mes habitudes.",
    },
    {
      name: 'Thierry M.',
      role: 'Étudiant · Bafoussam',
      rating: 4,
      text: "Les agences coûtent cher et durent une éternité. Là je paye moins et j'arrive plus vite. Top.",
    },
  ];

  return (
    <section className="bg-sbs-cream py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <Badge tone="blue">Ils en parlent</Badge>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            La voix de nos utilisateurs
          </h2>
        </header>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {reviews.map((r) => (
            <article
              key={r.name}
              className="flex flex-col gap-4 rounded-card-lg border border-sbs-border bg-white p-6 shadow-soft transition-all hover:shadow-card"
            >
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn('h-4 w-4', i < r.rating ? 'fill-sbs-yellow text-sbs-yellow' : 'text-sbs-border')}
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-sbs-dark">« {r.text} »</p>
              <div className="mt-auto flex items-center gap-3 border-t border-sbs-border-soft pt-4">
                <Avatar name={r.name} size="md" />
                <div>
                  <div className="text-sm font-bold text-sbs-dark">{r.name}</div>
                  <div className="text-xs text-sbs-muted">{r.role}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- FINAL CTA ----------------------------- */

function FinalCTA({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <section className="bg-sbs-blue py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <Users className="mx-auto h-10 w-10 text-sbs-yellow" />
        <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Rejoignez la communauté SideBySide
        </h2>
        <p className="mt-3 text-balance text-white/80">
          Voyager malin, économiser, rencontrer — le tout sans quitter le confort de votre voiture.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="accent" size="lg" onClick={() => onNavigate('onboarding')} className="rounded-pill">
            <Smartphone className="h-5 w-5" />
            Créer mon compte gratuit
          </Button>
          <Button variant="outline" size="lg" onClick={() => onNavigate('search')} className="rounded-pill">
            <Search className="h-5 w-5" />
            Explorer les trajets
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- FOOTER ----------------------------- */

function Footer() {
  return (
    <footer className="border-t border-sbs-border bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <SbsLogo size="md" />
              <span className="font-display text-lg font-extrabold">
                Side<span className="text-sbs-yellow-dark">By</span>Side
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-sbs-muted">
              La plateforme camerounaise de covoiturage interurbain. 🇨🇲
            </p>
          </div>

          <FooterCol
            title="Produit"
            links={['Comment ça marche', 'Trajets', 'Tarifs', 'Devenir chauffeur']}
          />
          <FooterCol
            title="Entreprise"
            links={['À propos', 'Blog', 'Carrières', 'Presse']}
          />
          <FooterCol
            title="Légal"
            links={["Conditions d'utilisation", 'Confidentialité', 'Cookies', 'Contact']}
          />
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-sbs-border pt-6 sm:flex-row">
          <p className="text-xs text-sbs-muted">© 2026 SideBySide · Tous droits réservés</p>
          <p className="text-xs text-sbs-muted">Made with ❤️ in Cameroon</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-extrabold text-sbs-dark">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-sm text-sbs-muted transition-colors hover:text-sbs-dark">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
