import ScrollReveal from "./ScrollReveal";

const ContactSection = () => {
  return (
    <section id="contact" className="relative py-40 px-6 text-center">

      <ScrollReveal className="relative z-10">
        <p className="text-sm font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4 font-body">
          Get in Touch
        </p>
        <h2 className="section-title section-title-contact mb-8">
          Let's Create
          <br />
          Together
        </h2>
        <p className="text-lg text-muted-foreground font-body font-light max-w-md mx-auto mb-10">
          Available for commissions, collaborations, and print inquiries worldwide.
        </p>
        <a
          href="mailto:hello@davidzundel.com"
          className="nav-pill active inline-block text-base"
        >
          hello@davidzundel.com
        </a>
      </ScrollReveal>

      <div className="mt-32 text-sm text-muted-foreground font-body">
        © 2026 David Zundel Photography. All rights reserved.
      </div>
    </section>
  );
};

export default ContactSection;
