import { useEffect, useState } from 'react';
import { LogOut, Settings, Bell, ShieldCheck, FileText, HelpCircle, Smartphone, Star, Car, ChevronRight, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { TrustBadge } from '@/components/security/TrustBadge';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { useAuth } from '@/hooks/useAuth';
import { ApiClient, type ApiUserFull } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Screen } from '@/lib/types';

interface ProfileProps {
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}

export function Profile({ onNavigate }: ProfileProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const [fullUser, setFullUser] = useState<ApiUserFull | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Charge le profil complet (stats + statuts KYC) au montage.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    ApiClient.meFull()
      .then(({ user }) => { if (!cancelled) setFullUser(user); })
      .catch(() => { /* silencieux — on retombe sur les infos light de useAuth */ });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <AuthGateModal
        action="accéder à votre profil"
        onClose={() => onNavigate('landing')}
        onLogin={() => onNavigate('login')}
        onRegister={() => onNavigate('onboarding')}
      />
    );
  }

  // Source des données : on préfère `fullUser` (riche), avec fallback sur `user` (léger).
  const display = fullUser ?? user;
  const trustLevel = (display.trustLevel.toLowerCase() as 'basic' | 'verified' | 'premium');

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      onNavigate('landing');
    }
  }

  return (
    <div className="min-h-screen bg-sbs-cream pb-24">
      {/* Header */}
      <header className="border-b border-sbs-border bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:px-6">
          <SbsLogo size="sm" />
          <span className="font-display text-base font-extrabold tracking-tight">Mon profil</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* Carte de profil */}
        <section className="rounded-card-lg border border-sbs-border bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-4">
            <Avatar name={`${display.firstName} ${display.lastName}`} size="xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-xl font-extrabold text-sbs-dark">
                  {display.firstName} {display.lastName}
                </span>
                <TrustBadge level={trustLevel} size="sm" />
              </div>
              <div className="mt-1 font-mono text-xs text-sbs-muted">{display.phone}</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-sbs-muted">
                {display.role === 'DRIVER' ? <Car className="h-3 w-3" /> : <Smartphone className="h-3 w-3" />}
                {display.role === 'DRIVER' ? 'Chauffeur' : 'Passager'}
              </div>
            </div>
          </div>

          {/* Stats — uniquement quand fullUser chargé */}
          {fullUser && (
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-sbs-border-soft pt-4">
              <Stat
                icon={<Star className="h-4 w-4" />}
                label="Note moyenne"
                value={fullUser.ratingAvg != null ? fullUser.ratingAvg.toFixed(1) : '—'}
              />
              <Stat
                icon={<Car className="h-4 w-4" />}
                label="Trajets effectués"
                value={String(fullUser.tripsCompleted)}
              />
            </div>
          )}

          {!fullUser && (
            <div className="mt-3 flex items-center gap-2 border-t border-sbs-border-soft pt-3 text-[11px] text-sbs-muted">
              <Loader2 className="h-3 w-3 animate-spin" />
              Chargement des statistiques…
            </div>
          )}

          {/* Bio si présente */}
          {fullUser?.bio && (
            <div className="mt-4 rounded-card border border-sbs-border-soft bg-sbs-cream p-3">
              <p className="text-[12px] italic text-sbs-dark">« {fullUser.bio} »</p>
            </div>
          )}
        </section>

        {/* Récap niveau de confiance */}
        <section className="mt-4 rounded-card-lg border border-sbs-blue/15 bg-sbs-blue-light/30 p-4 sm:p-5">
          <h3 className="mb-2 font-display text-sm font-extrabold text-sbs-blue">
            🛡️ Votre niveau de confiance
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-xs text-sbs-dark">Niveau actuel</span>
            <TrustBadge level={trustLevel} size="md" />
          </div>
          {trustLevel === 'basic' && (
            <p className="mt-2 text-[11px] text-sbs-blue">
              Validez votre CNI et selfie pour passer en niveau Vérifié.
            </p>
          )}
          {trustLevel === 'verified' && (
            <p className="mt-2 text-[11px] text-sbs-blue">
              Effectuez 20 trajets sans incident pour gagner le badge Premium.
            </p>
          )}

          {/* Détail KYC quand on a fullUser */}
          {fullUser && (
            <ul className="mt-3 space-y-1.5 border-t border-sbs-blue/15 pt-3 text-[11px]">
              <KycRow ok={fullUser.identityVerified} label="Identité (CNI)" />
              <KycRow ok={fullUser.selfieMatched} label="Selfie vérifié" />
              {display.role === 'DRIVER' && (
                <KycRow ok={fullUser.licenseVerified} label="Permis de conduire" />
              )}
            </ul>
          )}
        </section>

        {/* Liens menu */}
        <section className="mt-4 overflow-hidden rounded-card-lg border border-sbs-border bg-white shadow-soft">
          <MenuLink
            icon={<Star className="h-4 w-4" />}
            label="Mes avis"
            sublabel="Évaluations reçues"
          />
          <MenuLink
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Vérification d'identité"
            sublabel="CNI, selfie, permis"
          />
          <MenuLink
            icon={<Bell className="h-4 w-4" />}
            label="Notifications"
            sublabel="SMS, push, e-mail"
          />
          <MenuLink
            icon={<Settings className="h-4 w-4" />}
            label="Paramètres"
            sublabel="Mot de passe, langue"
          />
          <MenuLink
            icon={<HelpCircle className="h-4 w-4" />}
            label="Aide & support"
            sublabel="FAQ, contacter l'équipe"
          />
          <MenuLink
            icon={<FileText className="h-4 w-4" />}
            label="Mentions légales"
            sublabel="CGU, confidentialité"
            isLast
          />
        </section>

        {/* Déconnexion */}
        <Button
          variant="ghost"
          size="lg"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-6 w-full rounded-pill text-sbs-red hover:bg-red-50"
        >
          {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
        </Button>

        <p className="mt-4 text-center text-[10px] text-sbs-muted">
          SideBySide v0.3 · Made in Cameroon 🇨🇲
        </p>
      </main>

      <BottomNav active="profile" onNavigate={onNavigate} messagesUnread={0} />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-card border border-sbs-border-soft bg-sbs-cream px-3 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-card bg-sbs-blue-light text-sbs-blue">
        {icon}
      </span>
      <div>
        <div className="font-display text-base font-extrabold leading-tight text-sbs-dark">{value}</div>
        <div className="text-[10px] text-sbs-muted">{label}</div>
      </div>
    </div>
  );
}

function KycRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok
        ? <CheckCircle2 className="h-3.5 w-3.5 text-sbs-green" />
        : <XCircle className="h-3.5 w-3.5 text-sbs-muted" />}
      <span className={cn(ok ? 'font-semibold text-sbs-dark' : 'text-sbs-muted')}>{label}</span>
      {!ok && <span className="ml-auto text-[10px] text-sbs-muted">À valider</span>}
    </li>
  );
}

function MenuLink({ icon, label, sublabel, isLast }: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  isLast?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-sbs-border-soft',
        !isLast && 'border-b border-sbs-border-soft',
      )}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-card bg-sbs-blue-light text-sbs-blue">
        {icon}
      </span>
      <div className="flex-1">
        <div className="text-sm font-semibold text-sbs-dark">{label}</div>
        {sublabel && <div className="text-[11px] text-sbs-muted">{sublabel}</div>}
      </div>
      <ChevronRight className="h-4 w-4 text-sbs-muted" />
    </button>
  );
}
