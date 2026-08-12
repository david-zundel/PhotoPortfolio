import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LandscapesSection from "@/components/LandscapesSection";
import PortraitsSection from "@/components/PortraitsSection";
import ContactSection from "@/components/ContactSection";
import ScrollReveal from "@/components/ScrollReveal";
import { SeasonSky } from "@/components/SeasonScene";

const Index = () => {
  return (
    <div className="min-h-screen relative isolate overflow-hidden">
      {/* Per-page sky: winter renders WinterSky + snow here; autumn renders
          nothing (the pond brings its own sky from the app-level SeasonScene).
          bg-background is intentionally NOT set — the pond is a fixed z-0 backdrop
          and an opaque wrapper would hide it. body still carries bg-background. */}
      <SeasonSky />

      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <LandscapesSection />
        <PortraitsSection />

        <div className="py-12 md:py-24 px-6 text-center">
          <ScrollReveal>
            <Link to="/gallery" className="inline-flex items-center gap-3 nav-pill active text-lg group">
              See more of my photos
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </ScrollReveal>
        </div>

        <ContactSection />
      </div>
    </div>
  );
};

export default Index;
