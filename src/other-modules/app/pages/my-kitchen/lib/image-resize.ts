export const FULL_IMAGE_MAX_EDGE = 1600;
export const THUMB_IMAGE_MAX_EDGE = 400;

export interface ResizedImage {
  blob: Blob;
  extension: 'webp' | 'jpg';
}

/** Scales (width, height) down so the longer edge is at most `maxEdge`; never scales up. */
export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Decodes `source` (respecting camera EXIF rotation), downsizes it and re-encodes as WebP — or
 * JPEG if the browser can't encode WebP. Phone photos go from ~5–10 MB to a few hundred KB.
 */
export async function resizeImage(source: Blob, maxEdge: number, quality = 0.85): Promise<ResizedImage> {
  const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, maxEdge);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available.');
    ctx.drawImage(bitmap, 0, 0, width, height);

    const webp = await toBlob(canvas, 'image/webp', quality);
    // toBlob silently falls back to PNG for types it can't encode.
    if (webp?.type === 'image/webp') return { blob: webp, extension: 'webp' };
    const jpeg = await toBlob(canvas, 'image/jpeg', quality);
    if (!jpeg) throw new Error('Could not encode the image.');
    return { blob: jpeg, extension: 'jpg' };
  } finally {
    bitmap.close();
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
