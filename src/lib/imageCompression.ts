/**
 * Canvas-based image compression — resize to a max long-edge dimension and
 * re-encode at a target quality. No dependency needed; canvas.toBlob covers
 * this without pulling in browser-image-compression.
 */
export async function compressImage(
  file: File,
  { maxDim = 1920, quality = 0.8 }: { maxDim?: number; quality?: number } = {},
): Promise<File> {
  // GIFs are animated — canvas would flatten them to a single frame.
  if (file.type === "image/gif") return file;

  let bitmap: ImageBitmap;
  try {
    // imageOrientation: "from-image" respects EXIF rotation (phone photos
    // are frequently stored sideways with an orientation tag).
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // unsupported format (e.g. HEIC without decoder) — upload as-is
  }

  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  // Prefer WebP; some older engines silently ignore the requested type and
  // hand back PNG, which is lossless and defeats the point — fall back to
  // JPEG in that case.
  let blob = await encode("image/webp");
  if (!blob || blob.type !== "image/webp") {
    blob = await encode("image/jpeg");
  }
  if (!blob) return file;

  // Tiny originals aren't worth swapping if compression didn't actually help.
  if (blob.size >= file.size && file.size < 200 * 1024) return file;

  // Keep the original filename per spec — the object's Content-Type header
  // (set explicitly at upload time) governs rendering, not the extension.
  return new File([blob], file.name, { type: blob.type, lastModified: file.lastModified });
}
