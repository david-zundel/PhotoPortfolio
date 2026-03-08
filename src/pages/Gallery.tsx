import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Lightbox, { LightboxImage } from "@/components/Lightbox";
import { supabase } from "@/integrations/supabase/client";

type FilterType = "all" | "landscapes" | "portraits";

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
        setPhotos(data.map((p: any) => ({
          src: p.src,
          alt: p.alt || undefined,
          location: p.location || undefined,
          _category: p.category,
        })));
      }
    };
    fetchPhotos();
  }, []);

  const landscapes = photos.filter((p: any) => p._category ? p._category === "landscape" : !!p.location);
  const portraits = photos.filter((p: any) => p._category ? p._category === "portrait" : !p.location);
  const filtered = filter === "all" ? photos : filter === "landscapes" ? landscapes : portraits;

  const handlePhotoClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10vh] right-[15vw] w-[30vw] h-[30vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-lavender/30 blur-3xl" />
        <div className="absolute top-[40vh] right-[-5vw] w-[28vw] h-[28vw] max-w-[450px] max-h-[450px] min-w-[180px] min-h-[180px] rounded-full bg-pastel-mint/30 blur-3xl" />
        <div className="absolute top-[70vh] left-[10vw] w-[25vw] h-[25vw] max-w-[400px] max-h-[400px] min-w-[180px] min-h-[180px] rounded-full bg-pastel-peach/25 blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="pt-12 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body mb-8">
              <ArrowLeft size={18} />
              <span className="text-sm">Back to Home</span>
            </Link>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="section-title gradient-text mb-4">Gallery</h1>
              <p className="text-lg text-muted-foreground font-body font-light max-w-md">
                The complete collection — click any photo for details.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="px-6 pb-12">
          <div className="max-w-7xl mx-auto flex gap-2">
            {(["all", "landscapes", "portraits"] as FilterType[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`nav-pill capitalize ${filter === f ? "active" : ""}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-24">
          <div className="max-w-7xl mx-auto columns-1 sm:columns-2 gap-6">
            {filtered.map((photo, i) => (
              <motion.div
                key={photo.src}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="mb-4 break-inside-avoid group cursor-pointer"
                onClick={() => handlePhotoClick(i)}
              >
                <div className="relative overflow-hidden rounded-xl">
                  <img src={photo.src} alt={photo.alt || ""} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                  {photo.location && (
                    <div className="absolute bottom-3 left-3 bg-foreground/50 backdrop-blur-md rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                      <span className="text-xs font-body text-primary-foreground/90">{photo.location}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Lightbox images={filtered} initialIndex={lightboxIndex} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </div>
  );
};

export default Gallery;
