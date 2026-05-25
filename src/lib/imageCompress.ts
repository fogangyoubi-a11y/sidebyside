/**
 * Compression d'image côté client.
 *
 * Les photos prises par les téléphones modernes pèsent 5-12 Mo et font
 * 4000+ px de large — bien trop pour une CNI/permis qu'on veut juste
 * envoyer au backend. On les redimensionne à `maxDim` px (largeur OU
 * hauteur) en gardant le ratio, et on les ré-encode en JPEG qualité ~0.85.
 *
 * Avantages :
 *   - Photo 8 Mo → ~400 Ko après compression
 *   - L'utilisateur peut prendre sa photo sans se soucier de la taille
 *   - Le backend reçoit des fichiers raisonnables
 */

export interface CompressOptions {
  /** Dimension maximale (largeur ou hauteur en px). Défaut 1600. */
  maxDim?: number;
  /** Qualité JPEG entre 0 et 1. Défaut 0.85. */
  quality?: number;
}

/**
 * Compresse une image en JPEG. Si le fichier source est déjà petit (< 500 Ko)
 * et dans la bonne dimension, on le retourne tel quel pour éviter une perte
 * inutile.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const maxDim = opts.maxDim ?? 1600;
  const quality = opts.quality ?? 0.85;

  // Si déjà petit ET format navigateur natif, on garde tel quel
  if (file.size < 500 * 1024 && /^image\/(jpe?g|png|webp)$/i.test(file.type)) {
    return file;
  }

  // Tentative de compression — si quoi que ce soit échoue, on garde l'original
  // (notamment HEIC sur certains téléphones que le navigateur ne sait pas décoder)
  try {
    const dataUrl = await readAsDataUrl(file);
    const img = await loadImage(dataUrl);

    let { width, height } = img;
    if (!width || !height) return file; // image non décodée par le navigateur (HEIC ?)

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    });
    if (!blob) return file;
    if (blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    // Cas HEIC, fichier corrompu, ou OOM — on retourne le fichier tel quel
    // L'utilisateur verra quand même son preview (sauf si HEIC sur navigateur non compatible)
    return file;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image non lisible'));
    img.src = src;
  });
}

/** Formate une taille de fichier en Ko/Mo lisible. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}
