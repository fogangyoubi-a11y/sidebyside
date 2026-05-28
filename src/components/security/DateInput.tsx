import { useId } from 'react';
import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateInputProps {
  /** Valeur au format ISO `YYYY-MM-DD` (ex. "2026-05-28"). */
  value: string;
  /** Émet une chaîne ISO valide, ou "" si en cours de saisie / invalide. */
  onChange: (iso: string) => void;
  label?: string;
  /** Date minimum acceptée (ISO `YYYY-MM-DD`), inclusive. */
  min?: string;
  /** Date maximum acceptée (ISO `YYYY-MM-DD`), inclusive. */
  max?: string;
  hint?: string;
}

/**
 * Saisie d'une date au format JJ/MM/AAAA, sans date picker natif.
 *
 * - Mask automatique : `12052026` → `12/05/2026`
 * - Validation live : date réelle, dans la plage [min, max] si fournie
 * - Clavier numérique sur mobile
 * - Identique au DateOfBirthInput, mais générique (pas de contrainte d'âge)
 */
export function DateInput({ value, onChange, label = 'Date', min, max, hint }: DateInputProps) {
  const id = useId();

  const display = isoToDisplay(value);
  const parsed = parseDisplay(display);
  const complete = display.length === 10;

  const minDate = min ? new Date(min) : null;
  const maxDate = max ? new Date(max) : null;

  const tooEarly = parsed && minDate && parsed < minDate;
  const tooLate = parsed && maxDate && parsed > maxDate;
  const invalidDate = complete && parsed === null;
  const valid = parsed !== null && !tooEarly && !tooLate;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = applyDateMask(e.target.value);
    const parsedDate = parseDisplay(masked);
    if (parsedDate) {
      onChange(toIso(parsedDate));
    } else {
      onChange(displayToIsoPartial(masked));
    }
  }

  let error: string | null = null;
  if (invalidDate) error = 'Cette date n\'existe pas (ex. 31/02)';
  else if (tooEarly && minDate) error = `Date trop ancienne (min : ${formatFr(minDate)})`;
  else if (tooLate && maxDate) error = `Date trop éloignée (max : ${formatFr(maxDate)})`;

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
          <Calendar className="h-4 w-4" />
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder="JJ / MM / AAAA"
          maxLength={10}
          value={display}
          onChange={handleChange}
          className="h-11 flex-1 bg-transparent pl-1 pr-3 font-mono text-base tracking-[0.15em] text-sbs-dark placeholder:text-sbs-muted/60 focus:outline-none"
          aria-invalid={!!error}
        />
        {valid && (
          <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-green" aria-label="Date valide">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        )}
        {error && (
          <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-red" aria-label="Date invalide">
            <AlertCircle className="h-4 w-4" />
          </span>
        )}
      </div>

      {error && (
        <span className="text-[11px] font-medium text-sbs-red">{error}</span>
      )}
      {!error && valid && parsed && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-sbs-green">
          <CheckCircle2 className="h-3 w-3" />
          {formatLongFr(parsed)}
        </span>
      )}
      {!error && !valid && hint && (
        <span className="text-[11px] text-sbs-muted">{hint}</span>
      )}
      {!error && !valid && !hint && (
        <span className="text-[11px] text-sbs-muted">
          Tapez la date au format jour / mois / année
        </span>
      )}
    </div>
  );
}

/* ===================== Helpers ===================== */

function applyDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDisplay(s: string): Date | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (yyyy < 1900 || yyyy > 2100) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function isoToDisplay(iso: string): string {
  const full = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (full) return `${full[3]}/${full[2]}/${full[1]}`;
  if (iso.startsWith('partial:')) return iso.slice('partial:'.length);
  return '';
}

function displayToIsoPartial(display: string): string {
  if (display.length === 0) return '';
  return `partial:${display}`;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatFr(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatLongFr(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
