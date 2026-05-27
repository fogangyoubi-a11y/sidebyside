import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TrustBadge } from '@/components/security/TrustBadge';
import { SosButton } from '@/components/sos/SosButton';
import { maskPhones, QUICK_REPLIES } from '@/lib/messages';
import { cn, formatTime } from '@/lib/utils';
import type { Conversation, Message, Screen } from '@/lib/types';

interface MessageThreadProps {
  conversation: Conversation;
  onBack: () => void;
  onNavigate: (s: Screen) => void;
}

export function MessageThread({ conversation, onBack, onNavigate }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll en bas à chaque nouveau message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  function sendDraft(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const safe = maskPhones(trimmed);
    const newMsg: Message = {
      id: `m${Date.now()}`,
      sender: 'me',
      text: safe,
      sentAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setDraft('');
    // Auto-réponse mock après 1.5s
    setTimeout(() => {
      const reply: Message = {
        id: `m${Date.now() + 1}`,
        sender: 'other',
        text: 'Bien reçu, merci 👍',
        sentAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  }

  return (
    <div className="flex h-screen flex-col bg-sbs-cream">
      {/* Header */}
      <header className="shrink-0 border-b border-sbs-border bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="grid h-10 w-10 place-items-center rounded-pill border border-sbs-border text-sbs-dark transition-colors hover:bg-sbs-border-soft"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('trip-detail')}
            className="flex flex-1 items-center gap-3 text-left min-w-0"
            aria-label="Voir détails du trajet"
          >
            <Avatar name={conversation.otherUserName} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-sm font-extrabold text-sbs-dark truncate">
                  {conversation.otherUserName}
                </span>
                {conversation.otherTrustLevel && <TrustBadge level={conversation.otherTrustLevel} size="sm" showLabel={false} />}
              </div>
              <div className="text-[11px] text-sbs-muted truncate">{conversation.tripSummary}</div>
            </div>
          </button>
          {/* SOS dans le header */}
          <SosButton variant="header" />
        </div>
        {/* Bandeau sécurité */}
        <div className="border-t border-sbs-blue/15 bg-sbs-blue-light/30 px-4 py-2 text-center text-[10px] font-semibold text-sbs-blue sm:px-6">
          <ShieldCheck className="mr-1 inline h-3 w-3" />
          Numéro masqué : <span className="font-mono">{conversation.otherMaskedPhone}</span> · Chat chiffré
        </div>
      </header>

      {/* Liste des messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3">
          {messages.map((m, idx) => {
            const showAvatar = m.sender === 'other' && (idx === 0 || messages[idx - 1]!.sender !== 'other');
            return <MessageBubble key={m.id} msg={m} showAvatar={showAvatar} authorName={conversation.otherUserName} />;
          })}
        </div>
      </div>

      {/* Quick replies + composer */}
      <div className="shrink-0 border-t border-sbs-border bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* Quick replies */}
          <div className="scrollbar-hide flex gap-2 overflow-x-auto py-2.5">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => sendDraft(reply)}
                className="shrink-0 rounded-pill border border-sbs-border bg-sbs-cream px-3 py-1.5 text-[11px] font-semibold text-sbs-dark transition-colors hover:border-sbs-blue hover:bg-sbs-blue-light"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Composer */}
          <div className="flex items-end gap-2 pb-3 pt-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDraft(draft); }
              }}
              rows={1}
              placeholder="Écrivez un message…"
              className="min-h-[42px] flex-1 resize-none rounded-card border border-sbs-border bg-white px-3 py-2.5 text-sm text-sbs-dark placeholder:text-sbs-muted/70 focus:border-sbs-blue focus:outline-none focus:ring-2 focus:ring-sbs-blue/20"
              style={{ maxHeight: '120px' }}
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => sendDraft(draft)}
              disabled={!draft.trim()}
              className="rounded-pill px-4"
              aria-label="Envoyer"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Notice de modération */}
          {/^(\+?237)?[\s.-]?[26][\d\s.-]{7,}/.test(draft) && (
            <div className="mb-3 flex items-start gap-2 rounded-card border border-sbs-yellow/40 bg-sbs-yellow-light/60 px-3 py-2 text-[10px] text-sbs-yellow-dark">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Les numéros de téléphone seront automatiquement masqués. Préférez la messagerie SideBySide
                pour rester protégé.
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function MessageBubble({ msg, showAvatar, authorName }: { msg: Message; showAvatar: boolean; authorName: string }) {
  const time = formatTime(new Date(msg.sentAt));

  if (msg.sender === 'system') {
    return (
      <div className="my-2 flex items-center justify-center">
        <div className="inline-flex items-center gap-1.5 rounded-pill bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-sbs-green">
          <Sparkles className="h-3 w-3" />
          {msg.text}
        </div>
      </div>
    );
  }

  const isMe = msg.sender === 'me';

  return (
    <div className={cn('flex items-end gap-2', isMe ? 'flex-row-reverse' : 'flex-row')}>
      {!isMe && (
        <div className="w-8 shrink-0">
          {showAvatar && <Avatar name={authorName} size="sm" />}
        </div>
      )}
      <div className={cn('max-w-[75%]', isMe ? 'items-end' : 'items-start', 'flex flex-col gap-0.5')}>
        <div
          className={cn(
            'rounded-card px-3.5 py-2 text-sm leading-relaxed shadow-soft',
            isMe
              ? 'bg-sbs-blue text-white rounded-br-sm'
              : 'bg-white text-sbs-dark rounded-bl-sm border border-sbs-border-soft',
          )}
        >
          {msg.text}
        </div>
        <span className="px-1 text-[10px] text-sbs-muted">
          {time}{isMe && msg.read ? ' · Vu' : ''}
        </span>
      </div>
    </div>
  );
}

/* utility class for the success green-light tone */
// (declared via tailwind theme; if missing, fallback to bg-sbs-green/15)
