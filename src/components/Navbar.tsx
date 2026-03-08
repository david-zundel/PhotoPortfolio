import { motion } from "framer-motion";

const sections = ["Home", "Landscapes", "Portraits", "Contact"];

const Navbar = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id.toLowerCase());
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center py-6"
    >
      <div className="flex gap-1 rounded-full bg-background/70 backdrop-blur-xl px-2 py-1.5 shadow-lg border border-border">
        {sections.map((s) => (
          <button key={s} onClick={() => scrollTo(s)} className="nav-pill">
            {s}
          </button>
        ))}
      </div>
    </motion.nav>
  );
};

export default Navbar;
