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
  { cls: "absolute top-[60vh] -left-40 w-[55vw] h-[55vw] max-w-[850px] max-h-[850px] min-w-[350px] min-h-[350px] rounded-full bg-pastel-coral/25 blur-[80px]" },
  { cls: "absolute top-[5vh] right-[-8vw] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] min-w-[300px] min-h-[300px] rounded-full bg-pastel-peach/30 blur-[80px]" },
  { cls: "absolute top-[20vh] left-[25vw] w-[45vw] h-[45vw] max-w-[700px] max-h-[700px] min-w-[280px] min-h-[280px] rounded-full blur-[80px]", style: { background: "hsl(340 55% 75% / 0.25)" } },
  { cls: "absolute top-[50vh] right-[10vw] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] min-w-[300px] min-h-[300px] rounded-full bg-pastel-lemon/28 blur-[80px]" },
  { cls: "absolute top-[70vh] left-[-5vw] w-[48vw] h-[48vw] max-w-[750px] max-h-[750px] min-w-[280px] min-h-[280px] rounded-full blur-[80px]", style: { background: "hsl(15 70% 75% / 0.25)" } },
  { cls: "absolute top-[100vh] left-[15vw] w-[55vw] h-[55vw] max-w-[850px] max-h-[850px] min-w-[320px] min-h-[320px] rounded-full bg-pastel-mint/30 blur-[80px]" },
  { cls: "absolute top-[150vh] right-[-5vw] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] min-w-[300px] min-h-[300px] rounded-full bg-pastel-sky/28 blur-[80px]" },
  { cls: "absolute top-[200vh] left-[-8vw] w-[48vw] h-[48vw] max-w-[750px] max-h-[750px] min-w-[280px] min-h-[280px] rounded-full blur-[80px]", style: { background: "hsl(140 40% 72% / 0.25)" } },
  { cls: "absolute top-[250vh] right-[20vw] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] min-w-[300px] min-h-[300px] rounded-full bg-pastel-lemon/25 blur-[80px]" },
  { cls: "absolute top-[310vh] left-[30vw] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] min-w-[300px] min-h-[300px] rounded-full bg-pastel-sky/25 blur-[80px]" },
  { cls: "absolute top-[370vh] right-[5vw] w-[55vw] h-[55vw] max-w-[850px] max-h-[850px] min-w-[320px] min-h-[320px] rounded-full bg-pastel-mint/25 blur-[80px]" },
  { cls: "absolute top-[430vh] left-[-5vw] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] min-w-[300px] min-h-[300px] rounded-full blur-[80px]", style: { background: "hsl(15 70% 75% / 0.25)" } },
  { cls: "absolute top-[490vh] right-[15vw] w-[48vw] h-[48vw] max-w-[750px] max-h-[750px] min-w-[280px] min-h-[280px] rounded-full bg-pastel-peach/28 blur-[80px]" },
  { cls: "absolute top-[560vh] left-[10vw] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] min-w-[300px] min-h-[300px] rounded-full bg-pastel-coral/25 blur-[80px]" },
  { cls: "absolute top-[630vh] right-[10vw] w-[55vw] h-[55vw] max-w-[850px] max-h-[850px] min-w-[320px] min-h-[320px] rounded-full bg-pastel-lavender/28 blur-[80px]" },
  { cls: "absolute top-[700vh] left-[5vw] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] min-w-[300px] min-h-[300px] rounded-full bg-pastel-lavender/30 blur-[80px]" },
  { cls: "absolute top-[770vh] right-[-3vw] w-[48vw] h-[48vw] max-w-[750px] max-h-[750px] min-w-[280px] min-h-[280px] rounded-full blur-[80px]", style: { background: "hsl(330 50% 72% / 0.25)" } },
  { cls: "absolute top-[840vh] left-[20vw] w-[55vw] h-[55vw] max-w-[850px] max-h-[850px] min-w-[320px] min-h-[320px] rounded-full blur-[80px]", style: { background: "hsl(350 55% 75% / 0.28)" } },
  { cls: "absolute top-[900vh] right-[15vw] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] min-w-[300px] min-h-[300px] rounded-full bg-pastel-peach/30 blur-[80px]" },
  { cls: "absolute top-[950vh] left-[10vw] w-[55vw] h-[55vw] max-w-[850px] max-h-[850px] min-w-[320px] min-h-[320px] rounded-full bg-pastel-coral/25 blur-[80px]" },
  { cls: "absolute top-[990vh] right-[25vw] w-[48vw] h-[48vw] max-w-[750px] max-h-[750px] min-w-[280px] min-h-[280px] rounded-full bg-pastel-lemon/28 blur-[80px]" },
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

        <div className="py-24 px-6 text-center">
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
