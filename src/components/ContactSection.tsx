import ScrollReveal from "./ScrollReveal";

const ContactSection = () => {
  return (
    <section id="contact" className="relative py-20 md:py-40 px-6 text-center cv-auto">

      <ScrollReveal className="relative z-10">
        <h2 className="section-title section-title-winter mb-10">
          Contact Me
        </h2>
        <a
          href="mailto:davidzundel007@gmail.com"
          className="nav-pill active inline-block text-base"
        >
          davidzundel007@gmail.com
        </a>
      </ScrollReveal>

      <div className="mt-16 md:mt-32 text-sm text-muted-foreground font-body">
        © 2026 David Zundel Photography. All rights reserved.
      </div>
    </section>
  );
};

export default ContactSection;
