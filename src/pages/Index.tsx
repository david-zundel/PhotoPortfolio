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
      {/* Content */}
      <div className="relative z-10">
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

      {/* Draggable orbs — z-20, container is pointer-events-none so clicks pass through to content, each orb is pointer-events-auto for dragging */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-visible">
        <DraggableOrbs />
      </div>
    </div>
  );
};

export default Index;
