/**
 * Contexte pays — support multi-pays façon BlaBlaCar (site.com/cm, site.com/sn...).
 *
 * Un seul point de vérité pour "dans quel pays suis-je actuellement ?", posé
 * par CountryLayout (voir App.tsx) une fois l'URL validée. Tout le reste de
 * l'app (navigation interne via useScreenNavigate, sélecteur de pays dans le
 * header) lit ce contexte plutôt que de coder le pays en dur.
 *
 * Pour activer un nouveau pays plus tard :
 *  1. Passer `available: true` sur son entrée dans COUNTRIES (CountrySelector.tsx)
 *  2. Adapter les données spécifiques au pays (villes, trajets, devise...) si besoin
 *  C'est tout — le routing, les redirections et le sélecteur suivent automatiquement.
 */
import { createContext, useContext, type ReactNode } from 'react';
import type { CountryOption } from '@/components/landing/CountrySelector';

/** Pays par défaut : celui vers lequel on redirige quand aucun pays valide n'est dans l'URL. */
export const DEFAULT_COUNTRY_ID = 'cm';

const CountryContext = createContext<CountryOption | null>(null);

export function CountryProvider({ country, children }: { country: CountryOption; children: ReactNode }) {
  return <CountryContext.Provider value={country}>{children}</CountryContext.Provider>;
}

/** Pays actif dans l'URL courante. À utiliser uniquement sous <CountryProvider>. */
export function useCountry(): CountryOption {
  const country = useContext(CountryContext);
  if (!country) {
    throw new Error('useCountry() doit être utilisé dans un composant descendant de <CountryProvider>.');
  }
  return country;
}
