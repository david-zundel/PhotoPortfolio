import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";

const HeroSection = () => {
  const [showScroll, setShowScroll] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setShowScroll(y < 50);
  });

  return (
    <section id="home" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center relative z-10"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-sm font-medium tracking-[0.3em] uppercase text-muted-foreground mb-6 font-body"
        >
          Visual Storyteller
        </motion.p>
        <h1 className="winter-name mb-6">
          David
          <br />
          Zundel
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto font-body font-light"
        >
          Capturing the world's beauty through landscapes and human stories
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showScroll ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="absolute bottom-12 pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/20 flex justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
