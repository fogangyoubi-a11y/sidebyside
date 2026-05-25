import { useState } from 'react';
import { Siren } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SosModal } from './SosModal';

interface SosButtonProps {
  className?: string;
  /** Texte affiché à côté de l'icône — masqué sur mobile pour gagner la place. */
  label?: string;
}

/**
 * Bouton SOS flottant. Couleur rouge, animation de pulsation,
 * visible en permanence quand le trajet est actif.
 */
export function SosButton({ className, label = 'SOS' }: SosButtonProps) {
  const [open, setOpen] = useState(false);

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
        {/* Anneau pulsé pour attirer l'œil */}
        <span aria-hidden className="absolute inset-0 rounded-pill bg-sbs-red opacity-50 [animation:sosPulse_2s_ease-out_infinite]" />
        <span className="relative inline-flex items-center gap-2">
          <Siren className="h-5 w-5" />
          <span className="tracking-wider">{label}</span>
        </span>

        {/* Keyframes injectées localement */}
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
