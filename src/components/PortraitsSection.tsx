import { useState, useEffect } from "react";
import ScrollReveal from "./ScrollReveal";
import SlideCarousel from "./SlideCarousel";
import Lightbox, { LightboxImage } from "./Lightbox";
import DraggableCrop from "./DraggableCrop";
import { supabase } from "@/integrations/supabase/client";
import { loadedCache } from "./ProgressiveImage";
import { getPreviewUrl } from "@/lib/image-utils";

type PortraitData = {
  id: string;
  src: string;
  title: string;
  subtitle: string;
  cropX: number;
  cropY: number;
};

const HOMEPAGE_PORTRAIT_PREVIEW_WIDTHS = [360, 540, 720, 960, 1200, 1440] as const;

const getClosestPreviewWidth = (targetWidth: number) =>
  HOMEPAGE_PORTRAIT_PREVIEW_WIDTHS.find((width) => width >= targetWidth) ??
  HOMEPAGE_PORTRAIT_PREVIEW_WIDTHS[HOMEPAGE_PORTRAIT_PREVIEW_WIDTHS.length - 1];

const getPortraitPreloadWidth = () => {
  if (typeof window === "undefined") return 960;

  const viewportWidth = window.innerWidth;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const slotWidth =
    viewportWidth >= 1280 ? viewportWidth * 0.38 :
    viewportWidth >= 768 ? viewportWidth * 0.44 :
    viewportWidth * 0.92;

  return getClosestPreviewWidth(Math.ceil(slotWidth * dpr));
};

const PortraitsSection = () => {
  const [portraits, setPortraits] = useState<PortraitData[]>([]);
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
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

        const preloadWidth = getPortraitPreloadWidth();
        const preload = (photo: any) => {
          const img = new Image();
          img.onload = () => loadedCache.add(photo.src);
          img.src = getPreviewUrl(photo.src, preloadWidth, 74);
        };

        data.slice(0, 2).forEach(preload);

        const remaining = data.slice(2);
        if (remaining.length > 0) {
          const schedule =
            typeof window !== "undefined" && "requestIdleCallback" in window
              ? window.requestIdleCallback.bind(window)
              : (cb: () => void) => window.setTimeout(cb, 250);

          schedule(() => {
            remaining.forEach(preload);
          });
        }
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

  const current = portraits[Math.min(active, portraits.length - 1)];

  return (
    <section id="portraits" className="relative py-16 md:py-28 px-6">
      <div className="text-center mb-8 md:mb-12">
        <ScrollReveal>
          <p className="text-sm font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4 font-body">
            Collection Two
          </p>
          <h2 className="section-title section-title-winter mb-6">Portraits</h2>
          <div className="pastel-divider w-24 mx-auto" />
        </ScrollReveal>
      </div>

      <div className="max-w-5xl mx-auto">
        <SlideCarousel
          active={active}
          onActiveChange={setActive}
          onActivate={() => setLightboxOpen(true)}
          slideWidthClass="w-[clamp(200px,58vw,340px)]"
          label="Portrait photographs"
        >
          {portraits.map((p, i) => (
            <div
              key={p.id}
              className="group relative rounded-2xl overflow-hidden shadow-2xl"
            >
              <DraggableCrop
                src={p.src}
                photoId={p.id}
                initialX={p.cropX}
                initialY={p.cropY}
                isAdmin={isAdmin}
                aspectClass="aspect-[2/3]"
                priority={i < 2}
                onSave={(x, y) => handleCropSave(i, x, y)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          ))}
        </SlideCarousel>

        {(current.title !== "Untitled" || current.subtitle) && (
          <div key={active} className="slide-caption text-center max-w-2xl mx-auto mt-8 px-4">
            {current.title !== "Untitled" && (
              <h3 className="text-xl md:text-2xl font-semibold font-display text-foreground/90 mb-1">
                {current.title}
              </h3>
            )}
            {current.subtitle && (
              <p className="text-base text-muted-foreground font-body font-light">
                {current.subtitle}
              </p>
            )}
          </div>
        )}
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

export default PortraitsSection;
