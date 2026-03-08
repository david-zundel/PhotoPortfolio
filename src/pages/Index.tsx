import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LandscapesSection from "@/components/LandscapesSection";
import PortraitsSection from "@/components/PortraitsSection";
import ContactSection from "@/components/ContactSection";
import ScrollReveal from "@/components/ScrollReveal";
import DraggableOrbs from "@/components/DraggableOrbs";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Orb layer — behind content (z-0), not interactive */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <DraggableOrbs />
      </div>

      {/* Content layer — above orbs */}
      <div className="relative z-10 pointer-events-auto">
        <Navbar />
        <HeroSection />
        <LandscapesSection />
        <PortraitsSection />

        {/* See more CTA */}
        <div className="py-24 px-6 text-center">
          <ScrollReveal>
            <Link
              to="/gallery"
              className="inline-flex items-center gap-3 nav-pill active text-lg group"
            >
              See more of my photos
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </ScrollReveal>
        </div>

        <ContactSection />
      </div>

      {/* Invisible drag handles — on top of everything (z-20), only the handle dots are interactive */}
      <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden">
        <DraggableOrbs />
      </div>
    </div>
  );
};

export default Index;
