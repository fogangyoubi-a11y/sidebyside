import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 w-7',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
};

interface SbsLogoProps {
  size?: Size;
  className?: string;
  /** Désactive le fond blanc + ombre (utile sur fond sombre où le logo a déjà son décor). */
  bare?: boolean;
}

/**
 * Logo officiel SideBySide — photo `public/img/logo.jpeg`.
 * Présentation : carré arrondi blanc avec ombre douce, pour donner du contraste sur tous les fonds.
 */
export function SbsLogo({ size = 'md', className, bare = false }: SbsLogoProps) {
  return (
    <span
      className={cn(
        'relative inline-grid place-items-center overflow-hidden rounded-card',
        !bare && 'bg-white shadow-soft ring-1 ring-sbs-border/40',
        sizeClasses[size],
        className,
      )}
      aria-label="SideBySide"
    >
      <img
        src="/img/logo.jpeg"
        alt="SideBySide"
        className="h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
    </span>
  );
}
