/**
 * Écran /admin — back-office SideBySide v1.
 *
 * Contenu :
 *  - 6 cartes KPI (users, trips, bookings, CA 30j, commission 30j, newsletter)
 *  - 3 tableaux : derniers users, dernières bookings, derniers inscrits newsletter
 *
 * Garde-fou :
 *  - Si non connecté → redirect vers /login
 *  - Si connecté mais rôle ≠ ADMIN → page d'accès refusé
 *  - Toutes les routes backend appelées nécessitent role=ADMIN côté API
 *
 * Pour promouvoir ton compte en ADMIN : voir ADMIN_SETUP.md à la racine
 * du backend sidebyside-api.
 */
import { useEffect, useState } from 'react';
import {
  ArrowLeft, Loader2, Users, Car, Ticket, Wallet, Coins, Mail,
  AlertTriangle, ShieldCheck, RefreshCw, Eye, X, Check, Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SbsLogo } from '@/components/ui/SbsLogo';
import { useAuth } from '@/hooks/useAuth';
import {
  ApiClient, ApiError,
  type ApiAdminDashboard,
  type ApiAdminUser,
  type ApiAdminBooking,
  type ApiAdminNewsletter,
  type ApiAdminKycDocument,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Screen } from '@/lib/types';

interface AdminProps {
  onNavigate: (s: Screen, params?: Record<string, string>) => void;
}

export function Admin({ onNavigate }: AdminProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Garde-fous d'accès : on attend que useAuth ait fini, puis on décide.
  if (authLoading) {
    return <CenteredLoader text="Chargement…" />;
  }
  if (!isAuthenticated) {
    return (
      <AccessDenied
        title="Connexion requise"
        message="Tu dois être connecté pour accéder au back-office."
        ctaLabel="Se connecter"
        onCta={() => onNavigate('login')}
        onHome={() => onNavigate('landing')}
      />
    );
  }
  if (user?.role !== 'ADMIN') {
    return (
      <AccessDenied
        title="Accès refusé"
        message="Cette page est réservée aux administrateurs SideBySide."
        ctaLabel="Retour à l'accueil"
        onCta={() => onNavigate('landing')}
        onHome={() => onNavigate('landing')}
      />
    );
  }

  return <AdminDashboard onNavigate={onNavigate} />;
}

/* ============================================================
   Dashboard principal — KPIs + 3 tableaux
   ============================================================ */

function AdminDashboard({ onNavigate }: AdminProps) {
  const [stats, setStats] = useState<ApiAdminDashboard | null>(null);
  const [users, setUsers] = useState<ApiAdminUser[]>([]);
  const [bookings, setBookings] = useState<ApiAdminBooking[]>([]);
  const [newsletter, setNewsletter] = useState<ApiAdminNewsletter[]>([]);
  const [kycDocs, setKycDocs] = useState<ApiAdminKycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewingDoc, setReviewingDoc] = useState<ApiAdminKycDocument | null>(null);

  async function loadAll() {
    setError(null);
    try {
      const [s, u, b, n, k] = await Promise.all([
        ApiClient.adminDashboard(),
        ApiClient.adminRecentUsers(),
        ApiClient.adminRecentBookings(),
        ApiClient.adminNewsletter(),
        ApiClient.adminKycPending(),
      ]);
      setStats(s);
      setUsers(u.users);
      setBookings(b.bookings);
      setNewsletter(n.subscribers);
      setKycDocs(k.documents);
    } catch (err) {
      const msg = err instanceof ApiError
        ? `Erreur ${err.status} : ${err.message}`
        : 'Impossible de charger les données du back-office.';
      setError(msg);
    }
  }

  /** Après une revue (approve/reject), on retire le doc de la liste locale sans tout recharger. */
  function handleReviewed(docId: string) {
    setKycDocs((prev) => prev.filter((d) => d.id !== docId));
    setReviewingDoc(null);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadAll() updates state via API response callbacks on mount
    void loadAll().finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  if (loading) return <CenteredLoader text="Chargement des données…" />;

  return (
    <div className="min-h-screen bg-sbs-cream">
      <header className="sticky top-0 z-30 border-b border-sbs-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2"
            aria-label="Retour à l'accueil"
          >
            <SbsLogo size="sm" />
            <span className="font-display text-base font-extrabold">
              Side<span className="text-sbs-yellow-dark">By</span>Side
            </span>
            <Badge tone="blue">ADMIN</Badge>
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            <span className="hidden sm:inline">Rafraîchir</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('landing')}
          className="-ml-2 mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> Accueil
        </Button>

        <h1 className="font-display text-3xl font-extrabold tracking-tight text-sbs-dark sm:text-4xl">
          Back-office
        </h1>
        <p className="mt-2 text-sm text-sbs-muted">
          Vue d'ensemble — données live depuis la base. Les montants CA et commission
          couvrent les 30 derniers jours.
        </p>

        {error && (
          <div className="mt-6 flex items-start gap-2 rounded-card border border-sbs-red/30 bg-sbs-red/5 p-4 text-sm text-sbs-red">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-bold">Impossible de charger les données</div>
              <div className="mt-1 text-xs">{error}</div>
            </div>
          </div>
        )}

        {/* ---------- KPIs ---------- */}
        {stats && (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              icon={Users}
              tone="blue"
              label="Utilisateurs"
              value={stats.users.toLocaleString('fr-FR')}
              hint={`+${stats.usersThisWeek} cette semaine · ${stats.passengers} passagers · ${stats.drivers} chauffeurs`}
            />
            <KpiCard
              icon={Car}
              tone="yellow"
              label="Trajets"
              value={stats.trips.toLocaleString('fr-FR')}
              hint={`${stats.tripsAvailable} disponibles aujourd'hui`}
            />
            <KpiCard
              icon={Ticket}
              tone="green"
              label="Réservations"
              value={stats.bookings.toLocaleString('fr-FR')}
              hint={`${stats.bookingsConfirmed} confirmées les 30 derniers jours`}
            />
            <KpiCard
              icon={Wallet}
              tone="blue"
              label="CA 30 jours"
              value={`${stats.revenue30d.toLocaleString('fr-FR')} F CFA`}
              hint="Somme totalAmount des bookings CONFIRMED + COMPLETED"
            />
            <KpiCard
              icon={Coins}
              tone="green"
              label="Commission 30 jours"
              value={`${stats.commission30d.toLocaleString('fr-FR')} F CFA`}
              hint="Ce que SideBySide encaisse réellement"
            />
            <KpiCard
              icon={Mail}
              tone="yellow"
              label="Newsletter"
              value={stats.newsletterCount.toLocaleString('fr-FR')}
              hint={`${stats.newsletterSubscribed} confirmés · ${stats.newsletterCount - stats.newsletterSubscribed} en attente`}
            />
          </section>
        )}

        {/* Alertes opérationnelles */}
        {stats && (stats.pendingKyc > 0 || stats.sosAlerts > 0) && (
          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            {stats.pendingKyc > 0 && (
              <div className="flex items-center gap-3 rounded-card border border-sbs-yellow/40 bg-sbs-yellow-light p-4">
                <ShieldCheck className="h-5 w-5 text-sbs-yellow-dark" />
                <div className="text-sm">
                  <div className="font-bold text-sbs-dark">{stats.pendingKyc} chauffeur(s) avec KYC en attente</div>
                  <div className="text-xs text-sbs-muted">{kycDocs.length} document(s) à valider ci-dessous.</div>
                </div>
              </div>
            )}
            {stats.sosAlerts > 0 && (
              <div className="flex items-center gap-3 rounded-card border border-sbs-red/30 bg-sbs-red/5 p-4">
                <AlertTriangle className="h-5 w-5 text-sbs-red" />
                <div className="text-sm">
                  <div className="font-bold text-sbs-dark">{stats.sosAlerts} alerte(s) SOS total</div>
                  <div className="text-xs text-sbs-muted">Consulter les détails dans la table SosAlert.</div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ---------- Tableau KYC en attente ---------- */}
        <Section title="Documents KYC en attente de revue" count={kycDocs.length}>
          {kycDocs.length === 0 ? (
            <Empty text="Aucun document en attente — tout est à jour." />
          ) : (
            <Table headers={['Utilisateur', 'Téléphone', 'Rôle', 'Document', 'Reçu le', '']}>
              {kycDocs.map((d) => (
                <tr key={d.id} className="border-b border-sbs-border-soft last:border-b-0">
                  <td className="px-3 py-2 text-sm font-semibold text-sbs-dark">{d.user.firstName} {d.user.lastName}</td>
                  <td className="px-3 py-2 text-sm text-sbs-muted">{d.user.phone}</td>
                  <td className="px-3 py-2"><RoleBadge role={d.user.role as 'PASSENGER' | 'DRIVER' | 'ADMIN'} /></td>
                  <td className="px-3 py-2"><KycTypeBadge type={d.type} /></td>
                  <td className="px-3 py-2 text-xs text-sbs-muted">{formatDate(d.createdAt)}</td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="secondary" size="sm" onClick={() => setReviewingDoc(d)}>
                      <Eye className="h-3.5 w-3.5" /> Voir
                    </Button>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        {/* ---------- Tableau Users ---------- */}
        <Section title="20 derniers utilisateurs inscrits" count={users.length}>
          {users.length === 0 ? (
            <Empty text="Personne n'est encore inscrit." />
          ) : (
            <Table headers={['Nom', 'Téléphone', 'Rôle', 'Confiance', 'Inscrit le']}>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-sbs-border-soft last:border-b-0">
                  <td className="px-3 py-2 text-sm font-semibold text-sbs-dark">
                    {u.firstName} {u.lastName}
                    {u.suspendedAt && <Badge tone="red" className="ml-2">Suspendu</Badge>}
                  </td>
                  <td className="px-3 py-2 text-sm text-sbs-muted">{u.phone}</td>
                  <td className="px-3 py-2"><RoleBadge role={u.role} /></td>
                  <td className="px-3 py-2"><TrustBadge level={u.trustLevel} /></td>
                  <td className="px-3 py-2 text-xs text-sbs-muted">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        {/* ---------- Tableau Bookings ---------- */}
        <Section title="20 dernières réservations" count={bookings.length}>
          {bookings.length === 0 ? (
            <Empty text="Aucune réservation pour l'instant." />
          ) : (
            <Table headers={['Référence', 'Trajet', 'Passager', 'Places', 'Montant', 'Statut', 'Date']}>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-sbs-border-soft last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs text-sbs-blue">{b.reference}</td>
                  <td className="px-3 py-2 text-sm text-sbs-dark">
                    {capitalize(b.trip.fromCity)} → {capitalize(b.trip.toCity)}
                  </td>
                  <td className="px-3 py-2 text-sm text-sbs-muted">{b.passenger.firstName} {b.passenger.lastName}</td>
                  <td className="px-3 py-2 text-center text-sm font-semibold">{b.seats}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="text-sm font-bold text-sbs-dark">{b.totalAmount.toLocaleString('fr-FR')} F</div>
                    <div className="text-[10px] text-sbs-muted">comm. {b.serviceFee.toLocaleString('fr-FR')}</div>
                  </td>
                  <td className="px-3 py-2"><BookingStatusBadge status={b.status} /></td>
                  <td className="px-3 py-2 text-xs text-sbs-muted">{formatDate(b.createdAt)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        {/* ---------- Tableau Newsletter ---------- */}
        <Section title="50 derniers inscrits à la newsletter" count={newsletter.length}>
          {newsletter.length === 0 ? (
            <Empty text="Aucun inscrit pour l'instant. Branche Mailchimp et lance les pubs FB diaspora." />
          ) : (
            <Table headers={['Email', 'Prénom', 'Ville', 'Axes', 'Source', 'Statut', 'Inscrit le']}>
              {newsletter.map((s) => (
                <tr key={s.id} className="border-b border-sbs-border-soft last:border-b-0">
                  <td className="px-3 py-2 text-sm text-sbs-dark">{s.email}</td>
                  <td className="px-3 py-2 text-sm text-sbs-muted">{s.firstName}</td>
                  <td className="px-3 py-2 text-sm text-sbs-muted">{s.city ?? '—'}</td>
                  <td className="px-3 py-2 text-xs">
                    {s.axes.length === 0 ? <span className="text-sbs-muted">—</span> : (
                      <div className="flex flex-wrap gap-1">
                        {s.axes.map((a) => <span key={a} className="rounded-pill bg-sbs-blue-light px-2 py-0.5 font-mono text-[10px] text-sbs-blue">{a}</span>)}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-sbs-muted">{s.source}</td>
                  <td className="px-3 py-2"><NewsletterStatusBadge status={s.status} /></td>
                  <td className="px-3 py-2 text-xs text-sbs-muted">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Section>
      </main>

      {reviewingDoc && (
        <KycReviewModal
          doc={reviewingDoc}
          onClose={() => setReviewingDoc(null)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  );
}

/* ============================================================
   Composants UI réutilisables
   ============================================================ */

function KpiCard({
  icon: Icon, tone, label, value, hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: 'blue' | 'yellow' | 'green';
  label: string;
  value: string;
  hint?: string;
}) {
  const toneClasses: Record<typeof tone, string> = {
    blue: 'bg-sbs-blue-light text-sbs-blue',
    yellow: 'bg-sbs-yellow-light text-sbs-yellow-dark',
    green: 'bg-sbs-green/10 text-sbs-green',
  };
  return (
    <div className="rounded-card-lg border border-sbs-border bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-bold uppercase tracking-wider text-sbs-muted">{label}</div>
        <div className={cn('grid h-10 w-10 place-items-center rounded-card', toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 font-display text-2xl font-extrabold text-sbs-dark sm:text-3xl">{value}</div>
      {hint && <div className="mt-1.5 text-xs leading-relaxed text-sbs-muted">{hint}</div>}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-extrabold text-sbs-dark">{title}</h2>
        <span className="text-xs font-bold text-sbs-muted">{count} {count > 1 ? 'résultats' : 'résultat'}</span>
      </div>
      <div className="overflow-x-auto rounded-card-lg border border-sbs-border bg-white shadow-soft">
        {children}
      </div>
    </section>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full min-w-[640px] border-collapse">
      <thead>
        <tr className="border-b border-sbs-border bg-sbs-cream">
          {headers.map((h) => (
            <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-sbs-muted">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="px-3 py-10 text-center text-sm text-sbs-muted">{text}</div>
  );
}

function RoleBadge({ role }: { role: 'PASSENGER' | 'DRIVER' | 'ADMIN' }) {
  const map: Record<typeof role, { tone: 'blue' | 'yellow' | 'red'; label: string }> = {
    PASSENGER: { tone: 'blue', label: 'Passager' },
    DRIVER: { tone: 'yellow', label: 'Chauffeur' },
    ADMIN: { tone: 'red', label: 'Admin' },
  };
  return <Badge tone={map[role].tone}>{map[role].label}</Badge>;
}

function TrustBadge({ level }: { level: 'BASIC' | 'VERIFIED' | 'PREMIUM' }) {
  const map: Record<typeof level, { tone: 'muted' | 'blue' | 'green'; label: string }> = {
    BASIC: { tone: 'muted', label: 'Basique' },
    VERIFIED: { tone: 'blue', label: 'Vérifié' },
    PREMIUM: { tone: 'green', label: 'Premium' },
  };
  return <Badge tone={map[level].tone}>{map[level].label}</Badge>;
}

function BookingStatusBadge({ status }: { status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' }) {
  const map: Record<typeof status, { tone: 'muted' | 'blue' | 'red' | 'green' | 'yellow'; label: string }> = {
    PENDING: { tone: 'yellow', label: 'En attente' },
    CONFIRMED: { tone: 'blue', label: 'Confirmé' },
    CANCELLED: { tone: 'red', label: 'Annulé' },
    COMPLETED: { tone: 'green', label: 'Terminé' },
  };
  return <Badge tone={map[status].tone}>{map[status].label}</Badge>;
}

function KycTypeBadge({ type }: { type: ApiAdminKycDocument['type'] }) {
  const map: Record<ApiAdminKycDocument['type'], string> = {
    CNI_FRONT: 'CNI (recto)',
    CNI_BACK: 'CNI (verso)',
    SELFIE: 'Selfie',
    LICENSE: 'Permis',
    VEHICLE_REGISTRATION: 'Carte grise',
    VEHICLE_PHOTO: 'Photo véhicule',
  };
  return <Badge tone="blue">{map[type]}</Badge>;
}

/* ============================================================
   Modal de revue KYC — affiche le document, permet d'approuver
   ou de rejeter (avec motif).
   ============================================================ */

function KycReviewModal({
  doc, onClose, onReviewed,
}: {
  doc: ApiAdminKycDocument;
  onClose: () => void;
  onReviewed: (docId: string) => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [submitting, setSubmitting] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    ApiClient.adminKycDocumentImageUrl(doc.id)
      .then((url) => {
        if (cancelled) { URL.revokeObjectURL(url); return; }
        objectUrl = url;
        setImageUrl(url);
      })
      .catch(() => { if (!cancelled) setImageError(true); });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc.id]);

  async function submit(action: 'APPROVE' | 'REJECT') {
    setError(null);
    setSubmitting(action);
    try {
      await ApiClient.adminReviewKycDocument(doc.id, action, action === 'REJECT' ? reason.trim() || undefined : undefined);
      onReviewed(doc.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors de la revue du document.');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-card-lg border border-sbs-border bg-white p-5 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-sbs-dark">{doc.user.firstName} {doc.user.lastName} · {doc.user.phone}</div>
            <div className="mt-1"><KycTypeBadge type={doc.type} /></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-1.5 text-sbs-muted hover:bg-sbs-border-soft">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid min-h-[240px] place-items-center overflow-hidden rounded-card border border-sbs-border bg-sbs-cream">
          {imageError && <span className="p-6 text-center text-sm text-sbs-red">Impossible de charger le document.</span>}
          {!imageError && !imageUrl && <Loader2 className="h-6 w-6 animate-spin text-sbs-muted" />}
          {imageUrl && <img src={imageUrl} alt={doc.type} className="max-h-[420px] w-full object-contain" />}
        </div>

        {showRejectReason && (
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif du rejet (optionnel)"
            className="mt-3 w-full rounded-card border border-sbs-border px-3 py-2 text-sm focus:border-sbs-blue focus:outline-none"
          />
        )}

        {error && <div className="mt-3 text-xs font-medium text-sbs-red">{error}</div>}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            disabled={submitting !== null}
            onClick={() => submit('APPROVE')}
          >
            {submitting === 'APPROVE' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Approuver
          </Button>
          <Button
            variant="danger"
            size="md"
            className="flex-1"
            disabled={submitting !== null}
            onClick={() => (showRejectReason ? submit('REJECT') : setShowRejectReason(true))}
          >
            {submitting === 'REJECT' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
            {showRejectReason ? 'Confirmer le rejet' : 'Rejeter'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NewsletterStatusBadge({ status }: { status: 'PENDING' | 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'CLEANED' }) {
  const map: Record<typeof status, { tone: 'muted' | 'green' | 'red' | 'yellow'; label: string }> = {
    PENDING: { tone: 'yellow', label: 'En attente' },
    SUBSCRIBED: { tone: 'green', label: 'Confirmé' },
    UNSUBSCRIBED: { tone: 'muted', label: 'Désabonné' },
    CLEANED: { tone: 'red', label: 'Email invalide' },
  };
  return <Badge tone={map[status].tone}>{map[status].label}</Badge>;
}

/* ============================================================
   Garde-fous d'accès
   ============================================================ */

function CenteredLoader({ text }: { text: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-sbs-cream">
      <div className="flex items-center gap-3 text-sm text-sbs-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{text}</span>
      </div>
    </div>
  );
}

function AccessDenied({
  title, message, ctaLabel, onCta, onHome,
}: {
  title: string;
  message: string;
  ctaLabel: string;
  onCta: () => void;
  onHome: () => void;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-sbs-cream px-4">
      <div className="w-full max-w-md rounded-card-lg border border-sbs-border bg-white p-6 text-center shadow-soft sm:p-8">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-sbs-yellow-light text-sbs-yellow-dark">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="font-display text-xl font-extrabold text-sbs-dark sm:text-2xl">{title}</h1>
        <p className="mt-2 text-sm text-sbs-muted">{message}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="primary" size="lg" onClick={onCta} className="rounded-pill">
            {ctaLabel}
          </Button>
          <Button variant="ghost" size="lg" onClick={onHome} className="rounded-pill">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Utils
   ============================================================ */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default Admin;

