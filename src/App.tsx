import { lazy, Suspense } from 'react';
import { Routes, Route, useParams, useSearchParams, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LandingPage } from '@/screens/LandingPage';
import { SearchTrips } from '@/screens/SearchTrips';
import { Onboarding } from '@/screens/Onboarding';
import { Login } from '@/screens/Login';
import { ComingSoon } from '@/screens/ComingSoon';
import { TripDetail } from '@/screens/TripDetail';
import { Booking } from '@/screens/Booking';
import { PublishTrip } from '@/screens/PublishTrip';
import { Messages } from '@/screens/Messages';
import { MyTrips } from '@/screens/MyTrips';
import { Profile } from '@/screens/Profile';
import { DriverWalletScreen } from '@/screens/DriverWallet';
import { Legal } from '@/screens/Legal';
import { Contact } from '@/screens/Contact';
import { Admin } from '@/screens/Admin';
import { SeoHead } from '@/components/seo/SeoHead';
import { useScreenNavigate } from '@/lib/routing';
import { CountryProvider, DEFAULT_COUNTRY_ID } from '@/lib/country';
import { COUNTRIES } from '@/components/landing/CountrySelector';

// Code splitting : la landing diaspora n'est telechargee que si on visite /diaspora.
// Permet de ne pas alourdir le bundle des utilisateurs qui restent dans l'app.
const DiasporaLanding = lazy(() => import('@/screens/DiasporaLanding'));
import {
  SEO_LANDING, SEO_DIASPORA, SEO_ONBOARDING, SEO_LOGIN, SEO_SEARCH,
  SEO_TRIP_DETAIL, SEO_BOOKING, SEO_PUBLISH, SEO_MY_TRIPS, SEO_MESSAGES, SEO_PROFILE,
  SEO_LEGAL, SEO_CONTACT, SEO_ADMIN,
} from '@/lib/seo';

/* ============================================================
   Wrappers de routes
   ============================================================
   Chaque <Route> rend un mini composant qui :
   1. Récupère les params URL via useParams() + useSearchParams()
   2. Obtient le hook de navigation `navigate(screen, params)`
   3. Injecte les meta tags via <SeoHead> (SEO + Open Graph)
   4. Passe le tout en props au composant Screen historique

   → Les composants Screen restent inchangés (rétrocompat parfaite).
*/

function LandingRoute() {
  const navigate = useScreenNavigate();
  return (
    <>
      <SeoHead {...SEO_LANDING} />
      <LandingPage onNavigate={navigate} />
    </>
  );
}

function DiasporaRoute() {
  const navigate = useScreenNavigate();
  return (
    <>
      <SeoHead {...SEO_DIASPORA} />
      <Suspense fallback={<DiasporaSkeleton />}>
        <DiasporaLanding onNavigate={navigate} />
      </Suspense>
    </>
  );
}

/** Skeleton minimaliste affiche pendant le chargement du chunk lazy de DiasporaLanding. */
function DiasporaSkeleton() {
  return (
    <div className="min-h-screen bg-sbs-blue">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-pill bg-white/10" />
        <div className="mt-6 h-12 w-3/4 animate-pulse rounded-card bg-white/10" />
        <div className="mt-3 h-12 w-2/3 animate-pulse rounded-card bg-white/10" />
        <div className="mt-8 h-4 w-1/2 animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}

function OnboardingRoute() {
  const navigate = useScreenNavigate();
  return (
    <>
      <SeoHead {...SEO_ONBOARDING} />
      <Onboarding onNavigate={navigate} />
    </>
  );
}

function LoginRoute() {
  const navigate = useScreenNavigate();
  return (
    <>
      <SeoHead {...SEO_LOGIN} />
      <Login onNavigate={navigate} />
    </>
  );
}

function SearchRoute() {
  const [search] = useSearchParams();
  const navigate = useScreenNavigate();
  return (
    <>
      <SeoHead {...SEO_SEARCH} />
      <SearchTrips
        onNavigate={navigate}
        initialFromId={search.get('from') ?? undefined}
        initialToId={search.get('to') ?? undefined}
      />
    </>
  );
}

function TripDetailRoute() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useScreenNavigate();
  const id = tripId ?? 't1';
  return (
    <>
      <SeoHead {...SEO_TRIP_DETAIL(id)} />
      <TripDetail tripId={id} onNavigate={navigate} />
    </>
  );
}

function BookingRoute() {
  const { tripId } = useParams<{ tripId: string }>();
  const [search] = useSearchParams();
  const navigate = useScreenNavigate();
  const id = tripId ?? 't1';
  // ?mode=gift|self|family — utilise par le deep-link depuis /diaspora pour
  // pre-selectionner le mode "offrir un trajet" et reduire les frictions.
  const rawMode = search.get('mode');
  const initialMode: 'self' | 'gift' | 'family' | undefined =
    rawMode === 'gift' || rawMode === 'family' || rawMode === 'self' ? rawMode : undefined;
  return (
    <>
      <SeoHead {...SEO_BOOKING(id)} />
      <Booking
        tripId={id}
        seats={Number(search.get('seats') ?? '1')}
        initialMode={initialMode}
        onNavigate={navigate}
      />
    </>
  );
}

function PublishRoute() {
  const navigate = useScreenNavigate();
  return (
    <>
      <SeoHead {...SEO_PUBLISH} />
      <PublishTrip onNavigate={navigate} />
    </>
  );
}

function MyTripsRoute() {
  const navigate = useScreenNavigate();
  return (
    <>
      <SeoHead {...SEO_MY_TRIPS} />
      <MyTrips onNavigate={navigate} />
    </>
  );
}

function MessagesRoute() {
  const navigate = useScreenNavigate();
  return (
    <>
      <SeoHead {...SEO_MESSAGES} />
      <Messages onNavigate={navigate} />
    </>
  );
}

function ProfileRoute() {
  const navigate = useScreenNavigate();
  return (
    <>
      <SeoHead {...SEO_PROFILE} />
      <Profile onNavigate={navigate} />
    </>
  );
}

function WalletRoute() {
  const navigate = useScreenNavigate();
  return (
    <>
      <SeoHead title="Mon portefeuille" description="Gérez vos gains et reversements de commission." noindex />
      <DriverWalletScreen onNavigate={navigate} />
    </>
  );
}

function LegalRoute() {
  const navigate = useScreenNavigate();
  return (
    <>
      <SeoHead {...SEO_LEGAL} />
      <Legal onNavigate={navigate} />
    </>
  );
}

function ContactRoute() {
  const navigate = useScreenNavigate();
  return (
    <>
      <SeoHead {...SEO_CONTACT} />
      <Contact onNavigate={navigate} />
    </>
  );
}

function AdminRoute() {
  const navigate = useScreenNavigate();
  return (
    <>
      <SeoHead {...SEO_ADMIN} />
      <Admin onNavigate={navigate} />
    </>
  );
}

function NotFoundRoute() {
  const navigate = useScreenNavigate();
  return (
    <>
      <SeoHead
        title="Page introuvable"
        description="La page que vous cherchez n'existe pas ou plus."
        noindex
      />
      <ComingSoon screen="admin" onNavigate={navigate} />
    </>
  );
}

/* ============================================================
   CountryLayout — porte d'entrée multi-pays
   ============================================================
   Toutes les routes de l'app vivent sous /:country (ex: /cm/search).
   Ce layout, exécuté avant tout enfant, tranche 3 cas :
   1. Segment inconnu (ex: /search, ancien lien sans préfixe pays)
      → on le traite comme un chemin Cameroun et on redirige vers /cm/search.
   2. Code pays connu mais pas encore actif (ex: /sn/...)
      → on retombe sur l'équivalent Cameroun (garde le reste du chemin).
   3. Code pays connu et actif
      → on expose le pays via CountryProvider et on rend les routes enfants.

   Ainsi, activer un nouveau pays (COUNTRIES[x].available = true) suffit à
   le rendre navigable : aucune route à dupliquer, aucun lien à changer.
*/
function CountryLayout() {
  const { country: countryId } = useParams<{ country: string }>();
  const location = useLocation();
  const match = COUNTRIES.find((c) => c.id === countryId);

  if (!match || !match.available) {
    const prefixLength = `/${countryId ?? ''}`.length;
    const rest = match ? location.pathname.slice(prefixLength) : location.pathname;
    const target = `/${DEFAULT_COUNTRY_ID}${rest}${location.search}`;
    return <Navigate to={target} replace />;
  }

  return (
    <CountryProvider country={match}>
      <Outlet />
    </CountryProvider>
  );
}

/* ============================================================
   App — déclaration des routes
   ============================================================ */

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${DEFAULT_COUNTRY_ID}`} replace />} />
      <Route path="/:country" element={<CountryLayout />}>
        <Route index element={<LandingRoute />} />
        <Route path="diaspora" element={<DiasporaRoute />} />
        <Route path="onboarding" element={<OnboardingRoute />} />
        <Route path="login" element={<LoginRoute />} />
        <Route path="search" element={<SearchRoute />} />
        <Route path="trip/:tripId" element={<TripDetailRoute />} />
        <Route path="booking/:tripId" element={<BookingRoute />} />
        <Route path="publish" element={<PublishRoute />} />
        <Route path="wallet" element={<WalletRoute />} />
        <Route path="legal" element={<LegalRoute />} />
        <Route path="contact" element={<ContactRoute />} />
        <Route path="admin" element={<AdminRoute />} />
        <Route path="my-trips" element={<MyTripsRoute />} />
        <Route path="messages" element={<MessagesRoute />} />
        <Route path="profile" element={<ProfileRoute />} />
        <Route path="*" element={<NotFoundRoute />} />
      </Route>
      {/* Tout le reste (chemin sans préfixe pays valide) passe par CountryLayout
          via le param :country, qui gère la redirection legacy → /cm/... */}
      <Route path="*" element={<CountryLayout />} />
    </Routes>
  );
}

export default App;
