import { cloudinaryTransformUrl, isCloudinaryUrl } from "@/lib/cloudinary";

/**
 * Build a resized preview URL for a stored photo.
 *
 * - Cloudinary URLs get an on-the-fly transformation (c_limit,w_<width>,q_<quality>,f_auto),
 *   so one uploaded original serves every size the UI asks for.
 * - Anything else (e.g. photos still in Supabase Storage before migration) is returned
 *   unchanged. Supabase's render/image transforms are a Pro-plan feature, so on the free
 *   plan the original is the only URL that actually loads.
 */
export const getPreviewUrl = (src: string, width = 600, quality = 60): string => {
  if (isCloudinaryUrl(src)) return cloudinaryTransformUrl(src, { width, quality });
  return src;
};

/** Tiny, heavily compressed placeholder shown while the full image loads. */
export const getThumbUrl = (src: string): string => getPreviewUrl(src, 60, 20);

export const getPreviewSrcSet = (
  src: string,
  widths: readonly number[],
  quality = 75
): string | undefined => {
  if (widths.length === 0) return undefined;
  // A srcset of identical URLs is pointless for non-Cloudinary sources.
  if (!isCloudinaryUrl(src)) return undefined;

  const candidates = widths
    .map((width) => `${getPreviewUrl(src, width, quality)} ${width}w`)
    .join(", ");

  return candidates || undefined;
};
