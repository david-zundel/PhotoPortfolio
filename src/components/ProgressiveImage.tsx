import { useState, useEffect, memo, useCallback } from "react";
import { getPreviewUrl, getThumbUrl } from "@/lib/image-utils";

interface ProgressiveImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fetchPriority?: "high" | "low" | "auto";
  draggable?: boolean;
  previewWidth?: number;
  previewQuality?: number;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onFullLoad?: () => void;
}

// Global cache so images that have loaded once never re-trigger transitions
const loadedCache = new Set<string>();

const ProgressiveImage = memo(({
  src,
  alt = "",
  className = "",
  style,
  fetchPriority,
  draggable,
  previewWidth = 1920,
  previewQuality = 75,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onFullLoad,
}: ProgressiveImageProps) => {
  const alreadyCached = loadedCache.has(src);
  const [fullLoaded, setFullLoaded] = useState(alreadyCached);
  const [useFallback, setUseFallback] = useState(false);
  
  // Try preview URL first, fall back to original if it fails
  const previewSrc = getPreviewUrl(src, previewWidth, previewQuality);
  const displaySrc = useFallback ? src : previewSrc;
  const thumbSrc = getThumbUrl(src);

  useEffect(() => {
    if (loadedCache.has(src)) {
      setFullLoaded(true);
    }
  }, [src]);

  const handleLoad = useCallback(() => {
    loadedCache.add(src);
    setFullLoaded(true);
    onFullLoad?.();
  }, [src, onFullLoad]);

  const handleError = useCallback(() => {
    if (!useFallback) {
      // Preview URL failed, try original
      setUseFallback(true);
    }
  }, [useFallback]);

  // Already cached — render single static image, no transitions
  if (alreadyCached) {
    return (
      <img
        src={displaySrc}
        alt={alt}
        title=""
        className={className}
        style={style}
        draggable={draggable}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onError={handleError}
      />
    );
  }

  return (
    <>
      {!fullLoaded && (
        <img
          src={thumbSrc}
          alt=""
          aria-hidden
          className={className}
          style={{ ...style, filter: "blur(20px)", transform: "scale(1.1)", zIndex: 1 }}
          draggable={false}
          onError={() => {
            // If thumb fails, just let it be transparent
          }}
        />
      )}
      <img
        src={displaySrc}
        alt={alt}
        title=""
        className={`${className} transition-opacity duration-500 ${
          fullLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ ...style, zIndex: 2 }}
        fetchPriority={fetchPriority}
        decoding="async"
        draggable={draggable}
        onLoad={handleLoad}
        onError={handleError}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </>
  );
});

ProgressiveImage.displayName = "ProgressiveImage";

export default ProgressiveImage;
