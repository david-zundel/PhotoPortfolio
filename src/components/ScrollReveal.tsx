import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

const directionMap = {
  up: { y: 30, x: 0 },
  down: { y: -30, x: 0 },
  left: { x: 30, y: 0 },
  right: { x: -30, y: 0 },
};

const ScrollReveal = ({ children, className = "", delay = 0, direction = "up" }: ScrollRevealProps) => {
  // Keep the ref on a plain DOM node to avoid ref warnings with motion components.
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const offset = directionMap[direction];

  return (
    <div ref={ref} className={className}>
      <motion.div
        className="h-full w-full"
        style={{ willChange: "opacity, transform" }}
        initial={{ opacity: 0, ...offset }}
        animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{
          duration: 0.6,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default ScrollReveal;
