import { useState } from 'react';
import { Search, Car, Calendar, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import type { Screen } from '@/lib/types';

/** Onglet actif sur la barre du bas. */
export type BottomTab = 'search' | 'publish' | 'trips' | 'messages' | 'profile';

interface BottomNavProps {
  /** Onglet actuellement actif (mis en surbrillance). */
  active?: BottomTab;
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
  /** Compteur affiché en pastille sur l'onglet Messages (0 = pas affiché). */
  messagesUnread?: number;
}

interface TabDef {
  id: BottomTab;
  label: string;
  icon: typeof Search;
  /** Écran cible. */
  screen: Screen;
  /** Si vrai, ouvre la popup d'auth si l'utilisateur n'est pas connecté. */
  requiresAuth: boolean;
  /** Texte affiché dans la popup d'auth si non connecté. */
  authAction?: string;
}

const TABS: TabDef[] = [
  { id: 'search',   label: 'Recherche',   icon: Search,         screen: 'search',       requiresAuth: false },
  { id: 'publish',  label: 'Publier',     icon: Car,            screen: 'publish-trip', requiresAuth: true,  authAction: 'publier un trajet en tant que chauffeur' },
  { id: 'trips',    label: 'Vos trajets', icon: Calendar,       screen: 'my-trips',     requiresAuth: true,  authAction: 'voir vos trajets' },
  { id: 'messages', label: 'Messages',    icon: MessageCircle,  screen: 'messages',     requiresAuth: true,  authAction: 'accéder à votre messagerie' },
  { id: 'profile',  label: 'Profil',      icon: User,           screen: 'profile',      requiresAuth: true,  authAction: 'accéder à votre profil' },
];

/**
 * Barre de navigation fixe en bas d'écran — style Uber / BlaBlaCar.
 * 5 onglets : Recherche, Publier, Vos trajets, Messages, Profil.
 *
 * - Sticky en bas, toujours visible sur les écrans principaux
 * - L'onglet actif est mis en évidence (couleur bleue + ligne du haut)
 * - Auth gate auto : si l'utilisateur n'est pas connecté, popup login/register
 * - Bonus : badge rouge sur Messages si messages non lus
 */
export function BottomNav({ active, onNavigate, messagesUnread = 0 }: BottomNavProps) {
  const { isAuthenticated } = useAuth();
  const [authGate, setAuthGate] = useState<TabDef | null>(null);

  function handleTabClick(tab: TabDef) {
    if (tab.requiresAuth && !isAuthenticated) {
      setAuthGate(tab);
      return;
    }
    onNavigate(tab.screen);
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-sbs-border bg-white/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(15,23,42,0.04)]"
        role="navigation"
        aria-label="Navigation principale"
      >
        <div className="mx-auto flex max-w-3xl items-stretch justify-around">
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            const Icon = tab.icon;
            const showBadge = tab.id === 'messages' && messagesUnread > 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors',
                  isActive ? 'text-sbs-blue' : 'text-sbs-muted hover:text-sbs-dark',
                )}
              >
                {/* Indicateur ligne en haut quand actif */}
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-b-pill bg-sbs-blue"
                  />
                )}
                <span className="relative grid h-6 w-6 place-items-center">
                  <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
                  {showBadge && (
                    <span
                      aria-hidden
                      className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-sbs-red px-1 text-[9px] font-extrabold text-white shadow-soft"
                    >
                      {messagesUnread > 9 ? '9+' : messagesUnread}
                    </span>
                  )}
                </span>
                <span className={cn('text-[10px] font-semibold leading-none', isActive && 'font-extrabold')}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
        {/* Safe area iOS : padding pour les iPhones avec encoche */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" aria-hidden />
      </nav>

      {/* Modal d'auth — apparaît si l'utilisateur clique un onglet protégé sans être connecté */}
      {authGate && (
        <AuthGateModal
          action={authGate.authAction ?? `accéder à ${authGate.label}`}
          onClose={() => setAuthGate(null)}
          onLogin={() => { setAuthGate(null); onNavigate('login'); }}
          onRegister={() => { setAuthGate(null); onNavigate('onboarding'); }}
        />
      )}
    </>
  );
}

/**
 * Hauteur réservée pour la BottomNav (utile pour ajouter du padding-bottom
 * aux conteneurs des écrans qui la contiennent).
 */
export const BOTTOM_NAV_HEIGHT_CLASS = 'pb-20';
