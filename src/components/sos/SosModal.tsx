import { useEffect, useState } from 'react';
import { X, Siren, MapPin, AlertTriangle, Loader2, CheckCircle2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EMERGENCY_CONTACTS, telUrl } from '@/lib/sos';
import { cn } from '@/lib/utils';
import type { SosEmergency } from '@/lib/sos';

interface SosModalProps {
  onClose: () => void;
}

const toneClasses: Record<SosEmergency['tone'], { bg: string; ring: string; text: string }> = {
  red:    { bg: 'bg-sbs-red text-white',           ring: 'ring-sbs-red/30',    text: 'text-sbs-red' },
  orange: { bg: 'bg-orange-500 text-white',        ring: 'ring-orange-300',    text: 'text-orange-600' },
  blue:   { bg: 'bg-sbs-blue text-white',          ring: 'ring-sbs-blue/30',   text: 'text-sbs-blue' },
  green:  { bg: 'bg-sbs-green text-white',         ring: 'ring-emerald-300',   text: 'text-sbs-green' },
};

export function SosModal({ onClose }: SosModalProps) {
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationShared, setLocationShared] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Empêcher le scroll de la page derrière
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Fermer avec Échap
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  function shareLocation() {
    setSharingLocation(true);
    setLocationError(null);
    if (!('geolocation' in navigator)) {
      setSharingLocation(false);
      setLocationError("La géolocalisation n'est pas disponible sur ce navigateur");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://maps.google.com/?q=${latitude},${longitude}`;
        setSharingLocation(false);
        setLocationShared(url);
      },
      (err) => {
        setSharingLocation(false);
        setLocationError(err.message || 'Impossible de récupérer votre position');
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function copyAndShare(url: string) {
    if (navigator.share) {
      navigator.share({
        title: 'Ma position SideBySide',
        text: 'Je partage ma position en temps réel, retrouvez-moi ici :',
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-t-card-lg bg-white shadow-card-hover sm:rounded-card-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bandeau rouge */}
        <header className="relative bg-gradient-to-br from-sbs-red to-red-700 px-5 py-5 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/20">
              <Siren className="h-7 w-7" />
            </div>
            <div>
              <h2 id="sos-title" className="font-display text-xl font-extrabold leading-tight">
                Urgence SOS
              </h2>
              <p className="text-[12px] leading-snug opacity-90">
                Vous êtes en danger ou en difficulté ? Voici vos options.
              </p>
            </div>
          </div>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {/* Contacts d'urgence */}
          <ul className="space-y-2">
            {EMERGENCY_CONTACTS.map((c) => {
              const tone = toneClasses[c.tone];
              const isLocationShare = c.id === 'share-location';

              if (isLocationShare) {
                return (
                  <li key={c.id}>
                    {locationShared ? (
                      <div className="rounded-card-lg border-2 border-sbs-green bg-sbs-green/5 p-3.5">
                        <div className="mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-sbs-green" />
                          <span className="font-display text-sm font-extrabold text-sbs-dark">
                            Position prête à être partagée
                          </span>
                        </div>
                        <p className="break-all rounded-card bg-white px-3 py-2 font-mono text-[10px] text-sbs-dark border border-sbs-border-soft">
                          {locationShared}
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => copyAndShare(locationShared)}
                          className="mt-2 w-full rounded-pill"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          Envoyer à un proche
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={shareLocation}
                        disabled={sharingLocation}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-card-lg border-2 border-sbs-border bg-white p-3.5 text-left transition-all hover:border-sbs-green/40 hover:shadow-soft',
                          sharingLocation && 'opacity-60',
                        )}
                      >
                        <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-card text-2xl', tone.bg)} aria-hidden>
                          {sharingLocation ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-display text-sm font-extrabold text-sbs-dark">{c.label}</div>
                          <div className="text-xs text-sbs-muted">
                            {sharingLocation ? 'Récupération de votre position GPS…' : c.description}
                          </div>
                        </div>
                      </button>
                    )}
                    {locationError && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-sbs-red">
                        <AlertTriangle className="h-3 w-3" />
                        {locationError}
                      </p>
                    )}
                  </li>
                );
              }

              return (
                <li key={c.id}>
                  <a
                    href={c.phone ? telUrl(c.phone) : undefined}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-card-lg border-2 border-sbs-border bg-white p-3.5 transition-all hover:border-sbs-red/30 hover:shadow-soft"
                  >
                    <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-card text-2xl', tone.bg)} aria-hidden>
                      {c.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-sm font-extrabold text-sbs-dark">{c.label}</div>
                      <div className="text-xs text-sbs-muted">{c.description}</div>
                    </div>
                    {c.phone && (
                      <span className={cn('font-mono text-base font-extrabold tabular-nums', tone.text)}>
                        {c.phone}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Conseil sécurité */}
          <div className="mt-4 rounded-card border border-sbs-yellow/40 bg-sbs-yellow-light/40 p-3 text-[11px] leading-relaxed text-sbs-yellow-dark">
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                <strong>Conseil :</strong> en cas d'urgence vitale, appelez d'abord les secours (117/119),
                puis partagez votre position avec un proche. SideBySide est alerté automatiquement
                de toute activation du bouton SOS.
              </span>
            </p>
          </div>
        </div>

        {/* Footer rassurant */}
        <footer className="border-t border-sbs-border bg-sbs-cream px-5 py-3">
          <p className="text-center text-[10px] text-sbs-muted">
            SideBySide enregistre la date d'activation SOS pour vous protéger.
            Votre position n'est partagée qu'à votre demande.
          </p>
        </footer>
      </div>
    </div>
  );
}
