import { useId, useRef, useState } from 'react';
import { Upload, CheckCircle2, X, Camera, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  label: string;
  /** Description courte affichée sous le label (ex. "Recto"). */
  hint?: string;
  /** Si renseigné, le composant est en mode "rempli". */
  value: File | null;
  onChange: (file: File | null) => void;
  /** Variante visuelle : compacte ou pleine largeur. */
  variant?: 'card' | 'compact';
  /** Limite de taille en Mo (par défaut 5 Mo). */
  maxSizeMB?: number;
  /** Émoji ou icône custom (par défaut FileText). */
  icon?: React.ReactNode;
  /** Type MIME accepté (par défaut images). */
  accept?: string;
}

/**
 * Zone d'upload de document KYC (CNI, permis, carte grise, photo véhicule…).
 * - Prévisualisation image après sélection
 * - Drag & drop supporté
 * - Bouton "Reprendre" pour ré-uploader
 * Note : c'est un mock front — pas d'envoi backend ici.
 */
export function DocumentUpload({
  label,
  hint,
  value,
  onChange,
  variant = 'card',
  maxSizeMB = 5,
  icon,
  accept = 'image/jpeg,image/png,image/webp',
}: DocumentUploadProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(file: File | null) {
    setError(null);
    if (!file) {
      onChange(null);
      setPreview(null);
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Le fichier dépasse ${maxSizeMB} Mo`);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file);
  }

  function clear() {
    handleFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  if (value && preview) {
    return (
      <div className={cn('relative overflow-hidden rounded-card-lg border-2 border-sbs-green bg-white shadow-soft', variant === 'compact' && 'flex items-center gap-3 p-2')}>
        {variant === 'compact' ? (
          <>
            <img src={preview} alt={label} className="h-14 w-14 shrink-0 rounded-card object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-sm font-bold text-sbs-dark">
                <CheckCircle2 className="h-3.5 w-3.5 text-sbs-green" />
                {label}
              </div>
              <div className="truncate text-[11px] text-sbs-muted">{value.name}</div>
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
                <div className="truncate text-[11px] text-sbs-muted">{value.name}</div>
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

  return (
    <label
      htmlFor={id}
      className={cn(
        'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card-lg border-2 border-dashed bg-white p-5 text-center transition-all',
        error
          ? 'border-sbs-red bg-red-50/30'
          : 'border-sbs-border hover:border-sbs-blue hover:bg-sbs-blue-light/30',
      )}
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
    >
      <span className="grid h-12 w-12 place-items-center rounded-card-lg bg-sbs-blue-light text-sbs-blue transition-colors group-hover:bg-sbs-blue group-hover:text-white">
        {icon ?? <FileText className="h-6 w-6" />}
      </span>
      <div>
        <div className="font-display text-sm font-extrabold text-sbs-dark">{label}</div>
        {hint && <div className="mt-0.5 text-[11px] text-sbs-muted">{hint}</div>}
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-pill bg-sbs-blue px-3 py-1 text-[11px] font-bold text-white">
        <Upload className="h-3 w-3" />
        Choisir un fichier
      </div>
      <p className="text-[10px] text-sbs-muted">JPG/PNG · max {maxSizeMB} Mo</p>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        className="sr-only"
      />
      {error && <span className="text-[11px] font-medium text-sbs-red">{error}</span>}
    </label>
  );
}

/** Variante : upload de selfie (caméra frontale). */
export function SelfieUpload(props: Omit<DocumentUploadProps, 'icon' | 'accept'>) {
  return (
    <DocumentUpload
      {...props}
      icon={<Camera className="h-6 w-6" />}
      accept="image/jpeg,image/png,image/webp"
    />
  );
}
