import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

interface SbsLogoProps {
  size?: Size;
  className?: string;
}

/**
 * Logo SideBySide — deux sièges auto stylisés (bleu = conducteur, jaune = passager).
 * SVG vectoriel + fallback à la photo `public/img/logo.jpeg` si nécessaire.
 */
export function SbsLogo({ size = 'md', className }: SbsLogoProps) {
  return (
    <span
      className={cn(
        'relative inline-grid place-items-center overflow-hidden rounded-card bg-white shadow-soft',
        sizeClasses[size],
        className,
      )}
      aria-label="SideBySide"
    >
      <svg
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full p-1"
        aria-hidden="true"
      >
        {/* Siège conducteur (bleu) */}
        <path
          d="M8 14 Q8 9 13 9 L15 9 Q20 9 20 14 L20 28 L8 28 Z"
          fill="#1E3A8A"
        />
        <rect x="8" y="25" width="12" height="6" rx="2" fill="#1E3A8A" />

        {/* Siège passager (jaune) */}
        <path
          d="M20 14 Q20 9 25 9 L27 9 Q32 9 32 14 L32 28 L20 28 Z"
          fill="#FCD116"
        />
        <rect x="20" y="25" width="12" height="6" rx="2" fill="#FCD116" />

        {/* Séparation centrale */}
        <line x1="20" y1="9" x2="20" y2="31" stroke="white" strokeWidth="0.5" />
      </svg>
    </span>
  );
}
