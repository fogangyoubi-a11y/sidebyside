import { Eye, EyeOff, Check, X, Lock, Sparkles, Copy } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { checkPassword, PWD_MIN_LENGTH, suggestStrongPassword, type PasswordCheck } from '@/lib/security';

interface PasswordStrengthProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  /** Si fourni, affiche aussi un champ "confirmer" et signale les divergences. */
  confirmValue?: string;
  onConfirmChange?: (v: string) => void;
  /** Callback synchrone avec l'état actuel de validation. */
  onCheckChange?: (check: PasswordCheck) => void;
}

const strengthColors: Record<PasswordCheck['strength'], { bar: string; text: string }> = {
  'tres-faible': { bar: 'bg-sbs-red',     text: 'text-sbs-red' },
  'faible':      { bar: 'bg-orange-500',  text: 'text-orange-600' },
  'moyen':       { bar: 'bg-sbs-yellow',  text: 'text-sbs-yellow-dark' },
  'fort':        { bar: 'bg-emerald-400', text: 'text-emerald-600' },
  'tres-fort':   { bar: 'bg-sbs-green',   text: 'text-sbs-green' },
};

export function PasswordStrength({
  value,
  onChange,
  label = 'Mot de passe',
  confirmValue,
  onConfirmChange,
  onCheckChange,
}: PasswordStrengthProps) {
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const check = checkPassword(value);
  const colors = strengthColors[check.strength];

  // Callback parent (effet de notification simple — pas de useEffect pour éviter le hook lint)
  if (onCheckChange) onCheckChange(check);

  const matches = confirmValue !== undefined && confirmValue.length > 0 && confirmValue === value;
  const mismatch = confirmValue !== undefined && confirmValue.length > 0 && confirmValue !== value;

  return (
    <div className="flex flex-col gap-3">
      {/* Bouton "Suggérer un mot de passe fort" */}
      <button
        type="button"
        onClick={() => {
          const pwd = suggestStrongPassword();
          onChange(pwd);
          if (onConfirmChange) onConfirmChange(pwd);
          setShow(true);          // affiche d'office pour que l'user puisse le noter
          setShowConfirm(true);
        }}
        className="group flex w-full items-center justify-between gap-2 rounded-card border-2 border-dashed border-sbs-blue/40 bg-sbs-blue-light/30 px-3 py-2.5 text-left transition-colors hover:border-sbs-blue hover:bg-sbs-blue-light"
      >
        <span className="flex items-center gap-2 text-xs">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-sbs-blue text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span>
            <span className="block font-display text-sm font-extrabold text-sbs-dark">
              Suggérer un mot de passe fort
            </span>
            <span className="text-[10px] text-sbs-muted">
              Remplit les 2 champs en un clic — pensez à le noter !
            </span>
          </span>
        </span>
        <Copy className="h-4 w-4 text-sbs-blue transition-transform group-hover:scale-110" />
      </button>

      {/* Champ mot de passe */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-sbs-dark">{label}</label>
        <div className="relative flex items-center rounded-btn border border-sbs-border bg-white focus-within:border-sbs-blue focus-within:ring-2 focus-within:ring-sbs-blue/20">
          <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-muted">
            <Lock className="h-4 w-4" />
          </span>
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete="new-password"
            placeholder="Au moins 12 caractères"
            className="h-11 flex-1 bg-transparent text-sm text-sbs-dark placeholder:text-sbs-muted/70 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="grid h-11 w-11 shrink-0 place-items-center text-sbs-muted transition-colors hover:text-sbs-dark"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Barre de force */}
      {value.length > 0 && (
        <div>
          <div className="flex h-1.5 gap-1 overflow-hidden rounded-pill bg-sbs-border-soft">
            {[1, 2, 3, 4, 5].map((seg) => (
              <span
                key={seg}
                className={cn(
                  'flex-1 transition-colors',
                  seg <= check.score ? colors.bar : 'bg-sbs-border-soft',
                )}
              />
            ))}
          </div>
          <p className={cn('mt-1 text-[11px] font-semibold', colors.text)}>{check.message}</p>
        </div>
      )}

      {/* Checklist critères */}
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-1 text-[11px]">
          <Rule ok={check.rules.minLength}>Au moins {PWD_MIN_LENGTH} caractères</Rule>
          <Rule ok={check.rules.hasUpper}>Une lettre MAJUSCULE</Rule>
          <Rule ok={check.rules.hasLower}>Une lettre minuscule</Rule>
          <Rule ok={check.rules.hasDigit}>Un chiffre</Rule>
          <Rule ok={check.rules.hasSymbol}>Un symbole (!@#$…)</Rule>
          <Rule ok={check.rules.notCommon}>Pas un mot de passe banal</Rule>
        </ul>
      )}

      {/* Confirmation */}
      {onConfirmChange && (
        <div className="flex flex-col gap-1.5 pt-2">
          <label className="text-xs font-semibold text-sbs-dark">Confirmer le mot de passe</label>
          <div
            className={cn(
              'relative flex items-center rounded-btn border bg-white transition-colors',
              mismatch
                ? 'border-sbs-red focus-within:ring-2 focus-within:ring-sbs-red/20'
                : matches
                  ? 'border-sbs-green focus-within:ring-2 focus-within:ring-sbs-green/20'
                  : 'border-sbs-border focus-within:border-sbs-blue focus-within:ring-2 focus-within:ring-sbs-blue/20',
            )}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center text-sbs-muted">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmValue}
              onChange={(e) => onConfirmChange(e.target.value)}
              autoComplete="new-password"
              placeholder="Retapez le mot de passe"
              className="h-11 flex-1 bg-transparent text-sm text-sbs-dark placeholder:text-sbs-muted/70 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="grid h-11 w-11 shrink-0 place-items-center text-sbs-muted transition-colors hover:text-sbs-dark"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {mismatch && (
            <span className="text-[11px] font-medium text-sbs-red">
              Les mots de passe ne correspondent pas
            </span>
          )}
          {matches && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-sbs-green">
              <Check className="h-3 w-3" /> Les mots de passe correspondent
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={cn('flex items-center gap-1.5', ok ? 'text-sbs-green' : 'text-sbs-muted')}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {children}
    </li>
  );
}
