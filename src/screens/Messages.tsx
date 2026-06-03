import { useEffect, useState } from 'react';
import { ArrowLeft, MessageCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { TrustBadge } from '@/components/security/TrustBadge';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { useAuth } from '@/hooks/useAuth';
import { ApiClient, ApiError, type ApiConversation } from '@/lib/api';
import { findCity } from '@/data/cities';
import { MessageThread } from './MessageThread';
import { cn, formatDate, formatTime } from '@/lib/utils';
import type { Conversation, Screen } from '@/lib/types';

interface MessagesProps {
  onNavigate: (s: Screen) => void;
}

export function Messages({ onNavigate }: MessagesProps) {
  const { isAuthenticated, user } = useAuth();
  const [conversations, setConversations] = useState<ApiConversation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Chargement initial + polling 10 s pour voir les nouvelles conv / derniers messages.
  // Polling suspendu quand l'onglet est masqué. Suspendu aussi quand un thread
  // est ouvert (`openId` non null) car MessageThread gère son propre polling.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function fetchOnce(showLoader: boolean) {
      if (showLoader) { setLoading(true); setError(null); }
      try {
        const { conversations } = await ApiClient.getConversations();
        if (!cancelled) setConversations(conversations);
      } catch (err) {
        if (cancelled) return;
        // N'affiche l'erreur que pendant le premier chargement — un poll qui rate
        // ne doit pas écraser la liste actuelle.
        if (showLoader) setError(err instanceof ApiError ? err.message : 'Chargement impossible');
      } finally {
        if (!cancelled && showLoader) setLoading(false);
      }
    }

    fetchOnce(true);

    function startPolling() {
      if (timer || document.hidden || openId !== null) return;
      timer = setInterval(() => { fetchOnce(false); }, 10_000);
    }
    function stopPolling() {
      if (timer) { clearInterval(timer); timer = null; }
    }
    function onVisibility() {
      if (document.hidden) stopPolling();
      else { fetchOnce(false); startPolling(); }
    }

    startPolling();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isAuthenticated, reloadKey, openId]);

  if (!isAuthenticated) {
    return (
      <AuthGateModal
        action="accéder à votre messagerie"
        onClose={() => onNavigate('landing')}
        onLogin={() => onNavigate('login')}
        onRegister={() => onNavigate('onboarding')}
      />
    );
  }

  const myId = user?.id ?? '';
  const openConv = openId
    ? conversations?.find((c) => c.id === openId)
    : null;

  // Quand on ouvre un thread, on délègue à MessageThread (adapté à `Conversation` UI).
  if (openConv) {
    const uiConv = apiConvToUi(openConv, myId);
    return (
      <MessageThread
        conversation={uiConv}
        backendConversationId={openConv.id}
        onBack={() => { setOpenId(null); setReloadKey((k) => k + 1); }}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-sbs-cream pb-24">
      <header className="sticky top-0 z-30 border-b border-sbs-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="grid h-10 w-10 place-items-center rounded-pill border border-sbs-border text-sbs-dark transition-colors hover:bg-sbs-border-soft"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <SbsLogo size="sm" />
            <div className="leading-tight">
              <div className="font-display text-base font-extrabold tracking-tight">Messagerie</div>
              <div className="text-[10px] text-sbs-muted">
                {conversations ? `${conversations.length} conversation(s)` : 'Chargement…'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Bandeau sécurité */}
        <div className="mb-5 rounded-card border border-sbs-blue/15 bg-sbs-blue-light/30 p-3 text-[12px] leading-relaxed text-sbs-blue">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Tous les échanges sont <strong>chiffrés</strong>. Les numéros de téléphone partagés
              sont automatiquement masqués pour protéger votre vie privée.
            </span>
          </p>
        </div>

        {loading && (
          <div className="rounded-card-lg border border-sbs-border bg-white p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-sbs-blue" />
            <p className="mt-2 text-sm text-sbs-muted">Chargement des conversations…</p>
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="rounded-card border border-sbs-red/30 bg-white p-5 text-sm text-sbs-red shadow-soft">
            <p className="font-semibold">{error}</p>
            <Button
              variant="ghost" size="md"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-3"
            >
              Réessayer
            </Button>
          </div>
        )}

        {!loading && !error && conversations && conversations.length === 0 && (
          <EmptyState onNavigate={onNavigate} />
        )}

        {!loading && !error && conversations && conversations.length > 0 && (
          <ul className="space-y-2">
            {conversations.map((c) => {
              const other = c.driverId === myId ? c.passenger : c.driver;
              const otherName = `${other.firstName} ${other.lastName}`;
              const otherTrust = other.trustLevel.toLowerCase() as 'basic' | 'verified' | 'premium';
              const fromCity = findCity(c.trip.fromCity)?.name ?? c.trip.fromCity;
              const toCity = findCity(c.trip.toCity)?.name ?? c.trip.toCity;
              const tripSummary = `${fromCity} → ${toCity} · ${formatDate(new Date(c.trip.departureAt))} ${formatTime(new Date(c.trip.departureAt))}`;
              const lastMsg = c.messages[0];
              const lastSent = lastMsg ? new Date(lastMsg.sentAt) : null;
              // unreadCount approximé : pas exposé par l'API, on l'omet pour l'instant
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(c.id)}
                    className="flex w-full items-center gap-3 rounded-card-lg border border-sbs-border bg-white p-3.5 text-left shadow-soft transition-all hover:border-sbs-blue/40 hover:shadow-card sm:p-4"
                  >
                    <div className="relative shrink-0">
                      <Avatar name={otherName} size="lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-sm font-extrabold text-sbs-dark truncate">{otherName}</span>
                          <TrustBadge level={otherTrust} size="sm" showLabel={false} />
                        </div>
                        {lastSent && (
                          <span className="shrink-0 text-[10px] text-sbs-muted">
                            {formatRelativeTime(lastSent)}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-sbs-muted truncate">{tripSummary}</div>
                      {lastMsg && (
                        <p className={cn('mt-1 truncate text-xs text-sbs-muted')}>
                          {lastMsg.senderType === 'SYSTEM'
                            ? <span className="text-sbs-blue">SideBySide : </span>
                            : lastMsg.senderId === myId
                              ? <span>Moi : </span>
                              : null}
                          {lastMsg.content}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomNav active="messages" onNavigate={onNavigate} messagesUnread={0} />
    </div>
  );
}

function EmptyState({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div className="rounded-card-lg border border-dashed border-sbs-border bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-sbs-blue-light text-sbs-blue">
        <MessageCircle className="h-6 w-6" />
      </div>
      <p className="font-display text-base font-extrabold text-sbs-dark">Aucun message pour l'instant</p>
      <p className="mt-1 text-sm text-sbs-muted">
        Vous pourrez échanger avec vos chauffeurs (ou passagers) après votre première réservation.
      </p>
      <div className="mt-5">
        <Button variant="primary" size="md" onClick={() => onNavigate('search')} className="rounded-pill">
          Chercher un trajet
        </Button>
      </div>
    </div>
  );
}

function formatRelativeTime(d: Date): string {
  const diff = (Date.now() - d.getTime()) / 60_000; // minutes
  if (diff < 1) return "à l'instant";
  if (diff < 60) return `${Math.floor(diff)} min`;
  if (diff < 60 * 24) return `${Math.floor(diff / 60)} h`;
  if (diff < 60 * 24 * 7) return `${Math.floor(diff / (60 * 24))} j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/* ============================================================
   Adapter ApiConversation → Conversation (modèle UI legacy)
   ============================================================ */

function apiConvToUi(c: ApiConversation, myId: string): Conversation {
  const other = c.driverId === myId ? c.passenger : c.driver;
  const otherName = `${other.firstName} ${other.lastName}`;
  const otherTrust = other.trustLevel.toLowerCase() as 'basic' | 'verified' | 'premium';
  const fromCity = findCity(c.trip.fromCity)?.name ?? c.trip.fromCity;
  const toCity = findCity(c.trip.toCity)?.name ?? c.trip.toCity;
  const dep = new Date(c.trip.departureAt);
  // Masquage simulé pour l'affichage — le vrai numéro reste sur le serveur.
  const otherMaskedPhone = '+237 6** ** ** **';
  return {
    id: c.id,
    tripId: c.tripId,
    otherUserName: otherName,
    otherTrustLevel: otherTrust,
    otherMaskedPhone,
    tripSummary: `${fromCity} → ${toCity} · ${formatDate(dep)} ${formatTime(dep)}`,
    messages: [], // chargés par MessageThread via API
    unreadCount: 0,
  };
}
