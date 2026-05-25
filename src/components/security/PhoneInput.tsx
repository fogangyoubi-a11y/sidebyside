import { useId } from 'react';
import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CM_DIAL_CODE, formatPhoneCMLive, validatePhoneCM } from '@/lib/security';

interface PhoneInputProps {
  value: string;          // valeur "locale" sans le préfixe (ex. "691 23 45 67")
  onChange: (next: string) => void;
  label?: string;
  hint?: string;
}

/**
 * Saisie d'un numéro camerounais avec :
 * - Préfixe +237 figé visuellement (impossible à éditer)
 * - Mask de saisie auto (groupage "6XX XX XX XX")
 * - Validation live + détection opérateur (MTN / Orange / Camtel)
 */
export function PhoneInput({ value, onChange, label = 'Numéro de téléphone', hint }: PhoneInputProps) {
  const id = useId();
  const validation = validatePhoneCM(value);
  const showError = value.length > 0 && !validation.valid;
  const showOk = validation.valid;

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhoneCMLive(e.target.value);
    onChange(formatted);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-sbs-dark">
        {label}
      </label>
      <div
        className={cn(
          'relative flex items-center rounded-btn border bg-white transition-colors',
          showError
            ? 'border-sbs-red focus-within:border-sbs-red focus-within:ring-2 focus-within:ring-sbs-red/20'
            : showOk
              ? 'border-sbs-green focus-within:border-sbs-green focus-within:ring-2 focus-within:ring-sbs-green/20'
              : 'border-sbs-border focus-within:border-sbs-blue focus-within:ring-2 focus-within:ring-sbs-blue/20',
        )}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-muted">
          <Phone className="h-4 w-4" />
        </span>
        <span
          className="inline-flex h-11 select-none items-center border-r border-sbs-border-soft pr-3 font-mono text-sm font-bold text-sbs-dark"
          aria-hidden
        >
          🇨🇲 {CM_DIAL_CODE}
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="6 91 23 45 67"
          value={value}
          onChange={handle}
          className="h-11 flex-1 bg-transparent pl-3 pr-3 font-mono text-sm tracking-wide text-sbs-dark placeholder:text-sbs-muted/60 focus:outline-none"
        />
        {showOk && (
          <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-green" aria-label="Numéro valide">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        )}
        {showError && (
          <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-red" aria-label="Numéro invalide">
            <AlertCircle className="h-4 w-4" />
          </span>
        )}
      </div>

      {showOk && validation.operator && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-sbs-green">
          <CheckCircle2 className="h-3 w-3" />
          Réseau détecté : {validation.operator}
        </span>
      )}
      {showError && validation.error && (
        <span className="text-[11px] font-medium text-sbs-red">{validation.error}</span>
      )}
      {!showError && !showOk && hint && (
        <span className="text-[11px] text-sbs-muted">{hint}</span>
      )}
    </div>
  );
}
