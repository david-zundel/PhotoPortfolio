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

const TEXT_GRADIENTS = [
  "linear-gradient(135deg, hsl(160 38% 38%), hsl(140 35% 42%))", // forest green
  "linear-gradient(135deg, hsl(330 50% 52%), hsl(290 42% 55%))", // magenta-purple
  "linear-gradient(135deg, hsl(25 60% 50%), hsl(45 55% 48%))",   // warm amber
  "linear-gradient(135deg, hsl(200 55% 45%), hsl(220 50% 52%))", // ocean blue
  "linear-gradient(135deg, hsl(280 45% 50%), hsl(320 40% 55%))", // violet-pink
  "linear-gradient(135deg, hsl(10 65% 52%), hsl(35 60% 50%))",   // coral-orange
  "linear-gradient(135deg, hsl(175 45% 40%), hsl(195 50% 45%))", // teal
  "linear-gradient(135deg, hsl(350 55% 50%), hsl(15 50% 52%))",  // rose-red
];

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
          data.map((p: any, index: number) => ({
            country: p.location || p.alt || "Untitled",
            description: p.description || "",
            image: p.src,
            color: p.color || "hsl(200 60% 78% / 0.15)",
            textGradient: p.text_gradient || TEXT_GRADIENTS[index % TEXT_GRADIENTS.length],
          }))
        );
        // Preload all images immediately so they're ready when scrolled into view
        data.forEach((p: any) => {
          const img = new Image();
          img.src = p.src;
        });
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
      <div className="pt-16 md:pt-32 pb-6 md:pb-12 px-6 text-center relative z-10">
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
