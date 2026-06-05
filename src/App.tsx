import { Routes, Route, useParams, useSearchParams } from 'react-router-dom';
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
import { SeoHead } from '@/components/seo/SeoHead';
import { useScreenNavigate } from '@/lib/routing';
import {
  SEO_LANDING, SEO_DIASPORA, SEO_ONBOARDING, SEO_LOGIN, SEO_SEARCH,
  SEO_TRIP_DETAIL, SEO_BOOKING, SEO_PUBLISH, SEO_MY_TRIPS, SEO_MESSAGES, SEO_PROFILE,
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
  // Placeholder — sera remplacé par DiasporaLanding.tsx à l'étape 3.
  // Les meta tags diaspora sont déjà actifs : si tu pousses des pubs FB
  // sur /diaspora dès maintenant, l'aperçu WhatsApp sera correct.
  return (
    <>
      <SeoHead {...SEO_DIASPORA} />
      <ComingSoon screen="admin" onNavigate={navigate} />
    </>
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
  return (
    <>
      <SeoHead {...SEO_BOOKING(id)} />
      <Booking
        tripId={id}
        seats={Number(search.get('seats') ?? '1')}
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
   App — déclaration des routes
   ============================================================ */

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/diaspora" element={<DiasporaRoute />} />
      <Route path="/onboarding" element={<OnboardingRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/search" element={<SearchRoute />} />
      <Route path="/trip/:tripId" element={<TripDetailRoute />} />
      <Route path="/booking/:tripId" element={<BookingRoute />} />
      <Route path="/publish" element={<PublishRoute />} />
      <Route path="/my-trips" element={<MyTripsRoute />} />
      <Route path="/messages" element={<MessagesRoute />} />
      <Route path="/profile" element={<ProfileRoute />} />
      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  );
}

export default App;
