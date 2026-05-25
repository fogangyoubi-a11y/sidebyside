/** Concatène des classes conditionnelles (mini clsx). */
export function cn(...args: Array<string | undefined | null | false | Record<string, boolean>>): string {
  const out: string[] = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string') out.push(arg);
    else if (typeof arg === 'object') {
      for (const [key, value] of Object.entries(arg)) {
        if (value) out.push(key);
      }
    }
  }
  return out.join(' ');
}

/** Formate un montant en F CFA (XAF) — sans décimales. */
export function formatXAF(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' F CFA';
}

/** Formate une heure 24h "HH:mm". */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Formate une date "lun. 25 mai". */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Durée lisible "2 h 30". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m.toString().padStart(2, '0')}`;
}
