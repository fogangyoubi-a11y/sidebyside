import { useId } from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeInputProps {
  /** Valeur au format `HH:MM` (24h) — ex. "07:30". Vide si invalide. */
  value: string;
  /** Émet une chaîne `HH:MM` valide, ou "" si en cours de saisie. */
  onChange: (hhmm: string) => void;
  label?: string;
  hint?: string;
}

/**
 * Saisie d'une heure au format HH:MM (24h).
 *
 * - Mask automatique : l'utilisateur tape `0730`, l'input affiche `07:30`.
 * - Clavier numérique sur mobile (inputMode="numeric").
 * - Validation live : 00-23 pour les heures, 00-59 pour les minutes.
 * - Pas de "clock picker" natif (le rond avec aiguilles qu'on fait tourner) :
 *   on laisse l'utilisateur taper, c'est mille fois plus rapide sur mobile.
 */
export function TimeInput({ value, onChange, label = 'Heure', hint }: TimeInputProps) {
  const id = useId();
  const display = formatDisplay(value);
  const parsed = parseDisplay(display);
  const complete = display.length === 5;

  const invalid = complete && parsed === null;
  const valid = parsed !== null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = applyTimeMask(e.target.value);
    const parsedTime = parseDisplay(masked);
    onChange(parsedTime ?? (masked.length > 0 ? `partial:${masked}` : ''));
  }

  let error: string | null = null;
  if (invalid) {
    const [hh, mm] = display.split(':').map(Number);
    if (hh !== undefined && hh > 23) error = `L'heure doit être entre 00 et 23 (vous avez tapé ${hh})`;
    else if (mm !== undefined && mm > 59) error = `Les minutes doivent être entre 00 et 59 (vous avez tapé ${mm})`;
    else error = 'Heure invalide';
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-sbs-dark">
        {label}
      </label>
      <div
        className={cn(
          'relative flex items-center rounded-btn border bg-white transition-colors',
          error
            ? 'border-sbs-red focus-within:border-sbs-red focus-within:ring-2 focus-within:ring-sbs-red/20'
            : valid
              ? 'border-sbs-green focus-within:border-sbs-green focus-within:ring-2 focus-within:ring-sbs-green/20'
              : 'border-sbs-border focus-within:border-sbs-blue focus-within:ring-2 focus-within:ring-sbs-blue/20',
        )}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-muted">
          <Clock className="h-4 w-4" />
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder="HH : MM"
          maxLength={5}
          value={display}
          onChange={handleChange}
          className="h-11 flex-1 bg-transparent pl-1 pr-3 font-mono text-base tracking-[0.15em] text-sbs-dark placeholder:text-sbs-muted/60 focus:outline-none"
          aria-invalid={!!error}
        />
        {valid && (
          <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-green" aria-label="Heure valide">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        )}
        {error && (
          <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-red" aria-label="Heure invalide">
            <AlertCircle className="h-4 w-4" />
          </span>
        )}
      </div>

      {error && (
        <span className="text-[11px] font-medium text-sbs-red">{error}</span>
      )}
      {!error && hint && (
        <span className="text-[11px] text-sbs-muted">{hint}</span>
      )}
      {!error && !hint && (
        <span className="text-[11px] text-sbs-muted">
          Tapez l'heure au format 24h (ex. 06:30 ou 14:15)
        </span>
      )}
    </div>
  );
}

/* ===================== Helpers ===================== */

function applyTimeMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function parseDisplay(s: string): string | null {
  // Si l'utilisateur passe une valeur "partial:..." on l'extrait
  if (s.startsWith('partial:')) s = s.slice('partial:'.length);
  const m = s.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;
  return `${m[1]}:${m[2]}`;
}

function formatDisplay(value: string): string {
  if (!value) return '';
  if (value.startsWith('partial:')) return value.slice('partial:'.length);
  // Si on reçoit "07:30" → on garde tel quel
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  return value;
}
