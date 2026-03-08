import { useState, useEffect } from "react";

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

const getThumbUrl = (src: string) => {
  try {
    const url = new URL(src);
    if (url.pathname.includes("/storage/v1/object/public/")) {
      // Use Supabase render endpoint for transforms
      const renderPath = url.pathname.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/"
      );
      return `${url.origin}${renderPath}?width=60&quality=20`;
    }
  } catch {}
  return src;
};

const ProgressiveImage = ({
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
  const [fullLoaded, setFullLoaded] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const thumbSrc = getThumbUrl(src);

  // Reset on src change
  useEffect(() => {
    setFullLoaded(false);
    setThumbLoaded(false);
  }, [src]);

  return (
    <>
      {/* Tiny blurred preview */}
      <img
        src={thumbSrc}
        alt=""
        aria-hidden
        className={`${className} transition-opacity duration-300 ${
          thumbLoaded && !fullLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ ...style, filter: "blur(20px)", transform: "scale(1.1)" }}
        onLoad={() => setThumbLoaded(true)}
        draggable={false}
      />
      {/* Full resolution */}
      <img
        src={src}
        alt={alt}
        title=""
        className={`${className} transition-opacity duration-500 ${
          fullLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={style}
        fetchPriority={fetchPriority}
        decoding="async"
        draggable={draggable}
        onLoad={() => {
          setFullLoaded(true);
          onFullLoad?.();
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </>
  );
};

export default ProgressiveImage;
