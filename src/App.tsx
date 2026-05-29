import { useState } from 'react';
import type { Screen } from '@/lib/types';
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

interface RouteState {
  screen: Screen;
  params: Record<string, string>;
}

function App() {
  const [route, setRoute] = useState<RouteState>({ screen: 'landing', params: {} });

  const navigate = (screen: Screen, params: Record<string, string> = {}) => {
    setRoute({ screen, params });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  switch (route.screen) {
    case 'landing':
      return <LandingPage onNavigate={navigate} />;

    case 'search':
    case 'search-results':
      return (
        <SearchTrips
          onNavigate={navigate}
          initialFromId={route.params.from}
          initialToId={route.params.to}
        />
      );

    case 'onboarding':
    case 'auth':
    case 'role-pick':
      return <Onboarding onNavigate={navigate} />;

    case 'login':
      return <Login onNavigate={navigate} />;

    case 'trip-detail':
      return <TripDetail tripId={route.params.tripId ?? 't1'} onNavigate={navigate} />;

    case 'booking':
    case 'payment':
    case 'booking-confirmed':
      return (
        <Booking
          tripId={route.params.tripId ?? 't1'}
          seats={Number(route.params.seats ?? '1')}
          onNavigate={navigate}
        />
      );

    case 'publish-trip':
      return <PublishTrip onNavigate={navigate} />;

    case 'my-trips':
    case 'driver-trips':
      return <MyTrips onNavigate={navigate} />;

    case 'messages':
      return <Messages onNavigate={navigate} />;

    case 'profile':
      return <Profile onNavigate={navigate} />;

    default:
      return <ComingSoon screen={route.screen} onNavigate={navigate} />;
  }
}

export default App;
