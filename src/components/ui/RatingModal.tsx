import { useState } from 'react';
import { Star, X, Loader2, CheckCircle2 } from 'lucide-react';
import { ApiClient, ApiError, type ApiBookingWithTrip } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { findCity } from '@/data/cities';

interface RatingModalProps {
  booking: ApiBookingWithTrip;
  onClose: () => void;
  onSuccess: () => void;
}

export function RatingModal({ booking, onClose, onSuccess }: RatingModalProps) {
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const driverName = `${booking.trip.driver.firstName} ${booking.trip.driver.lastName}`;
  const fromCity = findCity(booking.trip.fromCity)?.name ?? booking.trip.fromCity;
  const toCity = findCity(booking.trip.toCity)?.name ?? booking.trip.toCity;

  const LABELS = ['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent'];

  async function handleSubmit() {
    if (score === 0) return;
    setLoading(true);
    setError(null);
    try {
      await ApiClient.submitRating({
        bookingId: booking.id,
        score,
        comment: comment.trim() || undefined,
      });
      setDone(true);
      setTimeout(() => onSuccess(), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors de l\'envoi de la note');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center">
      <div className="w-full max-w-sm rounded-card-lg border border-sbs-border bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sbs-border-soft px-5 py-4">
          <div>
            <p className="font-display text-base font-extrabold text-sbs-dark">
              {done ? 'Merci !' : 'Noter votre trajet'}
            </p>
            <p className="text-[11px] text-sbs-muted">{fromCity} → {toCity} · {driverName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-sbs-muted hover:text-sbs-dark">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 px-5 py-8">
            <CheckCircle2 className="h-10 w-10 text-sbs-green" />
            <p className="text-sm font-semibold text-sbs-dark">Note envoyée avec succès !</p>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-5">
            {/* Étoiles */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScore(s)}
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110 active:scale-95"
                    aria-label={`${s} étoile${s > 1 ? 's' : ''}`}
                  >
                    <Star
                      className="h-9 w-9"
                      fill={(hovered || score) >= s ? '#F59E0B' : 'transparent'}
                      stroke={(hovered || score) >= s ? '#F59E0B' : '#D1D5DB'}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm font-semibold text-sbs-dark min-h-[20px]">
                {LABELS[hovered || score]}
              </p>
            </div>

            {/* Commentaire optionnel */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-sbs-dark">
                Commentaire <span className="font-normal text-sbs-muted">(optionnel)</span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ponctualité, conduite, propreté du véhicule…"
                className="w-full resize-none rounded-card border border-sbs-border px-3 py-2 text-sm text-sbs-dark placeholder:text-sbs-muted/60 focus:border-sbs-blue focus:outline-none"
              />
              <p className="mt-0.5 text-right text-[10px] text-sbs-muted">{comment.length}/500</p>
            </div>

            {error && (
              <p className="rounded-card border border-sbs-red/30 bg-sbs-red/5 px-3 py-2 text-[12px] text-sbs-red">
                {error}
              </p>
            )}

            <Button
              variant="primary"
              size="md"
              disabled={score === 0 || loading}
              onClick={handleSubmit}
              className="w-full rounded-pill"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</>
                : <><Star className="h-4 w-4" /> Envoyer ma note</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
