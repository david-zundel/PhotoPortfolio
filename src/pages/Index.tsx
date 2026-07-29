import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LandscapesSection from "@/components/LandscapesSection";
import PortraitsSection from "@/components/PortraitsSection";
import ContactSection from "@/components/ContactSection";
import ScrollReveal from "@/components/ScrollReveal";
import WinterSky from "@/components/WinterSky";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative isolate overflow-hidden">
      <WinterSky />

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
