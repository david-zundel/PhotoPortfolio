import ScrollReveal from "./ScrollReveal";
import LandscapeCountry from "./LandscapeCountry";
import landscapeSwitzerland from "@/assets/landscape-switzerland.jpg";
import landscapeJapan from "@/assets/landscape-japan.jpg";
import landscapeIceland from "@/assets/landscape-iceland.jpg";
import landscapeItaly from "@/assets/landscape-italy.jpg";
import landscapeArgentina from "@/assets/landscape-argentina.jpg";
import landscapeMorocco from "@/assets/landscape-morocco.jpg";

const countries = [
  {
    country: "Switzerland",
    description: "Alpine peaks kissed by golden light, where pristine lakes mirror the heavens. Each frame captures the raw grandeur of nature's cathedral.",
    image: landscapeSwitzerland,
    color: "hsl(350 65% 70% / 0.15)",
  },
  {
    country: "Japan",
    description: "Cherry blossoms paint the world in soft pinks, while ancient temples whisper stories of centuries past. A land where nature and culture dance as one.",
    image: landscapeJapan,
    color: "hsl(270 40% 78% / 0.15)",
  },
  {
    country: "Iceland",
    description: "Where fire meets ice — aurora borealis illuminating volcanic shores. A landscape so otherworldly it feels like stepping onto another planet.",
    image: landscapeIceland,
    color: "hsl(160 40% 75% / 0.15)",
  },
  {
    country: "Italy",
    description: "Sun-drenched coastlines adorned with pastel villages cascading toward turquoise waters. The Amalfi Coast in all its Mediterranean splendor.",
    image: landscapeItaly,
    color: "hsl(25 80% 82% / 0.15)",
  },
  {
    country: "Argentina",
    description: "The jagged spires of Patagonia rising through dramatic clouds, glacial lakes glowing turquoise against wild grasslands stretching to infinity.",
    image: landscapeArgentina,
    color: "hsl(200 60% 78% / 0.15)",
  },
  {
    country: "Morocco",
    description: "Golden sand dunes rippling endlessly under a blazing sunset, camel caravans casting elongated shadows across the Sahara's timeless expanse.",
    image: landscapeMorocco,
    color: "hsl(45 80% 80% / 0.15)",
  },
];

const LandscapesSection = () => {
  return (
    <section id="landscapes" className="relative">
      <div className="py-32 px-6 text-center">
        <ScrollReveal>
          <p className="text-sm font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4 font-body">
            Collection One
          </p>
          <h2 className="section-title text-foreground mb-6">Landscapes</h2>
          <div className="pastel-divider w-24 mx-auto" />
        </ScrollReveal>
      </div>

      {countries.map((c, i) => (
        <LandscapeCountry key={c.country} {...c} index={i} />
      ))}
    </section>
  );
};

export default LandscapesSection;
