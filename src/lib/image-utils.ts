/**
 * Generate a Supabase Storage thumbnail URL using render/image transform.
 * Falls back to original src if not a Supabase storage URL.
 */
export const getPreviewUrl = (src: string, width = 600, quality = 60): string => {
  try {
    const url = new URL(src);
    if (url.pathname.includes("/storage/v1/object/public/")) {
      const renderPath = url.pathname.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/"
      );
      return `${url.origin}${renderPath}?width=${width}&quality=${quality}`;
    }
  } catch {}
  return src;
};

export const getThumbUrl = (src: string): string => getPreviewUrl(src, 60, 20);
