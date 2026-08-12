import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Lightbox, { LightboxImage } from "@/components/Lightbox";
import ProgressiveImage from "@/components/ProgressiveImage";
import { supabase } from "@/integrations/supabase/client";
import { getPreviewSrcSet } from "@/lib/image-utils";
import { SeasonSky } from "@/components/SeasonScene";

type FilterType = "all" | "landscapes" | "portraits";

const GALLERY_IMAGE_SIZES = "(min-width: 1280px) 30vw, (min-width: 640px) 46vw, 92vw";
const GALLERY_IMAGE_WIDTHS = [360, 540, 720, 960, 1280] as const;

const Gallery = () => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [photos, setPhotos] = useState<LightboxImage[]>([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data } = await supabase
        .from("photos")
        .select("*")
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (data && data.length > 0) {
        setPhotos(
          data.map((p: any) => ({
            src: p.src,
            alt: p.alt || undefined,
            location: p.location || undefined,
            _category: p.category,
          }))
        );
      }
    };
    fetchPhotos();
  }, []);

  const landscapes = photos.filter((p: any) => (p._category ? p._category === "landscape" : !!p.location));
  const portraits = photos.filter((p: any) => (p._category ? p._category === "portrait" : !p.location));
  const filtered = filter === "all" ? photos : filter === "landscapes" ? landscapes : portraits;

  const handlePhotoClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-screen relative isolate overflow-hidden">
      {/* Winter renders WinterSky + snow; autumn renders nothing (pond is the
          app-level backdrop). bg-background omitted so the fixed z-0 pond shows. */}
      <SeasonSky />

      <div className="relative z-10">
        <div className="pt-12 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body mb-8"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back to Home</span>
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="winter-name mb-4">Gallery</h1>
              <p className="text-lg text-muted-foreground font-body font-light max-w-md">
                The complete collection — click any photo for details.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="px-6 pb-12">
          <div className="max-w-7xl mx-auto flex gap-2 sky-bar">
            {(["all", "landscapes", "portraits"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`nav-pill capitalize ${filter === f ? "active" : ""}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-24">
          <div className="max-w-7xl mx-auto columns-1 sm:columns-2 lg:columns-3 gap-6">
            {filtered.map((photo: any, i) => (
              <div
                key={`${photo.src}-${i}`}
                className="mb-4 break-inside-avoid group cursor-pointer"
                onClick={() => handlePhotoClick(i)}
              >
                <div className="relative rounded-xl overflow-hidden">
                  <ProgressiveImage
                    src={photo.src}
                    alt={photo.alt || ""}
                    className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"
                    srcSet={getPreviewSrcSet(photo.src, GALLERY_IMAGE_WIDTHS, 78)}
                    sizes={GALLERY_IMAGE_SIZES}
                    loading={i < 3 ? "eager" : "lazy"}
                    fetchPriority={i < 2 ? "high" : "auto"}
                    draggable={false}
                    previewWidth={960}
                    previewQuality={78}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
                  {photo.location && (
                    <div className="absolute bottom-3 left-3 bg-foreground/50 backdrop-blur-md rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                      <span className="text-xs font-body text-primary-foreground/90">{photo.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Lightbox
        images={filtered}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default Gallery;
