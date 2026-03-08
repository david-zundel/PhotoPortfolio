import { useState } from "react";
import ScrollReveal from "./ScrollReveal";
import ProgressiveImage from "./ProgressiveImage";
import { LightboxImage } from "./Lightbox";
import { getPreviewUrl } from "@/lib/image-utils";

interface LandscapeCountryProps {
  country: string;
  description: string;
  image: string;
  index: number;
  color: string;
  textGradient: string;
  onImageClick: (images: LightboxImage[], index: number) => void;
}

const LandscapeCountry = ({ country, description, image, index, color, textGradient, onImageClick }: LandscapeCountryProps) => {
  const [loaded, setLoaded] = useState(false);
  const isEven = index % 2 === 0;

  return (
    <div className="min-h-0 lg:min-h-screen flex items-center py-10 md:py-20 px-6 md:px-12 lg:px-24">
      <div className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} gap-6 md:gap-12 lg:gap-20 items-center w-full max-w-7xl mx-auto`}>
        <ScrollReveal className="flex-1" direction={isEven ? "left" : "right"} delay={0.1}>
          <div
            className="relative group cursor-pointer rounded-2xl overflow-hidden bg-muted"
            onClick={() => onImageClick([{ src: image, alt: `Landscape of ${country}`, location: country }], 0)}
          >
            <div
              className="absolute -inset-4 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl"
              style={{ background: color }}
            />
            <ProgressiveImage
              src={getPreviewUrl(image, 1200, 75)}
              alt={`Landscape of ${country}`}
              className="relative w-full aspect-[4/3] object-cover rounded-2xl shadow-2xl group-hover:scale-[1.02] transition-transform duration-700"
              fetchPriority="high"
              onFullLoad={() => setLoaded(true)}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal className="flex-1 max-w-lg" direction={isEven ? "right" : "left"} delay={0.3}>
          <h3
            className="text-4xl md:text-5xl font-bold font-display mt-4 mb-6 bg-clip-text text-transparent inline-block"
            style={{
              backgroundImage: textGradient,
              paddingBottom: '0.15em',
            }}
          >
            {country}
          </h3>
          <p className="text-lg text-muted-foreground font-body font-light leading-relaxed">
            {description}
          </p>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default LandscapeCountry;
