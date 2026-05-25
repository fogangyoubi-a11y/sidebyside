import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-sbs-blue text-white hover:bg-sbs-blue-dark shadow-btn-primary disabled:bg-sbs-blue/40 disabled:shadow-none',
  accent:
    'bg-sbs-yellow text-sbs-dark hover:bg-sbs-yellow-dark shadow-btn-accent disabled:bg-sbs-yellow/40 disabled:shadow-none',
  secondary:
    'bg-white text-sbs-blue border border-sbs-border hover:bg-sbs-blue-light disabled:opacity-50',
  ghost:
    'bg-transparent text-sbs-dark hover:bg-sbs-border-soft disabled:opacity-50',
  outline:
    'bg-transparent text-white border border-white/30 hover:bg-white/10 disabled:opacity-50',
  danger:
    'bg-sbs-red text-white hover:bg-sbs-red/90 disabled:opacity-50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-btn font-display font-bold transition-all duration-200 ease-smooth focus-visible:outline-none disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
