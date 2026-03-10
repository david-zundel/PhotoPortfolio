/**
 * Generate a Supabase Storage thumbnail URL using render/image transform.
 * Falls back to original src if not a Supabase storage URL.
 */
export const getPreviewUrl = (src: string, width = 600, quality = 60): string => {
  try {
    const url = new URL(src);
    // Supabase storage URL pattern: /storage/v1/object/public/{bucket}/{path}
    if (url.pathname.includes("/storage/v1/object/public/")) {
      const pathParts = url.pathname.split("/storage/v1/object/public/");
      if (pathParts.length === 2) {
        const bucketAndPath = pathParts[1];
        return `${url.origin}/storage/v1/render/image/public/${bucketAndPath}?width=${width}&quality=${quality}&resize=contain`;
      }
    }
  } catch {}
  return src;
};

export const getThumbUrl = (src: string): string => getPreviewUrl(src, 60, 20);

export const getPreviewSrcSet = (
  src: string,
  widths: readonly number[],
  quality = 75
): string | undefined => {
  if (widths.length === 0) return undefined;

  const candidates = widths
    .map((width) => `${getPreviewUrl(src, width, quality)} ${width}w`)
    .join(", ");

  return candidates || undefined;
};
