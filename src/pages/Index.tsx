import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LandscapesSection from "@/components/LandscapesSection";
import PortraitsSection from "@/components/PortraitsSection";
import ContactSection from "@/components/ContactSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Global flowing pastel orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-pastel-coral/15 blur-3xl" />
        <div className="absolute top-[15vh] right-[-5vw] w-[450px] h-[450px] rounded-full bg-pastel-lavender/20 blur-3xl" />
        <div className="absolute top-[35vh] left-[10vw] w-[400px] h-[400px] rounded-full bg-pastel-mint/18 blur-3xl" />
        <div className="absolute top-[55vh] right-[15vw] w-[500px] h-[500px] rounded-full bg-pastel-sky/15 blur-3xl" />
        <div className="absolute top-[75vh] left-[-5vw] w-[450px] h-[450px] rounded-full bg-pastel-peach/18 blur-3xl" />
        <div className="absolute top-[95vh] right-[5vw] w-[400px] h-[400px] rounded-full bg-pastel-lemon/15 blur-3xl" />
        <div className="absolute top-[120vh] left-[20vw] w-[500px] h-[500px] rounded-full bg-pastel-lavender/15 blur-3xl" />
        <div className="absolute top-[150vh] right-[-3vw] w-[450px] h-[450px] rounded-full bg-pastel-mint/20 blur-3xl" />
        <div className="absolute top-[180vh] left-[5vw] w-[400px] h-[400px] rounded-full bg-pastel-coral/12 blur-3xl" />
        <div className="absolute top-[210vh] right-[20vw] w-[500px] h-[500px] rounded-full bg-pastel-sky/18 blur-3xl" />
        <div className="absolute top-[240vh] left-[15vw] w-[450px] h-[450px] rounded-full bg-pastel-peach/15 blur-3xl" />
        <div className="absolute top-[270vh] right-[10vw] w-[400px] h-[400px] rounded-full bg-pastel-lemon/18 blur-3xl" />
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
