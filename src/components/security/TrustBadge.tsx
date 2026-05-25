import { Shield, ShieldCheck, Crown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTrustLabel, type TrustLevel } from '@/lib/security';

interface TrustBadgeProps {
  level: TrustLevel;
  size?: 'sm' | 'md' | 'lg';
  /** Affiche le label texte à côté de l'icône. */
  showLabel?: boolean;
  /** Affiche la description en infobulle (title HTML). */
  showTooltip?: boolean;
  className?: string;
}

const levelConfig: Record<TrustLevel, { icon: LucideIcon; bgClass: string; textClass: string }> = {
  basic: {
    icon: Shield,
    bgClass: 'bg-sbs-border-soft border-sbs-border',
    textClass: 'text-sbs-muted',
  },
  verified: {
    icon: ShieldCheck,
    bgClass: 'bg-sbs-blue-light border-sbs-blue/30',
    textClass: 'text-sbs-blue',
  },
  premium: {
    icon: Crown,
    bgClass: 'bg-gradient-to-br from-sbs-yellow-light to-sbs-yellow/40 border-sbs-yellow',
    textClass: 'text-sbs-yellow-dark',
  },
};

const sizeConfig = {
  sm: { box: 'h-5 px-1.5', icon: 'h-3 w-3', text: 'text-[10px]' },
  md: { box: 'h-6 px-2',   icon: 'h-3.5 w-3.5', text: 'text-[11px]' },
  lg: { box: 'h-8 px-2.5', icon: 'h-4 w-4', text: 'text-xs' },
};

export function TrustBadge({
  level,
  size = 'md',
  showLabel = true,
  showTooltip = true,
  className,
}: TrustBadgeProps) {
  const cfg = levelConfig[level];
  const sz = sizeConfig[size];
  const { label, description } = getTrustLabel(level);
  const Icon = cfg.icon;

  return (
    <span
      title={showTooltip ? description : undefined}
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border font-bold',
        cfg.bgClass,
        cfg.textClass,
        sz.box,
        sz.text,
        className,
      )}
    >
      <Icon className={sz.icon} />
      {showLabel && label}
    </span>
  );
}
