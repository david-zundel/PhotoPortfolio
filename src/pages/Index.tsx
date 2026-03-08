import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion, type PanInfo } from "framer-motion";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LandscapesSection from "@/components/LandscapesSection";
import PortraitsSection from "@/components/PortraitsSection";
import ContactSection from "@/components/ContactSection";
import ScrollReveal from "@/components/ScrollReveal";

type OrbConfig = {
  cls: string;
  style?: React.CSSProperties;
};

const ORBS: OrbConfig[] = [
  { cls: "absolute top-[60vh] -left-40 w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[250px] min-h-[250px] rounded-full bg-pastel-coral/35 blur-3xl" },
  { cls: "absolute top-[5vh] right-[-8vw] w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-peach/40 blur-3xl" },
  { cls: "absolute top-[20vh] left-[25vw] w-[25vw] h-[25vw] max-w-[400px] max-h-[400px] min-w-[180px] min-h-[180px] rounded-full blur-3xl", style: { background: "hsl(340 55% 75% / 0.35)" } },
  { cls: "absolute top-[50vh] right-[10vw] w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-lemon/38 blur-3xl" },
  { cls: "absolute top-[70vh] left-[-5vw] w-[28vw] h-[28vw] max-w-[450px] max-h-[450px] min-w-[180px] min-h-[180px] rounded-full blur-3xl", style: { background: "hsl(15 70% 75% / 0.35)" } },
  { cls: "absolute top-[100vh] left-[15vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-mint/40 blur-3xl" },
  { cls: "absolute top-[150vh] right-[-5vw] w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-sky/38 blur-3xl" },
  { cls: "absolute top-[200vh] left-[-8vw] w-[28vw] h-[28vw] max-w-[450px] max-h-[450px] min-w-[180px] min-h-[180px] rounded-full blur-3xl", style: { background: "hsl(140 40% 72% / 0.35)" } },
  { cls: "absolute top-[250vh] right-[20vw] w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-lemon/35 blur-3xl" },
  { cls: "absolute top-[310vh] left-[30vw] w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-sky/35 blur-3xl" },
  { cls: "absolute top-[370vh] right-[5vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-mint/35 blur-3xl" },
  { cls: "absolute top-[430vh] left-[-5vw] w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full blur-3xl", style: { background: "hsl(15 70% 75% / 0.35)" } },
  { cls: "absolute top-[490vh] right-[15vw] w-[28vw] h-[28vw] max-w-[450px] max-h-[450px] min-w-[180px] min-h-[180px] rounded-full bg-pastel-peach/38 blur-3xl" },
  { cls: "absolute top-[560vh] left-[10vw] w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-coral/35 blur-3xl" },
  { cls: "absolute top-[630vh] right-[10vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-lavender/38 blur-3xl" },
  { cls: "absolute top-[700vh] left-[5vw] w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-lavender/40 blur-3xl" },
  { cls: "absolute top-[770vh] right-[-3vw] w-[28vw] h-[28vw] max-w-[450px] max-h-[450px] min-w-[180px] min-h-[180px] rounded-full blur-3xl", style: { background: "hsl(330 50% 72% / 0.35)" } },
  { cls: "absolute top-[840vh] left-[20vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full blur-3xl", style: { background: "hsl(350 55% 75% / 0.38)" } },
  { cls: "absolute top-[900vh] right-[15vw] w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-peach/40 blur-3xl" },
  { cls: "absolute top-[950vh] left-[10vw] w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-coral/35 blur-3xl" },
  { cls: "absolute top-[990vh] right-[25vw] w-[28vw] h-[28vw] max-w-[450px] max-h-[450px] min-w-[180px] min-h-[180px] rounded-full bg-pastel-lemon/38 blur-3xl" },
];

const STORAGE_KEY = "home-orb-offsets";

const Index = () => {
  const [isEditingOrbs, setIsEditingOrbs] = useState(false);
  const [offsets, setOffsets] = useState<Record<number, { x: number; y: number }>>({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setOffsets(JSON.parse(saved));
      } catch {
        setOffsets({});
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offsets));
  }, [offsets]);

  const handleDragEnd = (index: number, info: PanInfo) => {
    setOffsets((prev) => {
      const current = prev[index] ?? { x: 0, y: 0 };
      return {
        ...prev,
        [index]: {
          x: current.x + info.offset.x,
          y: current.y + info.offset.y,
        },
      };
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <button
        type="button"
        onClick={() => setIsEditingOrbs((prev) => !prev)}
        className={`fixed top-20 right-6 z-30 nav-pill ${isEditingOrbs ? "active" : ""}`}
      >
        {isEditingOrbs ? "Done moving orbs" : "Move orbs"}
      </button>

      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${isEditingOrbs ? "z-20" : "z-0"}`}>
        {ORBS.map((orb, index) => (
          <motion.div
            key={index}
            drag={isEditingOrbs}
            dragMomentum={false}
            whileDrag={{ scale: 1.05 }}
            onDragEnd={(_, info) => handleDragEnd(index, info)}
            className={`${orb.cls} ${isEditingOrbs ? "pointer-events-auto cursor-grab active:cursor-grabbing" : "pointer-events-none"}`}
            style={orb.style}
            animate={{ x: offsets[index]?.x ?? 0, y: offsets[index]?.y ?? 0 }}
            transition={{ duration: 0 }}
          />
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

