import ScrollReveal from "./ScrollReveal";

const portraits = [
  { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop", title: "Golden Hour", subtitle: "Natural light editorial" },
  { src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200&h=800&fit=crop", title: "Shadow Play", subtitle: "Studio dramatic" },
  { src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&h=800&fit=crop", title: "Timeless", subtitle: "Documentary portrait" },
  { src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&h=800&fit=crop", title: "Pure Joy", subtitle: "Candid moments" },
];

const PortraitsSection = () => {
  return (
    <section id="portraits" className="relative py-32 px-6">
      <div className="text-center mb-24">
        <ScrollReveal>
          <p className="text-sm font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4 font-body">
            Collection Two
          </p>
          <h2 className="section-title text-foreground mb-6">Portraits</h2>
          <div className="pastel-divider w-24 mx-auto" />
        </ScrollReveal>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {portraits.map((p, i) => (
          <ScrollReveal key={p.title} delay={i * 0.15} className="group">
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src={p.src}
                alt={p.title}
                className="w-full aspect-[3/2] object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <p className="text-sm tracking-[0.2em] uppercase text-primary-foreground/70 font-body mb-1">
                  {p.subtitle}
                </p>
                <h3 className="text-3xl font-bold font-display text-primary-foreground">
                  {p.title}
                </h3>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
};

export default PortraitsSection;
