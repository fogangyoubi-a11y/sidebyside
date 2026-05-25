import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, rightIcon, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-sbs-dark">
          {label}
        </label>
      )}
      <div
        className={cn(
          'relative flex items-center rounded-btn border bg-white transition-colors',
          error
            ? 'border-sbs-red focus-within:border-sbs-red focus-within:ring-2 focus-within:ring-sbs-red/20'
            : 'border-sbs-border focus-within:border-sbs-blue focus-within:ring-2 focus-within:ring-sbs-blue/20',
        )}
      >
        {leftIcon && (
          <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-muted">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-11 flex-1 bg-transparent text-sm text-sbs-dark placeholder:text-sbs-muted/70 focus:outline-none',
            leftIcon ? 'pl-0' : 'pl-3.5',
            rightIcon ? 'pr-0' : 'pr-3.5',
            className,
          )}
          {...rest}
        />
        {rightIcon && (
          <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-muted">
            {rightIcon}
          </span>
        )}
      </div>
      {hint && !error && <span className="text-[11px] text-sbs-muted">{hint}</span>}
      {error && <span className="text-[11px] font-medium text-sbs-red">{error}</span>}
    </div>
  );
});
