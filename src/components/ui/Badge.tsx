import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'blue' | 'yellow' | 'green' | 'red' | 'muted' | 'dark';

const toneClasses: Record<Tone, string> = {
  blue:   'bg-sbs-blue-light text-sbs-blue border-sbs-blue/20',
  yellow: 'bg-sbs-yellow-light text-sbs-yellow-dark border-sbs-yellow/30',
  green:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  red:    'bg-red-50 text-sbs-red border-red-200',
  muted:  'bg-sbs-border-soft text-sbs-muted border-sbs-border',
  dark:   'bg-sbs-dark text-white border-sbs-dark',
};

interface BadgeProps {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'muted', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-[11px] font-semibold',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
