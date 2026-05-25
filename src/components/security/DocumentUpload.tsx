import { useEffect, useId, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, CheckCircle2, X, FileText, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { compressImage, formatFileSize } from '@/lib/imageCompress';

interface DocumentUploadProps {
  label: string;
  /** Description courte affichée sous le label (ex. "Recto"). */
  hint?: string;
  /** Si renseigné, le composant est en mode "rempli". */
  value: File | null;
  onChange: (file: File | null) => void;
  /** Variante visuelle : compacte ou pleine largeur. */
  variant?: 'card' | 'compact';
  /** Limite de taille en Mo (par défaut 20 Mo — la compression réduira à <500 Ko). */
  maxSizeMB?: number;
  /** Émoji ou icône custom (par défaut FileText). */
  icon?: React.ReactNode;
  /** Mode : 'photo' affiche 2 boutons (caméra + galerie), 'selfie' force la caméra frontale. */
  mode?: 'photo' | 'selfie';
}

/**
 * Zone d'upload de document KYC (CNI, permis, carte grise, photo véhicule…).
 *
 * UX mobile-first :
 *  - 2 boutons explicites : "📷 Prendre une photo" et "📁 Depuis la galerie"
 *  - Compression automatique côté client (8 Mo → 400 Ko, max 1600 px)
 *  - Prévisualisation avec taille du fichier final
 *  - Memory leak fix : revoke des `URL.createObjectURL` à chaque changement
 *  - Mode 'selfie' utilise la caméra frontale (user) au lieu de l'arrière (environment)
 */
export function DocumentUpload({
  label,
  hint,
  value,
  onChange,
  variant = 'card',
  maxSizeMB = 20,
  icon,
  mode = 'photo',
}: DocumentUploadProps) {
  const id = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  // Fix du memory leak : on revoke l'ancien objectURL à chaque changement
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleFile(rawFile: File | null) {
    setError(null);
    if (!rawFile) {
      onChange(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setCompressedSize(null);
      return;
    }

    // Check taille AVANT compression
    if (rawFile.size > maxSizeMB * 1024 * 1024) {
      setError(`Le fichier dépasse ${maxSizeMB} Mo — choisissez une photo plus petite`);
      return;
    }

    // Compresser si trop gros / trop grand
    setProcessing(true);
    try {
      const compressed = await compressImage(rawFile, { maxDim: 1600, quality: 0.85 });
      const url = URL.createObjectURL(compressed);
      // Revoke l'ancien preview avant d'écraser
      if (preview) URL.revokeObjectURL(preview);
      setPreview(url);
      setCompressedSize(compressed.size);
      onChange(compressed);
    } catch (e) {
      setError(`Impossible de traiter cette image : ${(e as Error).message}`);
    } finally {
      setProcessing(false);
    }
  }

  function clear() {
    handleFile(null);
    if (cameraRef.current) cameraRef.current.value = '';
    if (galleryRef.current) galleryRef.current.value = '';
  }

  /* ===== Mode rempli : affiche le preview avec bouton "Reprendre" ===== */
  if (value && preview) {
    return (
      <div className={cn(
        'relative overflow-hidden rounded-card-lg border-2 border-sbs-green bg-white shadow-soft',
        variant === 'compact' && 'flex items-center gap-3 p-2',
      )}>
        {variant === 'compact' ? (
          <>
            <img src={preview} alt={label} className="h-14 w-14 shrink-0 rounded-card object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-sm font-bold text-sbs-dark">
                <CheckCircle2 className="h-3.5 w-3.5 text-sbs-green" />
                {label}
              </div>
              <div className="truncate text-[11px] text-sbs-muted">
                {compressedSize ? formatFileSize(compressedSize) : value.name}
              </div>
            </div>
            <button
              type="button"
              onClick={clear}
              aria-label="Retirer"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sbs-border-soft text-sbs-muted transition-colors hover:bg-sbs-red hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <img src={preview} alt={label} className="aspect-[16/10] w-full object-cover" />
            <div className="flex items-center justify-between gap-2 border-t border-sbs-border-soft bg-white px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-sm font-bold text-sbs-dark">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sbs-green" />
                  {label}
                </div>
                <div className="truncate text-[11px] text-sbs-muted">
                  {compressedSize ? `Photo compressée · ${formatFileSize(compressedSize)}` : value.name}
                </div>
              </div>
              <button
                type="button"
                onClick={clear}
                className="rounded-pill border border-sbs-border bg-white px-3 py-1 text-xs font-semibold text-sbs-dark transition-colors hover:bg-sbs-border-soft"
              >
                Reprendre
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  /* ===== Mode "selfie" : 1 seul bouton, caméra frontale ===== */
  if (mode === 'selfie') {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={processing}
          className={cn(
            'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card-lg border-2 border-dashed border-sbs-border bg-white p-5 text-center transition-all hover:border-sbs-blue hover:bg-sbs-blue-light/30',
            processing && 'cursor-wait opacity-60',
          )}
        >
          <span className="grid h-14 w-14 place-items-center rounded-card-lg bg-sbs-blue-light text-sbs-blue transition-colors group-hover:bg-sbs-blue group-hover:text-white">
            {processing ? <Loader2 className="h-7 w-7 animate-spin" /> : <Camera className="h-7 w-7" />}
          </span>
          <div>
            <div className="font-display text-sm font-extrabold text-sbs-dark">{label}</div>
            {hint && <div className="mt-0.5 text-[11px] text-sbs-muted">{hint}</div>}
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-pill bg-sbs-blue px-4 py-1.5 text-xs font-bold text-white">
            <Camera className="h-3.5 w-3.5" />
            {processing ? 'Traitement…' : 'Ouvrir la caméra'}
          </div>
        </button>

        <input
          ref={cameraRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          capture="user"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />

        {error && <ErrorBox message={error} />}
      </div>
    );
  }

  /* ===== Mode "photo" (CNI, permis, etc.) : 2 boutons ===== */
  return (
    <div className="flex flex-col gap-2">
      <div className={cn(
        'rounded-card-lg border-2 border-dashed bg-white p-4 transition-all',
        error ? 'border-sbs-red bg-red-50/30' : 'border-sbs-border',
      )}>
        {/* Header zone */}
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-sbs-blue-light text-sbs-blue">
            {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : icon ?? <FileText className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-sm font-extrabold text-sbs-dark">{label}</div>
            {hint && <div className="text-[11px] text-sbs-muted">{hint}</div>}
          </div>
        </div>

        {/* Les 2 boutons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={processing}
            className="flex items-center justify-center gap-1.5 rounded-pill bg-sbs-blue px-3 py-2.5 text-xs font-bold text-white shadow-soft transition-all hover:bg-sbs-blue-dark active:scale-95 disabled:cursor-wait disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            Prendre une photo
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={processing}
            className="flex items-center justify-center gap-1.5 rounded-pill border border-sbs-blue bg-white px-3 py-2.5 text-xs font-bold text-sbs-blue shadow-soft transition-all hover:bg-sbs-blue-light active:scale-95 disabled:cursor-wait disabled:opacity-50"
          >
            <ImageIcon className="h-4 w-4" />
            Depuis la galerie
          </button>
        </div>

        <p className="mt-2 text-center text-[10px] text-sbs-muted">
          {processing
            ? 'Compression en cours…'
            : 'JPG, PNG ou HEIC · max ' + maxSizeMB + ' Mo (auto-compressé)'}
        </p>
      </div>

      {/* Inputs cachés */}
      <input
        ref={cameraRef}
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        className="sr-only"
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        className="sr-only"
      />

      {error && <ErrorBox message={error} />}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-card border border-sbs-red/30 bg-red-50 px-3 py-2 text-[11px] font-medium text-sbs-red">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/** Variante : selfie (caméra frontale, 1 seul bouton). */
export function SelfieUpload(props: Omit<DocumentUploadProps, 'icon' | 'mode'>) {
  return <DocumentUpload {...props} mode="selfie" />;
}
