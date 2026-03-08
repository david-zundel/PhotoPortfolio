import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Lightbox, { LightboxImage } from "@/components/Lightbox";

// Placeholder gallery data — David will replace with his real photos
const galleryPhotos: LightboxImage[] = [
  // Landscapes
  { src: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&h=533&fit=crop", alt: "Swiss Alps", location: "Switzerland" },
  { src: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=533&fit=crop", alt: "Cherry Blossoms", location: "Japan" },
  { src: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&h=533&fit=crop", alt: "Northern Lights", location: "Iceland" },
  { src: "https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=800&h=533&fit=crop", alt: "Amalfi Coast", location: "Italy" },
  { src: "https://images.unsplash.com/photo-1464817739973-0128fe77aed1?w=800&h=533&fit=crop", alt: "Patagonia", location: "Argentina" },
  { src: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800&h=533&fit=crop", alt: "Sahara Dunes", location: "Morocco" },
  { src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=533&fit=crop", alt: "Mountain Lake", location: "Switzerland" },
  { src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=533&fit=crop", alt: "Misty Forest", location: "Norway" },
  { src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=533&fit=crop", alt: "Mountain Valley", location: "New Zealand" },
  { src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&h=533&fit=crop", alt: "Green Hills", location: "Ireland" },
  { src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=533&fit=crop", alt: "Lake Sunset", location: "Canada" },
  { src: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&h=533&fit=crop", alt: "Waterfall", location: "Costa Rica" },
  // Portraits
  { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=533&fit=crop", alt: "Golden Hour Portrait" },
  { src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=533&fit=crop", alt: "Shadow Play" },
  { src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=533&fit=crop", alt: "Timeless" },
  { src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=533&fit=crop", alt: "Pure Joy" },
];

type FilterType = "all" | "landscapes" | "portraits";

const Gallery = () => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const landscapes = galleryPhotos.filter((p) => p.location);
  const portraits = galleryPhotos.filter((p) => !p.location);

  const filtered = filter === "all" ? galleryPhotos : filter === "landscapes" ? landscapes : portraits;

  const handlePhotoClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10vh] right-[15vw] w-[30vw] h-[30vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-lavender/30 blur-3xl" />
        <div className="absolute top-[40vh] right-[-5vw] w-[28vw] h-[28vw] max-w-[450px] max-h-[450px] min-w-[180px] min-h-[180px] rounded-full bg-pastel-mint/30 blur-3xl" />
        <div className="absolute top-[70vh] left-[10vw] w-[25vw] h-[25vw] max-w-[400px] max-h-[400px] min-w-[180px] min-h-[180px] rounded-full bg-pastel-peach/25 blur-3xl" />
        <div className="absolute top-[100vh] right-[20vw] w-[30vw] h-[30vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-sky/30 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
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
              <h1 className="section-title gradient-text mb-4">Gallery</h1>
              <p className="text-lg text-muted-foreground font-body font-light max-w-md">
                The complete collection — click any photo for details.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="px-6 pb-12">
          <div className="max-w-7xl mx-auto flex gap-2">
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

        {/* Masonry-style grid */}
        <div className="px-6 pb-24">
          <div className="max-w-7xl mx-auto columns-1 sm:columns-2 lg:columns-3 gap-4">
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
                  <img
                    src={photo.src}
                    alt={photo.alt || ""}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
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
