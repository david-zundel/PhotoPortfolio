import { useState, useEffect } from "react";
import ScrollReveal from "./ScrollReveal";
import LandscapeCountry from "./LandscapeCountry";
import Lightbox, { LightboxImage } from "./Lightbox";
import { supabase } from "@/integrations/supabase/client";

type CountryData = {
  country: string;
  description: string;
  image: string;
  color: string;
  textGradient: string;
};

const LandscapesSection = () => {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<LightboxImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("photos")
        .select("*")
        .eq("homepage", true)
        .eq("category", "landscape")
        .order("sort_order")
        .order("created_at", { ascending: false });

      if (data) {
        setCountries(
          data.map((p: any) => ({
            country: p.location || p.alt || "Untitled",
            description: p.description || "",
            image: p.src,
            color: p.color || "hsl(200 60% 78% / 0.15)",
            textGradient: p.text_gradient || "linear-gradient(135deg, hsl(190 40% 40%), hsl(220 35% 50%))",
          }))
        );
      }
    };
    fetchData();
  }, []);

  const handleImageClick = (images: LightboxImage[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (countries.length === 0) return null;

  return (
    <section id="landscapes" className="relative">
      <div className="py-32 px-6 text-center relative z-10">
        <ScrollReveal>
          <p className="text-sm font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4 font-body">
            Collection One
          </p>
          <h2 className="section-title section-title-landscapes mb-6">Landscapes</h2>
          <div className="pastel-divider w-24 mx-auto" />
        </ScrollReveal>
      </div>

      {countries.map((c, i) => (
        <LandscapeCountry key={c.country + i} {...c} index={i} onImageClick={handleImageClick} />
      ))}

      <Lightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </section>
  );
};

export default LandscapesSection;
