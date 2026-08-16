import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);

// Sur les apps natives (Capacitor iOS/Android), on masque le splash screen
// une fois React monté. N'a aucun effet sur le web (PWA/navigateur).
if ('Capacitor' in window) {
  import('@capacitor/splash-screen')
    .then(({ SplashScreen }) => SplashScreen.hide())
    .catch(() => {
      /* pas de plugin natif dispo (ex: web) — on ignore */
    });
}
