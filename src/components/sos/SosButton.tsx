import { useState } from 'react';
import { Siren } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SosModal } from './SosModal';

interface SosButtonProps {
  className?: string;
  /** Texte affiché à côté de l'icône — masqué sur mobile pour gagner la place. */
  label?: string;
  /**
   * Mode d'affichage :
   * - "floating" (défaut) : pastille rouge flottante en bas à droite, animée
   * - "header"            : bouton compact pour intégration dans un header sticky
   */
  variant?: 'floating' | 'header';
}

/**
 * Bouton SOS. Deux variantes :
 *  - floating : visible en permanence sur les écrans de trajet (bas-droit)
 *  - header   : intégré au header pour ne pas écraser un CTA en bas
 */
export function SosButton({ className, label = 'SOS', variant = 'floating' }: SosButtonProps) {
  const [open, setOpen] = useState(false);

  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Bouton d'urgence SOS"
          className={cn(
            'group relative inline-flex items-center gap-1.5 rounded-pill bg-sbs-red px-3 py-1.5 font-display text-xs font-extrabold text-white shadow-soft transition-all hover:bg-red-700 active:scale-95',
            className,
          )}
        >
          <span aria-hidden className="absolute -inset-0.5 rounded-pill bg-sbs-red opacity-50 [animation:sosPulseHeader_2s_ease-out_infinite]" />
          <span className="relative inline-flex items-center gap-1.5">
            <Siren className="h-3.5 w-3.5" />
            {label}
          </span>
          <style>{`
            @keyframes sosPulseHeader {
              0%   { transform: scale(1);   opacity: 0.4; }
              70%  { transform: scale(1.25); opacity: 0; }
              100% { transform: scale(1.25); opacity: 0; }
            }
          `}</style>
        </button>
        {open && <SosModal onClose={() => setOpen(false)} />}
      </>
    );
  }

  // Variante "floating" (par défaut)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Bouton d'urgence SOS"
        className={cn(
          'group fixed bottom-6 right-4 z-50 flex items-center gap-2 rounded-pill bg-sbs-red px-4 py-3 font-display text-sm font-extrabold text-white shadow-card-hover transition-all hover:scale-105 active:scale-95 sm:right-6',
          className,
        )}
      >
        <span aria-hidden className="absolute inset-0 rounded-pill bg-sbs-red opacity-50 [animation:sosPulse_2s_ease-out_infinite]" />
        <span className="relative inline-flex items-center gap-2">
          <Siren className="h-5 w-5" />
          <span className="tracking-wider">{label}</span>
        </span>
        <style>{`
          @keyframes sosPulse {
            0%   { transform: scale(1);   opacity: 0.5; }
            70%  { transform: scale(1.4); opacity: 0;   }
            100% { transform: scale(1.4); opacity: 0;   }
          }
        `}</style>
      </button>
      {open && <SosModal onClose={() => setOpen(false)} />}
    </>
  );
}
