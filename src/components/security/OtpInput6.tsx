import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { OTP_LENGTH, type OtpState, isOtpExpired } from '@/lib/security';

interface OtpInput6Props {
  state: OtpState;
  onChange: (next: OtpState) => void;
  /** Déclenchée quand les 6 chiffres sont saisis et OTP non expiré. */
  onComplete?: (code: string) => void;
  /** Si renseigné, déclenché à l'expiration. */
  onExpire?: () => void;
}

/**
 * Champ OTP 6 chiffres avec :
 * - Auto-focus du prochain input
 * - Support coller (paste) un code complet
 * - Compteur d'expiration (5 min) live
 * - Verrouillage si expiré ou plus d'essais
 */
export function OtpInput6({ state, onChange, onComplete, onExpire }: OtpInput6Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [, force] = useState(0);

  // Tic-tac pour rafraîchir le compteur d'expiration
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Notification d'expiration
  useEffect(() => {
    if (isOtpExpired(state) && onExpire) onExpire();
  }, [state, onExpire]);

  const expired = isOtpExpired(state);
  const blocked = state.attemptsLeft <= 0 || expired;
  const remainingSec = Math.max(0, Math.floor((state.expiresAt - Date.now()) / 1000));
  const min = Math.floor(remainingSec / 60);
  const sec = remainingSec % 60;

  function setDigit(i: number, v: string) {
    if (blocked) return;
    if (v.length > 1) v = v.slice(-1);
    if (v && !/^\d$/.test(v)) return;
    const next = [...state.code];
    next[i] = v;
    const newState = { ...state, code: next };
    onChange(newState);
    if (v && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
    if (next.every((d) => d.length === 1) && onComplete) onComplete(next.join(''));
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !state.code[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    if (blocked) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('').map((_, i) => pasted[i] ?? '');
    onChange({ ...state, code: next });
    const lastIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    refs.current[lastIdx]?.focus();
    if (next.every((d) => d.length === 1) && onComplete) onComplete(next.join(''));
  }

  return (
    <div>
      <div className="flex justify-center gap-2 sm:gap-3">
        {state.code.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={d}
            disabled={blocked}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={cn(
              'h-14 w-11 sm:h-16 sm:w-12 rounded-card border-2 bg-white text-center font-display text-2xl font-extrabold transition-colors focus:outline-none focus:ring-2',
              blocked
                ? 'border-sbs-border bg-sbs-border-soft text-sbs-muted'
                : 'border-sbs-border text-sbs-dark focus:border-sbs-blue focus:ring-sbs-blue/20',
            )}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px]">
        {expired ? (
          <span className="font-bold text-sbs-red">⏱ Code expiré, veuillez en demander un nouveau</span>
        ) : (
          <span className="text-sbs-muted">
            Expire dans <strong className={remainingSec < 60 ? 'text-sbs-red' : 'text-sbs-dark'}>
              {min}:{sec.toString().padStart(2, '0')}
            </strong>
          </span>
        )}
        <span className={cn('font-semibold', state.attemptsLeft <= 1 ? 'text-sbs-red' : 'text-sbs-muted')}>
          {state.attemptsLeft} essai{state.attemptsLeft > 1 ? 's' : ''} restant{state.attemptsLeft > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
