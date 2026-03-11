import { useState, useEffect, memo, useCallback, useRef } from "react";
import { getPreviewUrl, getThumbUrl } from "@/lib/image-utils";

export type ProgressiveImageMode = "intrinsic" | "cover";

interface ProgressiveImageProps {
  src: string;
  alt?: string;
  srcSet?: string;
  sizes?: string;

  /**
   * Wrapper element class.
   * - Use this when you need a fixed aspect ratio container.
   */
  containerClassName?: string;

  /**
   * Image element class (applied to both thumb + full image).
   * Prefer this over `className`.
   */
  imgClassName?: string;

  /** Backward-compatible alias for imgClassName */
  className?: string;

  /** Inline styles applied to the image element(s) */
  style?: React.CSSProperties;

  /** How to size/position the image */
  mode?: ProgressiveImageMode;

  fetchPriority?: "high" | "low" | "auto";
  loading?: "eager" | "lazy";
  lazyRootMargin?: string;
  draggable?: boolean;
  previewWidth?: number;
  previewQuality?: number;

  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onFullLoad?: () => void;
}

// Global cache so images that have loaded once never re-trigger transitions
export const loadedCache = new Set<string>();

const ProgressiveImage = memo(({
  src,
  alt = "",
  srcSet,
  sizes,
  containerClassName = "",
  imgClassName,
  className,
  style,
  mode = "intrinsic",
  fetchPriority,
  loading = "eager",
  lazyRootMargin = "1200px 0px",
  draggable,
  previewWidth = 1920,
  previewQuality = 75,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onFullLoad,
}: ProgressiveImageProps) => {
  const alreadyCached = loadedCache.has(src);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [fullLoaded, setFullLoaded] = useState(alreadyCached);
  const [useFallback, setUseFallback] = useState(false);
  const [shouldLoadFull, setShouldLoadFull] = useState(alreadyCached || loading !== "lazy");

  // Try preview URL first, fall back to original if it fails
  const previewSrc = getPreviewUrl(src, previewWidth, previewQuality);
  const displaySrc = useFallback ? src : previewSrc;
  const thumbSrc = getThumbUrl(src);

  useEffect(() => {
    if (loadedCache.has(src)) setFullLoaded(true);
  }, [src]);

  useEffect(() => {
    setShouldLoadFull(loadedCache.has(src) || loading !== "lazy");
  }, [src, loading]);

  useEffect(() => {
    if (shouldLoadFull || loading !== "lazy" || !wrapperRef.current) return;

    if (typeof IntersectionObserver === "undefined") {
      setShouldLoadFull(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadFull(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: lazyRootMargin,
      }
    );

    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [shouldLoadFull, loading, lazyRootMargin]);

  const handleLoad = useCallback(() => {
    loadedCache.add(src);
    setFullLoaded(true);
    onFullLoad?.();
  }, [src, onFullLoad]);

  const handleError = useCallback(() => {
    if (!useFallback) setUseFallback(true);
  }, [useFallback]);

  const imgBaseClass =
    mode === "cover"
      ? "absolute inset-0 w-full h-full object-cover"
      : "w-full h-auto block";

  const mergedImgClass = `${imgBaseClass} ${imgClassName ?? className ?? ""}`.trim();

  // Already cached — render single static image, no transitions
  if (alreadyCached) {
    // For cover mode, still need the container for positioning
    if (mode === "cover") {
      return (
        <div className={containerClassName}>
          <img
            src={displaySrc}
            alt={alt}
            title=""
            className={mergedImgClass}
            style={style}
            srcSet={useFallback ? undefined : srcSet}
            sizes={useFallback ? undefined : sizes}
            fetchPriority={fetchPriority}
            loading={loading}
            decoding="async"
            draggable={draggable}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onError={handleError}
          />
        </div>
      );
    }
    return (
      <img
        src={displaySrc}
        alt={alt}
        title=""
        className={mergedImgClass}
        style={style}
        srcSet={useFallback ? undefined : srcSet}
        sizes={useFallback ? undefined : sizes}
        fetchPriority={fetchPriority}
        loading={loading}
        decoding="async"
        draggable={draggable}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onError={handleError}
      />
    );
  }

  const containerStyle: React.CSSProperties =
    mode === "intrinsic" ? { display: "grid" } : {};

  // Overlap thumb + full image so we never stack two images vertically.
  // - intrinsic: use CSS grid overlap
  // - cover: images are absolutely positioned, but grid overlap is harmless
  const overlapStyle: React.CSSProperties =
    mode === "intrinsic" ? { gridArea: "1 / 1" } : {};

  return (
    <div ref={wrapperRef} className={containerClassName} style={containerStyle}>
      {!fullLoaded && (
        <img
          src={thumbSrc}
          alt=""
          aria-hidden
          className={mergedImgClass}
          style={{
            ...style,
            ...overlapStyle,
            filter: "blur(20px)",
            transform: "scale(1.06)",
            zIndex: 1,
          }}
          loading="eager"
          draggable={false}
          onError={() => {
            // If thumb fails, just let it be transparent
          }}
        />
      )}
      {shouldLoadFull && (
        <img
          src={displaySrc}
          alt={alt}
          title=""
          className={`${mergedImgClass} transition-opacity duration-500 ${
            fullLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            ...style,
            ...overlapStyle,
            zIndex: 2,
            // Avoid the invisible full image blocking interactions before it's ready.
            pointerEvents: fullLoaded ? "auto" : "none",
          }}
          srcSet={useFallback ? undefined : srcSet}
          sizes={useFallback ? undefined : sizes}
          fetchPriority={fetchPriority}
          loading={loading}
          decoding="async"
          draggable={draggable}
          onLoad={handleLoad}
          onError={handleError}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      )}
    </div>
  );
});

ProgressiveImage.displayName = "ProgressiveImage";

export default ProgressiveImage;
