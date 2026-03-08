import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LandscapesSection from "@/components/LandscapesSection";
import PortraitsSection from "@/components/PortraitsSection";
import ContactSection from "@/components/ContactSection";
import ScrollReveal from "@/components/ScrollReveal";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Global flowing pastel orbs — warm near top, cool in middle, warm-cool blend at bottom */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Hero area — warm coral, rose, peach */}
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-pastel-coral/35 blur-3xl" />
        <div className="absolute top-[5vh] right-[-8vw] w-[500px] h-[500px] rounded-full bg-pastel-peach/40 blur-3xl" />
        <div className="absolute top-[20vh] left-[25vw] w-[400px] h-[400px] rounded-full blur-3xl" style={{ background: 'hsl(340 55% 75% / 0.35)' }} />

        {/* Transition — peach to gold to lemon */}
        <div className="absolute top-[40vh] right-[10vw] w-[500px] h-[500px] rounded-full bg-pastel-lemon/38 blur-3xl" />
        <div className="absolute top-[55vh] left-[-5vw] w-[450px] h-[450px] rounded-full blur-3xl" style={{ background: 'hsl(15 70% 75% / 0.35)' }} />
        <div className="absolute top-[70vh] right-[30vw] w-[400px] h-[400px] rounded-full bg-pastel-peach/35 blur-3xl" />

        {/* Landscapes area — spreads across ~600vh worth of content */}
        <div className="absolute top-[90vh] left-[15vw] w-[550px] h-[550px] rounded-full bg-pastel-mint/40 blur-3xl" />
        <div className="absolute top-[130vh] right-[-5vw] w-[500px] h-[500px] rounded-full bg-pastel-sky/38 blur-3xl" />
        <div className="absolute top-[170vh] left-[-8vw] w-[450px] h-[450px] rounded-full blur-3xl" style={{ background: 'hsl(140 40% 72% / 0.35)' }} />
        <div className="absolute top-[210vh] right-[20vw] w-[500px] h-[500px] rounded-full bg-pastel-lemon/35 blur-3xl" />
        <div className="absolute top-[250vh] left-[30vw] w-[500px] h-[500px] rounded-full bg-pastel-sky/35 blur-3xl" />
        <div className="absolute top-[290vh] right-[5vw] w-[550px] h-[550px] rounded-full bg-pastel-mint/35 blur-3xl" />
        <div className="absolute top-[330vh] left-[-5vw] w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: 'hsl(15 70% 75% / 0.35)' }} />
        <div className="absolute top-[370vh] right-[15vw] w-[450px] h-[450px] rounded-full bg-pastel-peach/38 blur-3xl" />
        <div className="absolute top-[410vh] left-[20vw] w-[500px] h-[500px] rounded-full bg-pastel-lemon/35 blur-3xl" />
        <div className="absolute top-[450vh] right-[-3vw] w-[550px] h-[550px] rounded-full blur-3xl" style={{ background: 'hsl(340 55% 75% / 0.35)' }} />
        <div className="absolute top-[490vh] left-[10vw] w-[500px] h-[500px] rounded-full bg-pastel-coral/35 blur-3xl" />
        <div className="absolute top-[530vh] right-[25vw] w-[450px] h-[450px] rounded-full bg-pastel-mint/38 blur-3xl" />
        <div className="absolute top-[570vh] left-[-5vw] w-[500px] h-[500px] rounded-full bg-pastel-sky/35 blur-3xl" />
        <div className="absolute top-[610vh] right-[10vw] w-[550px] h-[550px] rounded-full bg-pastel-lavender/38 blur-3xl" />

        {/* Transition to Portraits */}
        <div className="absolute top-[650vh] left-[5vw] w-[500px] h-[500px] rounded-full bg-pastel-lavender/40 blur-3xl" />
        <div className="absolute top-[690vh] right-[15vw] w-[450px] h-[450px] rounded-full blur-3xl" style={{ background: 'hsl(330 50% 72% / 0.35)' }} />

        {/* Portraits area */}
        <div className="absolute top-[730vh] left-[20vw] w-[550px] h-[550px] rounded-full blur-3xl" style={{ background: 'hsl(350 55% 75% / 0.38)' }} />
        <div className="absolute top-[770vh] right-[-3vw] w-[500px] h-[500px] rounded-full bg-pastel-lavender/35 blur-3xl" />
        <div className="absolute top-[810vh] left-[-5vw] w-[450px] h-[450px] rounded-full bg-pastel-peach/40 blur-3xl" />
        <div className="absolute top-[850vh] right-[25vw] w-[400px] h-[400px] rounded-full blur-3xl" style={{ background: 'hsl(10 65% 78% / 0.35)' }} />

        {/* Contact area */}
        <div className="absolute top-[890vh] left-[10vw] w-[550px] h-[550px] rounded-full bg-pastel-lemon/38 blur-3xl" />
        <div className="absolute top-[930vh] right-[10vw] w-[500px] h-[500px] rounded-full bg-pastel-coral/35 blur-3xl" />
        <div className="absolute top-[970vh] left-[25vw] w-[450px] h-[450px] rounded-full bg-pastel-sky/35 blur-3xl" />
      </div>
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
    </div>
  );
};

export default Index;
