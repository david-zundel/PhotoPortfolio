import { type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LandscapesSection from "@/components/LandscapesSection";
import PortraitsSection from "@/components/PortraitsSection";
import ContactSection from "@/components/ContactSection";
import ScrollReveal from "@/components/ScrollReveal";

type OrbConfig = {
  cls: string;
  style?: CSSProperties;
};

const ORBS: OrbConfig[] = [
  { cls: "absolute top-[-10vh] left-[-5vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-peach/30 blur-[60px]" },
  { cls: "absolute top-[80vh] right-[5vw] w-[38vw] h-[38vw] max-w-[600px] max-h-[600px] min-w-[260px] min-h-[260px] rounded-full bg-pastel-coral/25 blur-[60px]" },
  { cls: "absolute top-[5vh] right-[-8vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-peach/30 blur-[60px]" },
  { cls: "absolute top-[25vh] left-[25vw] w-[30vw] h-[30vw] max-w-[480px] max-h-[480px] min-w-[200px] min-h-[200px] rounded-full blur-[60px]", style: { background: "hsl(340 55% 75% / 0.25)" } },
  { cls: "absolute top-[70vh] right-[10vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-lemon/28 blur-[60px]" },
  { cls: "absolute top-[120vh] left-[-5vw] w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full blur-[60px]", style: { background: "hsl(15 70% 75% / 0.25)" } },
  { cls: "absolute top-[180vh] left-[15vw] w-[38vw] h-[38vw] max-w-[600px] max-h-[600px] min-w-[240px] min-h-[240px] rounded-full bg-pastel-mint/30 blur-[60px]" },
  { cls: "absolute top-[250vh] right-[-5vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-sky/28 blur-[60px]" },
  // Portrait section orbs
  { cls: "absolute top-[300vh] left-[5vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-lavender/30 blur-[60px]" },
  { cls: "absolute top-[340vh] right-[-3vw] w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full blur-[60px]", style: { background: "hsl(330 50% 75% / 0.25)" } },
  { cls: "absolute top-[380vh] left-[20vw] w-[38vw] h-[38vw] max-w-[600px] max-h-[600px] min-w-[240px] min-h-[240px] rounded-full bg-pastel-peach/28 blur-[60px]" },
  { cls: "absolute top-[330vh] left-[-8vw] w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full blur-[60px]", style: { background: "hsl(140 40% 72% / 0.25)" } },
  { cls: "absolute top-[410vh] right-[20vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-lemon/25 blur-[60px]" },
  { cls: "absolute top-[500vh] left-[30vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-sky/25 blur-[60px]" },
  { cls: "absolute top-[590vh] right-[5vw] w-[38vw] h-[38vw] max-w-[600px] max-h-[600px] min-w-[240px] min-h-[240px] rounded-full bg-pastel-mint/25 blur-[60px]" },
  { cls: "absolute top-[680vh] left-[-5vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full blur-[60px]", style: { background: "hsl(15 70% 75% / 0.25)" } },
  { cls: "absolute top-[770vh] right-[15vw] w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-peach/28 blur-[60px]" },
  { cls: "absolute top-[860vh] left-[10vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-coral/25 blur-[60px]" },
  { cls: "absolute top-[950vh] right-[10vw] w-[38vw] h-[38vw] max-w-[600px] max-h-[600px] min-w-[240px] min-h-[240px] rounded-full bg-pastel-lavender/28 blur-[60px]" },
  // Contact section orbs
  { cls: "absolute top-[1050vh] left-[-5vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-peach/30 blur-[60px]" },
  { cls: "absolute top-[1100vh] right-[5vw] w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full blur-[60px]", style: { background: "hsl(25 60% 75% / 0.25)" } },
  { cls: "absolute top-[1150vh] left-[15vw] w-[38vw] h-[38vw] max-w-[600px] max-h-[600px] min-w-[240px] min-h-[240px] rounded-full bg-pastel-lemon/28 blur-[60px]" },
  { cls: "absolute top-[1200vh] right-[-3vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-coral/25 blur-[60px]" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {ORBS.map((orb, index) => (
          <div key={index} className={orb.cls} style={orb.style} />
        ))}
      </div>

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
