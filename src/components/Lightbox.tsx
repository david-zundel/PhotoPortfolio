import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

export interface LightboxImage {
  src: string;
  alt?: string;
  location?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const Lightbox = ({ images, initialIndex, isOpen, onClose }: LightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose, goNext, goPrev]);

  if (!isOpen || images.length === 0) return null;

  const current = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-primary-foreground/80 hover:text-primary-foreground transition-colors z-10"
      >
        <X size={32} />
      </button>

      {/* Previous */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-6 text-primary-foreground/60 hover:text-primary-foreground transition-colors z-10"
        >
          <ChevronLeft size={48} />
        </button>
      )}

      {/* Image */}
      <div
        className="relative max-w-[90vw] max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.src}
          alt={current.alt || ""}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
        {current.location && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-foreground/60 backdrop-blur-md rounded-full px-4 py-2">
            <MapPin size={16} className="text-primary-foreground/80" />
            <span className="text-sm font-body text-primary-foreground/90">{current.location}</span>
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-foreground/60 backdrop-blur-md rounded-full px-4 py-2">
            <span className="text-sm font-body text-primary-foreground/80">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        )}
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-6 text-primary-foreground/60 hover:text-primary-foreground transition-colors z-10"
        >
          <ChevronRight size={48} />
        </button>
      )}
    </div>
  );
};

export default Lightbox;
