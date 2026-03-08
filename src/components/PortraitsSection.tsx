import { useState, useEffect } from "react";
import ScrollReveal from "./ScrollReveal";
import Lightbox, { LightboxImage } from "./Lightbox";
import { supabase } from "@/integrations/supabase/client";

type PortraitData = {
  src: string;
  title: string;
  subtitle: string;
};

const PortraitsSection = () => {
  const [portraits, setPortraits] = useState<PortraitData[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
            src: p.src,
            title: p.alt || "Untitled",
            subtitle: p.subtitle || "",
          }))
        );
      }
    };
    fetchData();
  }, []);

  const lightboxImages: LightboxImage[] = portraits.map((p) => ({
    src: p.src,
    alt: p.title,
  }));

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
          <ScrollReveal key={p.title + i} delay={i * 0.15} className="group">
            <div
              className="relative overflow-hidden rounded-2xl cursor-pointer"
              onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
            >
              <img
                src={p.src}
                alt={p.title}
                className="w-full aspect-[3/2] object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <p className="text-sm tracking-[0.2em] uppercase text-primary-foreground/70 font-body mb-1">
                  {p.subtitle}
                </p>
                <h3 className="text-3xl font-bold font-display text-primary-foreground">
                  {p.title}
                </h3>
              </div>
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
