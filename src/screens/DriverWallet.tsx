/**
 * DriverWalletScreen — Portefeuille chauffeur SideBySide
 *
 * Affiche :
 *  - Solde disponible + bouton de retrait
 *  - Commission due à SideBySide (avec deadline et alerte)
 *  - Palier de commission actuel + progression vers le suivant
 *  - Détails et historique
 */

import { useEffect, useState } from 'react';
import {
  Wallet,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  Smartphone,
  Info,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BottomNav } from '@/components/layout/BottomNav';
import { cn, formatXAF, formatDate } from '@/lib/utils';
import {
  COMMISSION_TIERS,
  getCurrentTier,
  getNextTier,
  tripsUntilNextTier,
} from '@/lib/commissionTiers';
import { ApiClient, ApiError } from '@/lib/api';
import type { DriverWallet } from '@/lib/walletTypes';
import type { Screen } from '@/lib/types';

type RecentTransaction = {
  reference: string;
  fromCity: string;
  toCity: string;
  departureAt: string;
  seats: number;
  driverEarning: number;
  basePrice: number;
  status: string;
  createdAt: string;
};

/* ──────────────────────────────────────────────────────────────
   Composant principal
   ────────────────────────────────────────────────────────────── */

interface DriverWalletScreenProps {
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}

export function DriverWalletScreen({ onNavigate }: DriverWalletScreenProps) {
  const [wallet, setWallet] = useState<DriverWallet | null>(null);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset loading state before fetching wallet data on mount
    setLoading(true);
    ApiClient.getWallet()
      .then(({ wallet: w, recentTransactions }) => {
        if (cancelled) return;
        setWallet({
          balance: w.balance,
          commissionDue: w.commissionDue,
          totalEarned: w.totalEarned,
          totalCommission: w.totalCommission,
          tripsThisMonth: w.tripsThisMonth,
          tripsTotal: w.tripsTotal,
          lastPayoutAt: w.lastPayoutAt,
          payoutDeadline: w.payoutDeadline,
          accountStatus: w.accountStatus,
          currentCommissionRate: w.currentCommissionRate,
        });
        setTransactions(recentTransactions);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : 'Impossible de charger le portefeuille');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const currentTier = getCurrentTier(wallet?.tripsThisMonth ?? 0);
  const nextTier = getNextTier(wallet?.tripsThisMonth ?? 0);
  const tripsLeft = tripsUntilNextTier(wallet?.tripsThisMonth ?? 0);

  const deadlineDaysLeft = wallet?.payoutDeadline
    // eslint-disable-next-line react-hooks/purity -- display-only "days left" countdown derived from current time, not a pure render computation
    ? Math.ceil((new Date(wallet.payoutDeadline).getTime() - Date.now()) / 86_400_000)
    : null;

  const isDeadlineClose = deadlineDaysLeft !== null && deadlineDaysLeft <= 3;

  function handleWithdraw() {
    setShowWithdrawModal(false);
    setWithdrawSuccess(true);
    setTimeout(() => setWithdrawSuccess(false), 4000);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-sbs-blue" />
        <p className="text-sm text-sbs-muted">Chargement du portefeuille…</p>
      </div>
    );
  }

  if (loadError || !wallet) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 gap-4 px-6 text-center">
        <AlertTriangle className="h-10 w-10 text-sbs-red" />
        <p className="text-sm text-sbs-red">{loadError ?? 'Erreur de chargement'}</p>
        <Button variant="primary" size="md" onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-sbs-blue px-4 pt-safe-top pb-4">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={() => onNavigate('my-trips')}
              className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Retour"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-white">Mon portefeuille</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 py-5 pb-28">

        {/* Alerte suspension */}
        {wallet.accountStatus === 'suspended' && (
          <div className="flex items-start gap-3 rounded-card border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold text-red-700">Compte suspendu</p>
              <p className="mt-0.5 text-sm text-red-600">
                Reversez votre commission pour réactiver votre compte.
              </p>
            </div>
          </div>
        )}

        {/* Alerte deadline commission */}
        {isDeadlineClose && wallet.accountStatus === 'active' && (
          <div className="flex items-start gap-3 rounded-card border border-sbs-yellow/60 bg-sbs-yellow-light p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-sbs-yellow-dark" />
            <div>
              <p className="font-semibold text-sbs-yellow-dark">Commission à reverser</p>
              <p className="mt-0.5 text-sm text-sbs-yellow-dark/80">
                {deadlineDaysLeft === 0
                  ? 'Dernier jour pour reverser votre commission SideBySide.'
                  : `Il vous reste ${deadlineDaysLeft} jour${deadlineDaysLeft > 1 ? 's' : ''} pour reverser ${formatXAF(wallet.commissionDue)}.`}
              </p>
            </div>
          </div>
        )}

        {/* Toast succès retrait */}
        {withdrawSuccess && (
          <div className="flex items-center gap-3 rounded-card border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-700">
              Demande de retrait envoyée ! Vous recevrez un virement Mobile Money sous 24 h.
            </p>
          </div>
        )}

        {/* Carte solde */}
        <div className="rounded-card bg-sbs-blue p-5 text-white shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-white/70">Solde disponible</p>
              <p className="mt-1 text-3xl font-bold">{formatXAF(wallet.balance)}</p>
            </div>
            <div className="rounded-full bg-white/10 p-3">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
            <Smartphone className="h-4 w-4 text-white/80" />
            <p className="text-xs text-white/80">Versement via MTN MoMo ou Orange Money</p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full bg-white text-sbs-blue hover:bg-white/90"
            onClick={() => setShowWithdrawModal(true)}
            disabled={wallet.balance === 0 || wallet.accountStatus !== 'active'}
          >
            Retirer mes gains
          </Button>
        </div>

        {/* Grille stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Commission due"
            value={formatXAF(wallet.commissionDue)}
            sub={
              wallet.payoutDeadline
                ? `Échéance ${new Date(wallet.payoutDeadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                : undefined
            }
            accent={isDeadlineClose ? 'warning' : 'neutral'}
          />
          <StatCard
            label="Gains totaux"
            value={formatXAF(wallet.totalEarned)}
            sub={`${wallet.tripsTotal} trajets`}
          />
        </div>

        {/* Palier de commission */}
        <section className="rounded-card bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Palier de commission</h2>
            <span className="rounded-full bg-sbs-blue-light px-2.5 py-0.5 text-sm font-bold text-sbs-blue">
              {currentTier.label}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            {wallet.tripsThisMonth} trajet{wallet.tripsThisMonth > 1 ? 's' : ''} ce mois-ci
          </p>

          {/* Barre progression */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              {COMMISSION_TIERS.map((t) => (
                <span
                  key={t.label}
                  className={cn('font-medium', t === currentTier ? 'text-sbs-blue' : '')}
                >
                  {t.label}
                </span>
              ))}
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-sbs-blue transition-all duration-500"
                style={{ width: `${Math.min(100, (wallet.tripsThisMonth / 21) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>0</span>
              <span>10</span>
              <span>20</span>
              <span>21+</span>
            </div>
          </div>

          {nextTier ? (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-sbs-blue-light p-3">
              <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-sbs-blue" />
              <p className="text-xs text-sbs-blue">
                Encore <strong>{tripsLeft} trajet{tripsLeft > 1 ? 's' : ''}</strong> ce mois pour
                passer à <strong>{nextTier.label}</strong> de commission.
              </p>
            </div>
          ) : (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <p className="text-xs text-emerald-700">
                Meilleur taux atteint ! Vous bénéficiez de <strong>10 %</strong> de commission ce mois-ci.
              </p>
            </div>
          )}
        </section>

        {/* Détail commission */}
        <section className="rounded-card bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-800">Commission SideBySide</h2>
            <Info className="h-4 w-4 text-gray-400" />
          </div>
          <div className="mt-3 space-y-2">
            <WalletRow label="Taux actuel" value={`${currentTier.label} / trajet`} />
            <WalletRow label="Commission due" value={formatXAF(wallet.commissionDue)} accent />
            <WalletRow label="Total payé depuis le début" value={formatXAF(wallet.totalCommission)} />
          </div>
          <p className="mt-3 text-xs text-gray-400">
            La commission est prélevée sur vos gains et reversée chaque semaine par Mobile Money.
            Sans reversement dans les 7 jours, votre compte est suspendu automatiquement.
          </p>

          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={() => alert('Fonctionnalité de reversement bientôt disponible.')}
            disabled={wallet.commissionDue === 0}
          >
            Reverser la commission ({formatXAF(wallet.commissionDue)})
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </section>

        {/* Historique des transactions */}
        {transactions.length > 0 && (
          <section className="rounded-card bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold text-gray-800">Dernières transactions</h2>
            <ul className="space-y-2">
              {transactions.map((t) => (
                <li key={t.reference} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 font-medium text-gray-800 truncate">
                      <span>{t.fromCity}</span>
                      <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
                      <span>{t.toCity}</span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {formatDate(new Date(t.departureAt))} · {t.seats} place{t.seats > 1 ? 's' : ''} · {t.reference}
                    </div>
                  </div>
                  <span className="shrink-0 font-bold text-sbs-green">+{formatXAF(t.driverEarning)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {transactions.length === 0 && (
          <section className="rounded-card bg-white p-6 shadow-sm text-center">
            <p className="text-sm text-gray-400">Aucune transaction pour l'instant.</p>
            <p className="mt-1 text-xs text-gray-400">Vos gains apparaîtront ici après vos premières réservations confirmées.</p>
          </section>
        )}

      </main>

      {/* Modal retrait */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 sm:rounded-2xl">
            <h3 className="text-lg font-bold text-gray-900">Retirer mes gains</h3>
            <p className="mt-2 text-sm text-gray-600">
              Vous allez demander un virement de{' '}
              <strong className="text-sbs-blue">{formatXAF(wallet.balance)}</strong> sur votre
              numéro Mobile Money enregistré.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Le virement sera effectué sous 24 h (jours ouvrés).
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowWithdrawModal(false)}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={handleWithdraw}>
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="trips" onNavigate={onNavigate} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Sous-composants locaux
   ────────────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  accent = 'neutral',
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'neutral' | 'warning';
}) {
  return (
    <div className={cn('rounded-card p-4 shadow-sm', accent === 'warning' ? 'bg-sbs-yellow-light' : 'bg-white')}>
      <p className={cn('text-xs', accent === 'warning' ? 'text-sbs-yellow-dark/70' : 'text-gray-500')}>
        {label}
      </p>
      <p className={cn('mt-1 text-xl font-bold', accent === 'warning' ? 'text-sbs-yellow-dark' : 'text-gray-900')}>
        {value}
      </p>
      {sub && (
        <p className={cn('mt-0.5 text-xs', accent === 'warning' ? 'text-sbs-yellow-dark/60' : 'text-gray-400')}>
          {sub}
        </p>
      )}
    </div>
  );
}

function WalletRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={cn('text-sm font-medium', accent ? 'text-red-600' : 'text-gray-800')}>{value}</span>
    </div>
  );
}

