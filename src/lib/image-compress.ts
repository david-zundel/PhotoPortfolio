import imageCompression from "browser-image-compression";

/**
 * Client-side compression run before every upload so we never store
 * 8–12 MB straight-from-camera files.
 *
 * Defaults: longest edge 4096px, JPEG @ 90% quality, ≤ 8 MB (Cloudinary's free
 * plan rejects files over 10 MB). That's enough for a full-screen view on a
 * 5K/Retina display; Cloudinary serves smaller variants on the fly for everything
 * else, so a bigger original costs storage only, not bandwidth.
 */
export const COMPRESS_DEFAULTS = {
  maxWidthOrHeight: 4096,
  maxSizeMB: 8,
  initialQuality: 0.9,
} as const;

export type CompressResult = {
  blob: Blob;
  originalBytes: number;
  compressedBytes: number;
};

export const compressImage = async (
  file: File,
  opts: Partial<typeof COMPRESS_DEFAULTS> = {}
): Promise<CompressResult> => {
  const settings = { ...COMPRESS_DEFAULTS, ...opts };

  // Keep PNG as PNG (transparency / graphics); everything else becomes JPEG.
  const fileType = file.type === "image/png" ? "image/png" : "image/jpeg";

  const blob = await imageCompression(file, {
    maxWidthOrHeight: settings.maxWidthOrHeight,
    maxSizeMB: settings.maxSizeMB,
    initialQuality: settings.initialQuality,
    fileType,
    useWebWorker: true,
    // browser-image-compression already applies EXIF orientation when re-encoding.
    preserveExif: false,
  });

  return {
    blob,
    originalBytes: file.size,
    compressedBytes: blob.size,
  };
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
