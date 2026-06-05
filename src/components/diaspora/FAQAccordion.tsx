/**
 * FAQAccordion — accordéon FAQ accessible.
 *
 * Une seule question peut être ouverte à la fois (UX classique d'accordéon).
 * Utilise les patterns ARIA (button + aria-expanded + region).
 */
import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FAQItem {
  /** Identifiant unique (utilisé pour les ID HTML d'accessibilité). */
  id: string;
  question: string;
  answer: ReactNode;
}

interface FAQAccordionProps {
  items: FAQItem[];
  /** ID de la question ouverte par défaut. Si omis, toutes fermées. */
  defaultOpenId?: string;
}

export function FAQAccordion({ items, defaultOpenId }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isOpen = openId === item.id;
        const buttonId = `faq-q-${item.id}`;
        const panelId = `faq-p-${item.id}`;
        return (
          <div
            key={item.id}
            className={cn(
              'overflow-hidden rounded-card-lg border bg-white transition-all',
              isOpen
                ? 'border-sbs-blue/30 shadow-card'
                : 'border-sbs-border shadow-soft hover:border-sbs-blue/30',
            )}
          >
            <button
              type="button"
              id={buttonId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5 sm:py-5"
            >
              <span className="font-display text-sm font-extrabold text-sbs-dark sm:text-base">
                {item.question}
              </span>
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all',
                  isOpen
                    ? 'rotate-180 bg-sbs-blue text-white'
                    : 'bg-sbs-blue-light text-sbs-blue',
                )}
              >
                <ChevronDown className="h-4 w-4" />
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-4 pb-5 text-sm leading-relaxed text-sbs-muted sm:px-5"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
