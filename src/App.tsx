import { useState } from 'react';
import type { Screen } from '@/lib/types';
import { LandingPage } from '@/screens/LandingPage';
import { SearchTrips } from '@/screens/SearchTrips';
import { Onboarding } from '@/screens/Onboarding';
import { ComingSoon } from '@/screens/ComingSoon';

function App() {
  const [screen, setScreen] = useState<Screen>('landing');

  const navigate = (s: Screen) => {
    setScreen(s);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  switch (screen) {
    case 'landing':
      return <LandingPage onNavigate={navigate} />;
    case 'search':
    case 'search-results':
      return <SearchTrips onNavigate={navigate} />;
    case 'onboarding':
    case 'auth':
    case 'role-pick':
      return <Onboarding onNavigate={navigate} />;
    default:
      return <ComingSoon screen={screen} onNavigate={navigate} />;
  }
}

export default App;
