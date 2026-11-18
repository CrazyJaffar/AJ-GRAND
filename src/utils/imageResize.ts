export const STANDARD_PROPERTY_IMAGE_WIDTH = 1200;
export const STANDARD_PROPERTY_IMAGE_HEIGHT = 900;

export type ImageFitMode = 'cover' | 'contain';

export interface NormalizedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  sizeKb: number;
}

/**
 * Normalizes any uploaded image file to the exact 4:3 (1200x900) size used across
 * AJ GRAND property cards and detail galleries.
 */
export async function normalizePropertyImageFile(
  file: File,
  mode: ImageFitMode = 'cover'
): Promise<NormalizedImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" is not a supported image file.`);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new Error(`Unable to read "${file.name}". Please upload a JPG, PNG, or WebP image.`));
      el.src = objectUrl;
    });

    const targetW = STANDARD_PROPERTY_IMAGE_WIDTH;
    const targetH = STANDARD_PROPERTY_IMAGE_HEIGHT;
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser canvas is unavailable for image resizing.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Warm architectural backdrop used when fitting non-4:3 photos without cropping
    ctx.fillStyle = '#f4efea';
    ctx.fillRect(0, 0, targetW, targetH);

    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    const targetRatio = targetW / targetH;
    const srcRatio = srcW / srcH;

    if (mode === 'cover') {
      // Center-crop to fill 1200x900 identically to existing gallery photos
      let drawW = srcW;
      let drawH = srcH;
      let sx = 0;
      let sy = 0;

      if (srcRatio > targetRatio) {
        drawW = srcH * targetRatio;
        sx = (srcW - drawW) / 2;
      } else {
        drawH = srcW / targetRatio;
        sy = (srcH - drawH) / 2;
      }

      ctx.drawImage(img, sx, sy, drawW, drawH, 0, 0, targetW, targetH);
    } else {
      // Fit entire photo inside 1200x900 without cropping
      const scale = Math.min(targetW / srcW, targetH / srcH);
      const drawW = srcW * scale;
      const drawH = srcH * scale;
      const dx = (targetW - drawW) / 2;
      const dy = (targetH - drawH) / 2;
      ctx.drawImage(img, 0, 0, srcW, srcH, dx, dy, drawW, drawH);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const approxBytes = Math.round(((dataUrl.length - 'data:image/jpeg;base64,'.length) * 3) / 4);

    return {
      dataUrl,
      width: targetW,
      height: targetH,
      originalWidth: srcW,
      originalHeight: srcH,
      sizeKb: Math.max(1, Math.round(approxBytes / 1024)),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
