import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

const sections = ["Home", "Landscapes", "Portraits", "Gallery", "Contact"];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (section: string) => {
    if (section === "Gallery") {
      navigate("/gallery");
      return;
    }

    if (location.pathname !== "/") {
      navigate("/");
      // Wait for navigation then scroll
      setTimeout(() => {
        const el = document.getElementById(section.toLowerCase());
        el?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return;
    }

    const el = document.getElementById(section.toLowerCase());
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center py-6"
    >
      <div className="flex gap-0.5 sm:gap-1 rounded-full bg-background/70 backdrop-blur-xl px-1.5 sm:px-2 py-1.5 shadow-lg border border-border max-w-[95vw]">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => handleClick(s)}
            className={`nav-pill ${s === "Gallery" && location.pathname === "/gallery" ? "active" : ""}`}
          >
            {s}
          </button>
        ))}
      </div>
    </motion.nav>
  );
};

export default Navbar;
