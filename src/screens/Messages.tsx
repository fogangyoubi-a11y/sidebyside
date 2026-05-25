import { useState } from 'react';
import { ArrowLeft, MessageCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { TrustBadge } from '@/components/security/TrustBadge';
import { MOCK_CONVERSATIONS, findConversation } from '@/lib/messages';
import { MessageThread } from './MessageThread';
import { cn } from '@/lib/utils';
import type { Screen } from '@/lib/types';

interface MessagesProps {
  onNavigate: (s: Screen) => void;
}

export function Messages({ onNavigate }: MessagesProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const conversation = openId ? findConversation(openId) : null;

  if (conversation) {
    return (
      <MessageThread
        conversation={conversation}
        onBack={() => setOpenId(null)}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-sbs-cream">
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
              <div className="text-[10px] text-sbs-muted">{MOCK_CONVERSATIONS.length} conversation(s)</div>
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

        {MOCK_CONVERSATIONS.length === 0 ? (
          <EmptyState onNavigate={onNavigate} />
        ) : (
          <ul className="space-y-2">
            {MOCK_CONVERSATIONS.map((c) => {
              const lastMsg = c.messages[c.messages.length - 1];
              const lastSent = lastMsg ? new Date(lastMsg.sentAt) : null;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(c.id)}
                    className="flex w-full items-center gap-3 rounded-card-lg border border-sbs-border bg-white p-3.5 text-left shadow-soft transition-all hover:border-sbs-blue/40 hover:shadow-card sm:p-4"
                  >
                    <div className="relative shrink-0">
                      <Avatar name={c.otherUserName} size="lg" />
                      {c.unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-sbs-red px-1 text-[10px] font-extrabold text-white shadow-soft">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-sm font-extrabold text-sbs-dark truncate">{c.otherUserName}</span>
                          {c.otherTrustLevel && <TrustBadge level={c.otherTrustLevel} size="sm" showLabel={false} />}
                        </div>
                        {lastSent && (
                          <span className={cn('shrink-0 text-[10px]', c.unreadCount > 0 ? 'font-bold text-sbs-blue' : 'text-sbs-muted')}>
                            {formatRelativeTime(lastSent)}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-sbs-muted">{c.tripSummary}</div>
                      {lastMsg && (
                        <p className={cn(
                          'mt-1 truncate text-xs',
                          c.unreadCount > 0 ? 'font-semibold text-sbs-dark' : 'text-sbs-muted',
                        )}>
                          {lastMsg.sender === 'me'     && <span className="text-sbs-muted">Moi : </span>}
                          {lastMsg.sender === 'system' && <span className="text-sbs-blue">SideBySide : </span>}
                          {lastMsg.text}
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

// unused-keep
void Badge;
