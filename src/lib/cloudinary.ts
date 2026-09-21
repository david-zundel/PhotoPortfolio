/**
 * Cloudinary helpers.
 *
 * Uploads go straight from the browser to Cloudinary using an *unsigned*
 * upload preset, so no secret ever ships in the client bundle.
 *
 * Required env (see .env):
 *   VITE_CLOUDINARY_CLOUD_NAME     – your cloud name (Cloudinary dashboard → top-left)
 *   VITE_CLOUDINARY_UPLOAD_PRESET  – an *unsigned* upload preset
 *                                    (Settings → Upload → Upload presets → Add → Signing mode: Unsigned)
 */

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

/** Folder inside your Cloudinary media library that portfolio uploads land in. */
export const CLOUDINARY_FOLDER = "portfolio";

export const isCloudinaryConfigured = (): boolean =>
  Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

export const isCloudinaryUrl = (src: string): boolean => {
  try {
    const url = new URL(src);
    return url.hostname === "res.cloudinary.com" && url.pathname.includes("/image/upload/");
  } catch {
    return false;
  }
};

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
};

/**
 * Upload a File/Blob to Cloudinary with the unsigned preset.
 * Returns the permanent `secure_url` (store this in the `photos.src` column)
 * and the `public_id` (store in `photos.public_id`; needed to delete later).
 */
export const uploadToCloudinary = async (
  file: Blob,
  opts: { publicId?: string; folder?: string } = {}
): Promise<CloudinaryUploadResult> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env"
    );
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  form.append("folder", opts.folder ?? CLOUDINARY_FOLDER);
  if (opts.publicId) form.append("public_id", opts.publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(`Cloudinary upload failed: ${message}`);
  }

  return (await res.json()) as CloudinaryUploadResult;
};

export type CloudinaryTransform = {
  /** Max width in px. The image is never upscaled (c_limit). */
  width?: number;
  /** 1–100, or omit for q_auto. */
  quality?: number;
};

/**
 * Turn a stored Cloudinary delivery URL into a resized/optimised variant by
 * inserting a transformation segment after `/image/upload/`.
 *
 *   https://res.cloudinary.com/demo/image/upload/v1/portfolio/abc.jpg
 *   → https://res.cloudinary.com/demo/image/upload/c_limit,w_600,q_60,f_auto/v1/portfolio/abc.jpg
 *
 * Non-Cloudinary URLs are returned unchanged.
 */
export const cloudinaryTransformUrl = (src: string, { width, quality }: CloudinaryTransform): string => {
  if (!isCloudinaryUrl(src)) return src;

  const marker = "/image/upload/";
  const idx = src.indexOf(marker);
  const head = src.slice(0, idx + marker.length);
  let tail = src.slice(idx + marker.length);

  // Strip any transformation segment that's already there so we don't stack them.
  // A transform segment looks like "c_limit,w_600,q_60/"; a version looks like "v1234/".
  const firstSegment = tail.split("/")[0];
  if (firstSegment && /^[a-z]+_[^/]+$/.test(firstSegment) && !/^v\d+$/.test(firstSegment)) {
    tail = tail.slice(firstSegment.length + 1);
  }

  const parts: string[] = [];
  if (width) parts.push("c_limit", `w_${Math.round(width)}`);
  parts.push(quality ? `q_${Math.max(1, Math.min(100, Math.round(quality)))}` : "q_auto");
  parts.push("f_auto");

  return `${head}${parts.join(",")}/${tail}`;
};
