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
import { useScreenNavigate } from '@/lib/routing';

/* ============================================================
   Wrappers de routes
   ============================================================
   Chaque <Route> rend un mini composant qui :
   1. Récupère les params URL via useParams() + useSearchParams()
   2. Obtient le hook de navigation `navigate(screen, params)`
   3. Passe le tout en props au composant Screen historique

   → Les composants Screen restent inchangés (rétrocompat parfaite).
*/

function LandingRoute() {
  const navigate = useScreenNavigate();
  return <LandingPage onNavigate={navigate} />;
}

function DiasporaRoute() {
  const navigate = useScreenNavigate();
  // Placeholder — sera remplacé par DiasporaLanding.tsx à l'étape 3
  return <ComingSoon screen="admin" onNavigate={navigate} />;
}

function OnboardingRoute() {
  const navigate = useScreenNavigate();
  return <Onboarding onNavigate={navigate} />;
}

function LoginRoute() {
  const navigate = useScreenNavigate();
  return <Login onNavigate={navigate} />;
}

function SearchRoute() {
  const [search] = useSearchParams();
  const navigate = useScreenNavigate();
  return (
    <SearchTrips
      onNavigate={navigate}
      initialFromId={search.get('from') ?? undefined}
      initialToId={search.get('to') ?? undefined}
    />
  );
}

function TripDetailRoute() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useScreenNavigate();
  return <TripDetail tripId={tripId ?? 't1'} onNavigate={navigate} />;
}

function BookingRoute() {
  const { tripId } = useParams<{ tripId: string }>();
  const [search] = useSearchParams();
  const navigate = useScreenNavigate();
  return (
    <Booking
      tripId={tripId ?? 't1'}
      seats={Number(search.get('seats') ?? '1')}
      onNavigate={navigate}
    />
  );
}

function PublishRoute() {
  const navigate = useScreenNavigate();
  return <PublishTrip onNavigate={navigate} />;
}

function MyTripsRoute() {
  const navigate = useScreenNavigate();
  return <MyTrips onNavigate={navigate} />;
}

function MessagesRoute() {
  const navigate = useScreenNavigate();
  return <Messages onNavigate={navigate} />;
}

function ProfileRoute() {
  const navigate = useScreenNavigate();
  return <Profile onNavigate={navigate} />;
}

function NotFoundRoute() {
  const navigate = useScreenNavigate();
  return <ComingSoon screen="admin" onNavigate={navigate} />;
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
