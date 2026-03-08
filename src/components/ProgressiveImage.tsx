import { useState, useEffect, memo } from "react";

interface ProgressiveImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  fetchPriority?: "high" | "low" | "auto";
  draggable?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onFullLoad?: () => void;
}

// Global cache so images that have loaded once never re-trigger transitions
const loadedCache = new Set<string>();

const getThumbUrl = (src: string) => {
  try {
    const url = new URL(src);
    if (url.pathname.includes("/storage/v1/object/public/")) {
      const renderPath = url.pathname.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/"
      );
      return `${url.origin}${renderPath}?width=60&quality=20`;
    }
  } catch {}
  return src;
};

const ProgressiveImage = memo(({
  src,
  alt = "",
  className = "",
  style,
  fetchPriority,
  draggable,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onFullLoad,
}: ProgressiveImageProps) => {
  const alreadyCached = loadedCache.has(src);
  const [fullLoaded, setFullLoaded] = useState(alreadyCached);
  const thumbSrc = getThumbUrl(src);

  useEffect(() => {
    if (loadedCache.has(src)) {
      setFullLoaded(true);
    }
  }, [src]);

  const handleLoad = () => {
    loadedCache.add(src);
    setFullLoaded(true);
    onFullLoad?.();
  };

  // Already cached — render single static image, no transitions
  if (alreadyCached) {
    return (
      <img
        src={src}
        alt={alt}
        title=""
        className={className}
        style={style}
        draggable={draggable}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
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
        />
      )}
      <img
        src={src}
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
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </>
  );
});

ProgressiveImage.displayName = "ProgressiveImage";

export default ProgressiveImage;
