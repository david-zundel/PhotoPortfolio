import { useState, useEffect } from "react";
import ScrollReveal from "./ScrollReveal";
import Lightbox, { LightboxImage } from "./Lightbox";
import DraggableCrop from "./DraggableCrop";
import { supabase } from "@/integrations/supabase/client";
import { getPreviewUrl } from "@/lib/image-utils";

type PortraitData = {
  id: string;
  src: string;
  title: string;
  subtitle: string;
  cropX: number;
  cropY: number;
};

const PortraitsSection = () => {
  const [portraits, setPortraits] = useState<PortraitData[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
    };
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAdmin(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("photos")
        .select("*")
        .eq("homepage", true)
        .eq("category", "portrait")
        .order("sort_order")
        .order("created_at", { ascending: false });

      if (data) {
        setPortraits(
          data.map((p: any) => ({
            id: p.id,
            src: p.src,
            title: p.alt || "Untitled",
            subtitle: p.subtitle || "",
            cropX: p.crop_x ?? 50,
            cropY: p.crop_y ?? 50,
          }))
        );
        // Preload the actual rendered URLs
        data.forEach((p: any) => {
          const img = new Image();
          img.src = getPreviewUrl(p.src, 1200, 75);
        });
      }
    };
    fetchData();
  }, []);

  const lightboxImages: LightboxImage[] = portraits.map((p) => ({
    src: p.src,
    alt: p.title,
  }));

  const handleCropSave = (index: number, x: number, y: number) => {
    setPortraits((prev) =>
      prev.map((p, i) => (i === index ? { ...p, cropX: x, cropY: y } : p))
    );
  };

  if (portraits.length === 0) return null;

  return (
    <section id="portraits" className="relative py-16 md:py-32 px-6">
      <div className="text-center mb-12 md:mb-24">
        <ScrollReveal>
          <p className="text-sm font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4 font-body">
            Collection Two
          </p>
          <h2 className="section-title section-title-portraits mb-6">Portraits</h2>
          <div className="pastel-divider w-24 mx-auto" />
        </ScrollReveal>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {portraits.map((p, i) => (
          <ScrollReveal key={p.id} delay={i * 0.15} className="group">
            <div
              className="relative rounded-2xl cursor-pointer overflow-hidden"
              onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
            >
              <DraggableCrop
                src={p.src}
                photoId={p.id}
                initialX={p.cropX}
                initialY={p.cropY}
                isAdmin={isAdmin}
                aspectClass="aspect-[2/3]"
                onSave={(x, y) => handleCropSave(i, x, y)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          </ScrollReveal>
        ))}
      </div>

      <Lightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </section>
  );
};

export default PortraitsSection;
