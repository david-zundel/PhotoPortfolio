import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const ORB_DEFINITIONS = [
  { cls: "w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[250px] min-h-[250px] rounded-full bg-pastel-coral/35 blur-3xl", defaultX: -160, defaultY: "60vh" },
  { cls: "w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-peach/40 blur-3xl", defaultX: "calc(100vw - 8vw - 200px)", defaultY: "5vh" },
  { cls: "w-[25vw] h-[25vw] max-w-[400px] max-h-[400px] min-w-[180px] min-h-[180px] rounded-full blur-3xl", defaultX: "25vw", defaultY: "20vh", style: { background: 'hsl(340 55% 75% / 0.35)' } },
  { cls: "w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-lemon/38 blur-3xl", defaultX: "calc(100vw - 10vw - 200px)", defaultY: "50vh" },
  { cls: "w-[28vw] h-[28vw] max-w-[450px] max-h-[450px] min-w-[180px] min-h-[180px] rounded-full blur-3xl", defaultX: "-5vw", defaultY: "70vh", style: { background: 'hsl(15 70% 75% / 0.35)' } },
  { cls: "w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-mint/40 blur-3xl", defaultX: "15vw", defaultY: "100vh" },
  { cls: "w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-sky/38 blur-3xl", defaultX: "calc(100vw + 5vw)", defaultY: "150vh" },
  { cls: "w-[28vw] h-[28vw] max-w-[450px] max-h-[450px] min-w-[180px] min-h-[180px] rounded-full blur-3xl", defaultX: "-8vw", defaultY: "200vh", style: { background: 'hsl(140 40% 72% / 0.35)' } },
  { cls: "w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-lemon/35 blur-3xl", defaultX: "calc(100vw - 20vw - 200px)", defaultY: "250vh" },
  { cls: "w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-sky/35 blur-3xl", defaultX: "30vw", defaultY: "310vh" },
  { cls: "w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-mint/35 blur-3xl", defaultX: "calc(100vw - 5vw - 220px)", defaultY: "370vh" },
  { cls: "w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full blur-3xl", defaultX: "-5vw", defaultY: "430vh", style: { background: 'hsl(15 70% 75% / 0.35)' } },
  { cls: "w-[28vw] h-[28vw] max-w-[450px] max-h-[450px] min-w-[180px] min-h-[180px] rounded-full bg-pastel-peach/38 blur-3xl", defaultX: "calc(100vw - 15vw - 180px)", defaultY: "490vh" },
  { cls: "w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-coral/35 blur-3xl", defaultX: "10vw", defaultY: "560vh" },
  { cls: "w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-lavender/38 blur-3xl", defaultX: "calc(100vw - 10vw - 220px)", defaultY: "630vh" },
  { cls: "w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-lavender/40 blur-3xl", defaultX: "5vw", defaultY: "700vh" },
  { cls: "w-[28vw] h-[28vw] max-w-[450px] max-h-[450px] min-w-[180px] min-h-[180px] rounded-full blur-3xl", defaultX: "calc(100vw + 3vw)", defaultY: "770vh", style: { background: 'hsl(330 50% 72% / 0.35)' } },
  { cls: "w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full blur-3xl", defaultX: "20vw", defaultY: "840vh", style: { background: 'hsl(350 55% 75% / 0.38)' } },
  { cls: "w-[32vw] h-[32vw] max-w-[500px] max-h-[500px] min-w-[200px] min-h-[200px] rounded-full bg-pastel-peach/40 blur-3xl", defaultX: "calc(100vw - 15vw - 200px)", defaultY: "900vh" },
  { cls: "w-[35vw] h-[35vw] max-w-[550px] max-h-[550px] min-w-[220px] min-h-[220px] rounded-full bg-pastel-coral/35 blur-3xl", defaultX: "10vw", defaultY: "950vh" },
  { cls: "w-[28vw] h-[28vw] max-w-[450px] max-h-[450px] min-w-[180px] min-h-[180px] rounded-full bg-pastel-lemon/38 blur-3xl", defaultX: "calc(100vw - 25vw - 180px)", defaultY: "990vh" },
];

const STORAGE_KEY = "orb-offsets";

const DraggableOrbs = () => {
  const [offsets, setOffsets] = useState<Record<number, { x: number; y: number }>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleDragEnd = useCallback((index: number, _: unknown, info: { offset: { x: number; y: number } }) => {
    setOffsets(prev => {
      const existing = prev[index] || { x: 0, y: 0 };
      const updated = {
        ...prev,
        [index]: { x: existing.x + info.offset.x, y: existing.y + info.offset.y }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <>
      {ORB_DEFINITIONS.map((orb, i) => (
        <motion.div
          key={i}
          drag
          dragMomentum={false}
          whileDrag={{ scale: 1.08 }}
          onDragEnd={(e, info) => handleDragEnd(i, e, info)}
          initial={false}
          animate={{
            x: offsets[i]?.x || 0,
            y: offsets[i]?.y || 0,
          }}
          transition={{ type: "tween", duration: 0 }}
          className={`${orb.cls} absolute pointer-events-auto cursor-grab active:cursor-grabbing`}
          style={{
            ...orb.style,
            left: typeof orb.defaultX === 'number' ? orb.defaultX : orb.defaultX,
            top: orb.defaultY,
          }}
        />
      ))}
    </>
  );
};

export default DraggableOrbs;
