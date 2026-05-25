import { useId } from 'react';
import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateOfBirthInputProps {
  /** Valeur au format ISO `YYYY-MM-DD` (contrat interne, ex. "1990-05-12"). */
  value: string;
  /** Émet une chaîne ISO `YYYY-MM-DD` valide, ou "" si invalide. */
  onChange: (iso: string) => void;
  label?: string;
  /** Âge minimum requis (par défaut 18). */
  minAge?: number;
  /** Âge maximum raisonnable (par défaut 110). */
  maxAge?: number;
}

/**
 * Saisie d'une date de naissance au format JJ/MM/AAAA.
 *
 * - Mask automatique : l'utilisateur tape `12052026`, l'input affiche `12/05/2026`.
 * - Clavier numérique sur mobile (inputMode="numeric").
 * - Validation live : date réelle (pas 32/13/…), âge minimum/maximum.
 * - Affiche l'âge calculé une fois la date complète.
 * - Pas de date picker natif : on laisse l'utilisateur taper, c'est plus rapide
 *   notamment pour aller chercher une année lointaine (1985, 1972…).
 */
export function DateOfBirthInput({
  value,
  onChange,
  label = 'Date de naissance',
  minAge = 18,
  maxAge = 110,
}: DateOfBirthInputProps) {
  const id = useId();

  // ISO → affichage JJ/MM/AAAA
  const display = isoToDisplay(value);
  const parsed = parseDisplay(display);
  const age = parsed ? computeAge(parsed) : null;
  const complete = display.length === 10;

  const tooYoung = age !== null && age < minAge;
  const tooOld = age !== null && age > maxAge;
  const invalidDate = complete && parsed === null;
  const valid = parsed !== null && !tooYoung && !tooOld;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = applyDateMask(e.target.value);
    const parsedDate = parseDisplay(masked);
    if (parsedDate) {
      onChange(toIso(parsedDate));
    } else {
      // tant que la date n'est pas complète/valide, on stocke quand même
      // les chiffres saisis pour pouvoir afficher la progression
      onChange(displayToIsoPartial(masked));
    }
  }

  let hint: string | null = null;
  if (valid) hint = `Vous avez ${age} ans · validé`;

  let error: string | null = null;
  if (invalidDate) error = 'Cette date n\'existe pas (ex. 31/02)';
  else if (tooYoung) error = `Vous devez avoir au moins ${minAge} ans pour utiliser SideBySide`;
  else if (tooOld) error = 'Veuillez vérifier l\'année saisie';

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
          autoComplete="bday"
          placeholder="JJ / MM / AAAA"
          maxLength={10}
          value={display}
          onChange={handleChange}
          className="h-11 flex-1 bg-transparent pl-1 pr-3 font-mono text-base tracking-[0.15em] text-sbs-dark placeholder:text-sbs-muted/60 focus:outline-none"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
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
        <span id={`${id}-err`} className="text-[11px] font-medium text-sbs-red">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${id}-hint`} className="flex items-center gap-1 text-[11px] font-semibold text-sbs-green">
          <CheckCircle2 className="h-3 w-3" />
          {hint}
        </span>
      )}
      {!error && !hint && (
        <span className="text-[11px] text-sbs-muted">
          Tapez votre date au format jour / mois / année (ex. 12/05/1990)
        </span>
      )}
    </div>
  );
}

/* ===================== Helpers locaux ===================== */

/** Applique le mask `JJ/MM/AAAA` au fil de la saisie. */
function applyDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Parse une chaîne `JJ/MM/AAAA` en Date réelle, ou null si invalide. */
function parseDisplay(s: string): Date | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (yyyy < 1900) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;
  const d = new Date(yyyy, mm - 1, dd);
  // Détecte les bascules type 31/02 → 03/03
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

/** Date → ISO `YYYY-MM-DD`. */
function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** ISO → affichage `JJ/MM/AAAA` (ou "" si vide/invalide). */
function isoToDisplay(iso: string): string {
  // Cas 1 : ISO complet
  const full = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (full) return `${full[3]}/${full[2]}/${full[1]}`;
  // Cas 2 : partiel (stocké comme tel pour préserver la frappe en cours)
  if (iso.startsWith('partial:')) return iso.slice('partial:'.length);
  return '';
}

/** Pour stocker les saisies incomplètes sans perdre la frappe. */
function displayToIsoPartial(display: string): string {
  if (display.length === 0) return '';
  return `partial:${display}`;
}

function computeAge(birth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}
