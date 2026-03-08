import ScrollReveal from "./ScrollReveal";
import LandscapeCountry from "./LandscapeCountry";

const countries = [
  {
    country: "Switzerland",
    description: "Alpine peaks kissed by golden light, where pristine lakes mirror the heavens. Each frame captures the raw grandeur of nature's cathedral.",
    image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1200&h=800&fit=crop",
    color: "hsl(200 60% 78% / 0.15)",
    textGradient: "linear-gradient(135deg, hsl(200 42% 42%), hsl(220 38% 46%))",
  },
  {
    country: "Japan",
    description: "Cherry blossoms paint the world in soft pinks, while ancient temples whisper stories of centuries past. A land where nature and culture dance as one.",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&h=800&fit=crop",
    color: "hsl(270 40% 78% / 0.15)",
    textGradient: "linear-gradient(135deg, hsl(270 32% 44%), hsl(290 28% 47%))",
  },
  {
    country: "Iceland",
    description: "Where fire meets ice — aurora borealis illuminating volcanic shores. A landscape so otherworldly it feels like stepping onto another planet.",
    image: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1200&h=800&fit=crop",
    color: "hsl(160 40% 75% / 0.15)",
    textGradient: "linear-gradient(135deg, hsl(160 36% 38%), hsl(180 32% 40%))",
  },
  {
    country: "Italy",
    description: "Sun-drenched coastlines adorned with pastel villages cascading toward turquoise waters. The Amalfi Coast in all its Mediterranean splendor.",
    image: "https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=1200&h=800&fit=crop",
    color: "hsl(25 80% 82% / 0.15)",
    textGradient: "linear-gradient(135deg, hsl(25 60% 50%), hsl(15 55% 52%))",
  },
  {
    country: "Argentina",
    description: "The jagged spires of Patagonia rising through dramatic clouds, glacial lakes glowing turquoise against wild grasslands stretching to infinity.",
    image: "https://images.unsplash.com/photo-1464817739973-0128fe77aed1?w=1200&h=800&fit=crop",
    color: "hsl(200 60% 78% / 0.15)",
    textGradient: "linear-gradient(135deg, hsl(195 52% 48%), hsl(210 50% 52%))",
  },
  {
    country: "Morocco",
    description: "Golden sand dunes rippling endlessly under a blazing sunset, camel caravans casting elongated shadows across the Sahara's timeless expanse.",
    image: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200&h=800&fit=crop",
    color: "hsl(45 80% 80% / 0.15)",
    textGradient: "linear-gradient(135deg, hsl(35 58% 48%), hsl(45 55% 50%))",
  },
];

const LandscapesSection = () => {
  return (
    <section id="landscapes" className="relative">
      <div className="py-32 px-6 text-center relative z-10">
        <ScrollReveal>
          <p className="text-sm font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4 font-body">
            Collection One
          </p>
          <h2 className="section-title section-title-landscapes mb-6">Landscapes</h2>
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
