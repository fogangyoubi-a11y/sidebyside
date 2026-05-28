import { cn } from '@/lib/utils';
import { CATEGORY_INFO } from '@/lib/category';
import type { TripCategory } from '@/lib/types';

interface CategoryBadgeProps {
  category: TripCategory;
  size?: 'sm' | 'md' | 'lg';
  /** Si vrai, affiche l'emoji + label complet. Sinon juste le label court. */
  full?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-5 px-1.5 text-[10px]',
  md: 'h-6 px-2 text-[11px]',
  lg: 'h-8 px-3 text-xs',
};

/**
 * Badge visuel pour identifier la catégorie d'un trajet :
 *   🟢 Économique  |  🔵 Confort  |  🟡 Premium VIP
 */
export function CategoryBadge({ category, size = 'md', full = true, className }: CategoryBadgeProps) {
  const info = CATEGORY_INFO[category];
  return (
    <span
      title={info.tagline}
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border font-bold',
        info.bgClass,
        info.textClass,
        info.borderClass,
        sizeClasses[size],
        className,
      )}
    >
      <span aria-hidden>{info.emoji}</span>
      {full ? info.label : info.shortLabel}
    </span>
  );
}
