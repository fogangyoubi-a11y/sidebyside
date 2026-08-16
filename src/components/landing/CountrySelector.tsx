/**
 * CountrySelector — sélecteur de pays dans le header, façon BlaBlaCar.
 *
 * Le Cameroun est le seul pays réellement actif aujourd'hui. Les autres
 * pays affichés servent à montrer l'ambition d'expansion régionale : ils
 * sont marqués "Bientôt disponible" et ouvrent la CountryWaitlistModal
 * pour capturer l'intérêt (email) au lieu de rediriger vers une page morte.
 *
 * Drapeaux : icônes SVG circulaires (mêmes que celles utilisées par BlaBlaCar),
 * via la librairie open source "circle-flags" (MIT), chargées depuis le CDN
 * jsDelivr par code ISO 3166-1 alpha-2 — qui est justement notre `country.id`.
 * Pas d'emoji : les émojis drapeaux ne s'affichent pas correctement sur Windows.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useCountry } from '@/lib/country';

export interface CountryOption {
  id: string;
  name: string;
  available: boolean;
}

/** URL d'une icône de drapeau circulaire (SVG) pour un code pays ISO donné. */
export function flagUrl(countryId: string): string {
  return `https://cdn.jsdelivr.net/gh/hatscripts/circle-flags@gh-pages/flags/${countryId}.svg`;
}

// Afrique centrale = région "Middle Africa" au sens ONU (CEEAC) : Cameroun,
// Angola, Congo-Brazzaville, Gabon, Guinée équatoriale, RD Congo,
// République centrafricaine, São Tomé-et-Príncipe, Tchad.
export const COUNTRIES: CountryOption[] = [
  { id: 'cm', name: 'Cameroun', available: true },
  { id: 'ao', name: 'Angola', available: false },
  { id: 'cg', name: 'Congo-Brazzaville', available: false },
  { id: 'ga', name: 'Gabon', available: false },
  { id: 'gq', name: 'Guinée équatoriale', available: false },
  { id: 'cd', name: 'RD Congo', available: false },
  { id: 'cf', name: 'République centrafricaine', available: false },
  { id: 'st', name: 'São Tomé-et-Príncipe', available: false },
  { id: 'td', name: 'Tchad', available: false },
];

interface CountrySelectorProps {
  /** Appelé quand on clique sur un pays pas encore disponible. */
  onSelectUnavailable: (country: CountryOption) => void;
  className?: string;
}

/** Petit drapeau circulaire, avec repli discret si le SVG ne charge pas. */
export function FlagIcon({ countryId, size = 'sm' }: { countryId: string; size?: 'sm' | 'md' }) {
  return (
    <img
      src={flagUrl(countryId)}
      alt=""
      aria-hidden
      loading="lazy"
      className={`inline-block shrink-0 rounded-full object-cover ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
      }}
    />
  );
}

export function CountrySelector({ onSelectUnavailable, className }: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const current = useCountry();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);

  // Ferme le menu si on clique en dehors, ou avec Escape.
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function handlePick(country: CountryOption) {
    setOpen(false);
    if (!country.available) {
      onSelectUnavailable(country);
      return;
    }
    if (country.id !== current.id) {
      // Bascule vers un autre pays déjà actif — prêt pour le jour où il y en aura plusieurs.
      navigate(`/${country.id}`);
    }
  }

  return (
    <div ref={rootRef} className={className} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-pill border border-sbs-border px-3 py-2 text-sm font-semibold text-sbs-dark transition-colors hover:bg-sbs-border-soft"
      >
        <FlagIcon countryId={current.id} size="sm" />
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-sbs-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Choisir un pays"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-card-lg border border-sbs-border bg-white py-1.5 shadow-card-hover"
        >
          <div className="flex items-center gap-1.5 px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-sbs-muted">
            <Globe className="h-3 w-3" />
            Choisir un pays
          </div>
          {COUNTRIES.map((country) => (
            <button
              key={country.id}
              type="button"
              role="option"
              aria-selected={country.id === current.id}
              onClick={() => handlePick(country)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-sbs-border-soft"
            >
              <span className="flex items-center gap-2">
                <FlagIcon countryId={country.id} size="md" />
                <span className={country.available ? 'font-semibold text-sbs-dark' : 'text-sbs-muted'}>
                  {country.name}
                </span>
              </span>
              {country.id === current.id ? (
                <Check className="h-4 w-4 text-sbs-blue" />
              ) : !country.available ? (
                <span className="rounded-pill bg-sbs-yellow-light px-2 py-0.5 text-[10px] font-bold text-sbs-yellow-dark">
                  Bientôt
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
