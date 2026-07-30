/**
 * SlideCarousel — a horizontal "filmstrip" slideshow.
 *
 * Slides sit in a queue alongside each other; the active slide is centered
 * (full size / opacity) while its neighbours peek in on either side, dimmed and
 * slightly scaled down. Advancing glides the track sideways (compositor
 * transform) so the next slide smoothly slides to the middle and the previous
 * one glides off toward the edge. Prev/next buttons + clickable dots drive it,
 * and clicking a side slide brings it to centre.
 *
 * Centering is measured from the real DOM (works with any slide width / count
 * and re-centres on resize), so callers just provide the slides and a width
 * class. Purely presentational — data/lightbox stay with the parent section.
 */
import {
  Children,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SlideCarouselProps {
  /** Index of the currently-centered slide. */
  active: number;
  /** Called when the active slide should change (buttons, dots, side clicks). */
  onActiveChange: (index: number) => void;
  /** Called when the already-centered slide is clicked (e.g. open lightbox). */
  onActivate?: (index: number) => void;
  /** Tailwind width class applied to every slide (e.g. "w-[clamp(260px,64vw,620px)]"). */
  slideWidthClass: string;
  /** Accessible label for the carousel region. */
  label?: string;
  children: ReactNode;
}

const EASE = "cubic-bezier(.22,.61,.36,1)";

const SlideCarousel = ({
  active,
  onActiveChange,
  onActivate,
  slideWidthClass,
  label,
  children,
}: SlideCarouselProps) => {
  const items = Children.toArray(children);
  const count = items.length;

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [ready, setReady] = useState(false);

  // Measure the active slide and translate the track so it sits dead-center.
  useLayoutEffect(() => {
    const recalc = () => {
      const vp = viewportRef.current;
      const tr = trackRef.current;
      if (!vp || !tr) return;
      const el = tr.children[active] as HTMLElement | undefined;
      if (!el) return;
      setOffset(vp.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2));
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [active, count]);

  // Skip the transition on first paint so the initial centering doesn't slide in.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const go = (dir: number) => onActiveChange((active + dir + count) % count);

  return (
    <div
      className="relative"
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div ref={viewportRef} className="overflow-hidden px-2 sm:px-4 py-4">
        <div
          ref={trackRef}
          className="carousel-track flex items-center will-change-transform"
          style={{
            gap: "1.5rem",
            transform: `translateX(${offset}px)`,
            transition: ready ? `transform 0.55s ${EASE}` : "none",
          }}
        >
          {items.map((child, i) => {
            const isActive = i === active;
            return (
              <div
                key={i}
                className={`carousel-slide shrink-0 ${slideWidthClass} cursor-pointer`}
                style={{
                  opacity: isActive ? 1 : 0.4,
                  transform: isActive ? "scale(1)" : "scale(0.88)",
                  transition: ready
                    ? `opacity 0.55s ease, transform 0.55s ${EASE}`
                    : "none",
                }}
                onClick={() => (isActive ? onActivate?.(active) : onActiveChange(i))}
              >
                {child}
              </div>
            );
          })}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            className="carousel-btn left-1 sm:left-3 md:left-6"
            onClick={() => go(-1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            className="carousel-btn right-1 sm:right-3 md:right-6"
            onClick={() => go(1)}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="carousel-dots">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
                className={`carousel-dot ${i === active ? "is-active" : ""}`}
                onClick={() => onActiveChange(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SlideCarousel;
