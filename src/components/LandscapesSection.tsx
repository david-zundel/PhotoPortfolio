import { useState, useEffect } from "react";
import ScrollReveal from "./ScrollReveal";
import SlideCarousel from "./SlideCarousel";
import ProgressiveImage from "./ProgressiveImage";
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
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Natural aspect ratio (w/h) per image so panoramas show whole (never cropped)
  const [ratios, setRatios] = useState<Record<string, number>>({});

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
        // Preload all images immediately so gliding between slides is instant,
        // and record each one's true aspect ratio to size its card (no cropping).
        data.forEach((p: any) => {
          const img = new Image();
          img.onload = () => {
            if (img.naturalWidth && img.naturalHeight) {
              setRatios((prev) =>
                prev[p.src] ? prev : { ...prev, [p.src]: img.naturalWidth / img.naturalHeight }
              );
            }
          };
          img.src = p.src;
        });
      }
    };
    fetchData();
  }, []);

  const lightboxImages: LightboxImage[] = countries.map((c) => ({
    src: c.image,
    alt: `Landscape of ${c.country}`,
    location: c.country,
  }));

  if (countries.length === 0) return null;

  const current = countries[Math.min(active, countries.length - 1)];

  return (
    <section id="landscapes" className="relative py-16 md:py-28 px-6">
      <div className="text-center mb-8 md:mb-12 relative z-10">
        <ScrollReveal>
          <p className="text-sm font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4 font-body">
            Collection One
          </p>
          <h2 className="section-title section-title-winter mb-6">Landscapes</h2>
          <div className="pastel-divider w-24 mx-auto" />
        </ScrollReveal>
      </div>

      <div className="max-w-6xl mx-auto">
        <SlideCarousel
          active={active}
          onActiveChange={setActive}
          onActivate={() => setLightboxOpen(true)}
          slideWidthClass="w-[clamp(260px,66vw,640px)]"
          label="Landscape photographs"
        >
          {countries.map((c, i) => (
            <div
              key={c.country + i}
              className="rounded-2xl overflow-hidden bg-muted shadow-2xl"
            >
              <div
                className="relative w-full"
                style={{ aspectRatio: String(ratios[c.image] ?? 1.5) }}
              >
                <ProgressiveImage
                  src={c.image}
                  alt={`Landscape of ${c.country}`}
                  mode="cover"
                  containerClassName="absolute inset-0"
                  previewWidth={1600}
                  previewQuality={82}
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                />
              </div>
            </div>
          ))}
        </SlideCarousel>

        {/* Caption for the centered landscape — updates as you navigate */}
        <div key={active} className="slide-caption text-center max-w-2xl mx-auto mt-8 px-4">
          <h3
            className="text-2xl md:text-3xl font-semibold font-display mb-3 bg-clip-text text-transparent inline-block"
            style={{ backgroundImage: current.textGradient, paddingBottom: "0.1em" }}
          >
            {current.country}
          </h3>
          {current.description && (
            <p className="text-base text-muted-foreground font-body font-light leading-relaxed">
              {current.description}
            </p>
          )}
        </div>
      </div>

      <Lightbox
        images={lightboxImages}
        initialIndex={active}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </section>
  );
};

export default LandscapesSection;
