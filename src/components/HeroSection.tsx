import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";

const HeroSection = () => {
  const [showScroll, setShowScroll] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setShowScroll(y < 50);
  });

  return (
    /* Name block sits top-left, clear of the fixed nav pill (which ends ~70px
       down). The scroll cue below stays centred: it is a page affordance, not
       part of the title. */
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-start justify-start overflow-hidden px-6 sm:px-10 lg:px-16 pt-28 md:pt-32"
    >

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-left relative z-10"
      >
        <h1 className="winter-name">
          David
          <br />
          Zundel
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showScroll ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none"
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
