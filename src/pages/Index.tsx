import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LandscapesSection from "@/components/LandscapesSection";
import PortraitsSection from "@/components/PortraitsSection";
import ContactSection from "@/components/ContactSection";

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

        {/* Landscapes area — earthy greens, teals, sky */}
        <div className="absolute top-[90vh] left-[15vw] w-[550px] h-[550px] rounded-full bg-pastel-mint/40 blur-3xl" />
        <div className="absolute top-[110vh] right-[-5vw] w-[500px] h-[500px] rounded-full bg-pastel-sky/38 blur-3xl" />
        <div className="absolute top-[130vh] left-[-8vw] w-[450px] h-[450px] rounded-full blur-3xl" style={{ background: 'hsl(140 40% 72% / 0.35)' }} />
        <div className="absolute top-[150vh] right-[20vw] w-[500px] h-[500px] rounded-full bg-pastel-lemon/30 blur-3xl" />
        <div className="absolute top-[170vh] left-[30vw] w-[400px] h-[400px] rounded-full bg-pastel-sky/35 blur-3xl" />
        <div className="absolute top-[190vh] right-[5vw] w-[550px] h-[550px] rounded-full bg-pastel-mint/35 blur-3xl" />

        {/* Transition — cool to warm lavender, rose */}
        <div className="absolute top-[210vh] left-[5vw] w-[500px] h-[500px] rounded-full bg-pastel-lavender/40 blur-3xl" />
        <div className="absolute top-[230vh] right-[15vw] w-[450px] h-[450px] rounded-full" style={{ background: 'hsl(330 50% 72% / 0.35)' }} />

        {/* Portraits area — warm pinks, lavender, rose gold */}
        <div className="absolute top-[250vh] left-[20vw] w-[550px] h-[550px] rounded-full" style={{ background: 'hsl(350 55% 75% / 0.38)' }} />
        <div className="absolute top-[270vh] right-[-3vw] w-[500px] h-[500px] rounded-full bg-pastel-lavender/35 blur-3xl" />
        <div className="absolute top-[290vh] left-[-5vw] w-[450px] h-[450px] rounded-full bg-pastel-peach/40 blur-3xl" />
        <div className="absolute top-[310vh] right-[25vw] w-[400px] h-[400px] rounded-full" style={{ background: 'hsl(10 65% 78% / 0.35)' }} />

        {/* Contact area — sunset blend, gold, coral, sky */}
        <div className="absolute top-[330vh] left-[10vw] w-[550px] h-[550px] rounded-full bg-pastel-lemon/38 blur-3xl" />
        <div className="absolute top-[350vh] right-[10vw] w-[500px] h-[500px] rounded-full bg-pastel-coral/35 blur-3xl" />
        <div className="absolute top-[370vh] left-[25vw] w-[450px] h-[450px] rounded-full bg-pastel-sky/30 blur-3xl" />
      </div>
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <LandscapesSection />
        <PortraitsSection />
        <ContactSection />
      </div>
    </div>
  );
};

export default Index;
