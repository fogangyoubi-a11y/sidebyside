/**
 * NewsletterForm — capture email diaspora.
 *
 * Étape 3 : version stub qui simule l'envoi (mock 1.5 s + succès).
 * Étape 5 : sera branchée à Mailchimp Marketing API.
 *
 * Champs :
 *  - Prénom
 *  - Email (requis, validé)
 *  - Ville actuelle (Bruxelles / Paris / Montréal / Berlin / Autre)
 *  - Axes intéressés (checkboxes multiples)
 */
import { useState, type FormEvent } from 'react';
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const CITIES = [
  'Bruxelles', 'Paris', 'Lyon', 'Marseille',
  'Montréal', 'Toronto', 'New York', 'Berlin',
  'Londres', 'Genève', 'Autre',
];

const AXES = [
  { id: 'yde-dla',   label: 'Yaoundé ↔ Douala' },
  { id: 'dla-lim',   label: 'Douala ↔ Limbé' },
  { id: 'yde-bam',   label: 'Yaoundé ↔ Bamenda' },
  { id: 'dla-baf',   label: 'Douala ↔ Bafoussam' },
  { id: 'autre',     label: 'Un autre axe (précise dans le mail)' },
];

type Status = 'idle' | 'loading' | 'success' | 'error';

export function NewsletterForm() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Bruxelles');
  const [selectedAxes, setSelectedAxes] = useState<string[]>(['dla-baf']);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');

  function toggleAxis(id: string) {
    setSelectedAxes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.includes('@') || !email.includes('.')) {
      setError("Cette adresse email a l'air bizarre. Vérifie qu'elle est correcte.");
      return;
    }
    if (!firstName.trim()) {
      setError('Ton prénom nous aide à personnaliser nos messages.');
      return;
    }

    setStatus('loading');

    // Stub — sera remplacé par appel Mailchimp à l'étape 5
    await new Promise((r) => setTimeout(r, 1500));

    // Pour tester l'état d'erreur, décommente :
    // setStatus('error'); setError('Erreur de connexion. Réessaie dans 1 minute.'); return;

    setStatus('success');
  }

  if (status === 'success') {
    return (
      <div className="rounded-card-lg border border-sbs-green/20 bg-sbs-green/5 p-6 text-center sm:p-8">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-sbs-green/15 text-sbs-green">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <p className="font-display text-lg font-extrabold text-sbs-dark sm:text-xl">
          🎉 C'est noté, {firstName} !
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-sbs-muted">
          On t'écrira quand on ouvrira un de tes axes — et seulement pour des choses utiles. Pas de spam, promis.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Ton prénom"
          placeholder="Mariama"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
          required
          disabled={status === 'loading'}
        />
        <Input
          label="Ton email"
          type="email"
          placeholder="mariama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={status === 'loading'}
          leftIcon={<Mail className="h-4 w-4" />}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold text-sbs-dark">
          Ta ville actuelle
        </label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          disabled={status === 'loading'}
          className="h-11 w-full rounded-btn border border-sbs-border bg-white px-3 text-sm font-medium text-sbs-dark transition-colors focus:border-sbs-blue focus:outline-none focus:ring-2 focus:ring-sbs-blue/20"
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold text-sbs-dark">
          Tu veux être prévenu·e quand on ouvre quel(s) axe(s) ?
        </label>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {AXES.map((axis) => {
            const checked = selectedAxes.includes(axis.id);
            return (
              <label
                key={axis.id}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-btn border px-3 py-2 text-xs font-semibold transition-colors',
                  checked
                    ? 'border-sbs-blue bg-sbs-blue-light text-sbs-blue'
                    : 'border-sbs-border bg-white text-sbs-muted hover:border-sbs-blue/40 hover:bg-sbs-blue-light/50',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAxis(axis.id)}
                  disabled={status === 'loading'}
                  className="h-4 w-4 rounded border-sbs-border text-sbs-blue focus:ring-sbs-blue"
                />
                <span>{axis.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-btn border border-sbs-red/30 bg-sbs-red/5 p-3 text-sm text-sbs-red">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={status === 'loading'}
        className="w-full rounded-pill"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>On t'inscrit…</span>
          </>
        ) : (
          <span>M'inscrire à la newsletter diaspora</span>
        )}
      </Button>

      <p className="text-center text-[11px] text-sbs-muted">
        Pas de spam. Une email par mois maximum, quand on a quelque chose d'utile à te dire.
        Désinscription en 1 clic.
      </p>
    </form>
  );
}
