import { useEffect, useState } from "react";

import cabin1600 from "@/assets/winter-cabin-1600.webp";
import cabin3200 from "@/assets/winter-cabin-3200.webp";

/**
 * WinterCabinScene — the "Winter Cabin Valley" backdrop.
 *
 * The source design (design_handoff_winter_cabin_valley) paints the whole
 * valley at runtime from ~60,000 rotated-ellipse brush marks sampled off a
 * 240x120 colour grid. Its own README recommends the static-export path for
 * production, and that is what this is: the painter was run once offline at
 * 3200x1600 and baked to WebP (280 KB), so the page pays zero paint cost and
 * there is no porting risk. What stays live is only what has to move — the
 * chimney smoke, the window-lamp flicker and the falling snow — all CSS/SVG.
 *
 * Mounted exactly like AutumnPondScene: one fixed layer at zIndex -1. NOT 0 —
 * the page wrapper on Index/Gallery has `isolate`, so its inner z-10 content
 * cannot rise above a z-0 fixed sibling that paints later in the DOM and the
 * scene would cover the whole site. Do not "tidy" it to 0.
 */

const STYLE_ID = "wc-scene-css";

/* The painting is 2:1. Cover-fitting it to a tall viewport blows it up a long
   way sideways — a 390x844 phone shows barely a quarter of the width — so the
   crop has to be aimed at something. --wc-fx is the point of the stage that
   gets pinned to the same point of the viewport, so setting it to a feature's
   x-fraction puts that feature on screen.
   45% is the sunrise bloom: measured off the baked image, the sky's bright core
   sits at 43% and the river's reflection peak at 43%, and the whole bloom spans
   roughly 35-58%, which is almost exactly the slice a phone gets at this value.
   The cabin (78%) is too far right to share the frame — at phone width the
   visible slice is only ~23% of the painting, so it's the sun or the cabin, not
   both, and the sun is the subject. */
const CSS = `
[data-wc-root] { --wc-fx: 50%; --wc-stage-w: max(100vw, 100vh * 2); }
@media (max-aspect-ratio: 1/1) { [data-wc-root] { --wc-fx: 45%; } }

@keyframes wcFlakeDrop {
  0%   { transform: translate(0px, -5%);   opacity: 0; }
  12%  { opacity: 0.92; }
  88%  { opacity: 0.9; }
  100% { transform: translate(38px, 105%); opacity: 0; }
}
@keyframes wcFlakeDropB {
  0%   { transform: translate(0px, -5%);    opacity: 0; }
  14%  { opacity: 0.86; }
  86%  { opacity: 0.84; }
  100% { transform: translate(-22px, 105%); opacity: 0; }
}
@keyframes wcChimneyA {
  0%   { transform: translate(0px, 0px)     scale(0.36); opacity: 0; }
  14%  { opacity: 0.5; }
  56%  { transform: translate(20px, -88px)  scale(1.25); opacity: 0.26; }
  100% { transform: translate(58px, -182px) scale(2.3);  opacity: 0; }
}
@keyframes wcChimneyB {
  0%   { transform: translate(0px, 0px)     scale(0.42); opacity: 0; }
  16%  { opacity: 0.44; }
  56%  { transform: translate(4px, -96px)   scale(1.4);  opacity: 0.22; }
  100% { transform: translate(34px, -196px) scale(2.5);  opacity: 0; }
}
@keyframes wcEmber { 0%, 100% { opacity: 0.85; } 45% { opacity: 0.6; } }

/* Off-screen tabs shouldn't keep 40-odd compositor animations ticking. */
[data-wc-root][data-wc-paused="1"] * { animation-play-state: paused !important; }

@media (prefers-reduced-motion: reduce) {
  [data-wc-root] * { animation: none !important; }
  [data-wc-snow] { display: none; }
}
`;

function useInjectedCss() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

function useHidden() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return hidden;
}

/** cores/memory/viewport sniff, matching Weather.tsx's guard. */
function useLowPower() {
  const [low] = useState(() => {
    if (typeof navigator === "undefined") return false;
    const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? 8;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const small =
      typeof window !== "undefined" &&
      (window.innerWidth < 820 || window.matchMedia?.("(pointer: coarse)").matches);
    return cores <= 4 || mem <= 4 || !!small;
  });
  return low;
}

/* ------------------------------------------------------------------ *
 * Falling snow — the 19 clusters from the design file, verbatim.
 * Each is a 3-dab cluster rather than one circle, which is what makes
 * a flake read as crystalline rather than as a dot.
 * [left%, useVariantB, seconds, delay, boxPx, opacity, [dabs]]
 * ------------------------------------------------------------------ */
type Dab = [number, number, number, string];
type Flake = { l: number; b: boolean; d: number; dl: number; s: number; o: number; p: Dab[] };

const FLAKES: Flake[] = [
  { l: 4,  b: false, d: 9.6,  dl: 0,     s: 6.3, o: 0.92, p: [[3.2, 1.8, 2.1, "#fffaf0"], [0.8, 2.8, 1.8, "#ffe6ad"], [3.4, 1.5, 1.4, "#ffc172"]] },
  { l: 11, b: true,  d: 13.8, dl: -3.4,  s: 3.6, o: 0.82, p: [[0.5, 1.5, 1.4, "#fffaf0"], [1.2, 0.8, 1.1, "#ffe6ad"], [1.6, 2.3, 0.7, "#ffc172"]] },
  { l: 18, b: false, d: 7.8,  dl: -5.6,  s: 8.1, o: 0.88, p: [[0.6, 3.3, 2.7, "#fffaf0"], [4.5, 2.2, 2.6, "#ffe6ad"], [3.1, 4.4, 2.1, "#ffc172"]] },
  { l: 26, b: true,  d: 12.2, dl: -1.6,  s: 4.5, o: 0.88, p: [[0.7, 2.4, 1.5, "#fffaf0"], [2.0, 0.9, 1.1, "#ffe6ad"], [2.9, 1.8, 1.2, "#ffc172"]] },
  { l: 33, b: false, d: 10.6, dl: -7.5,  s: 5.4, o: 0.90, p: [[2.1, 0.8, 2.0, "#fffaf0"], [2.9, 2.9, 1.6, "#ffe6ad"], [1.2, 1.2, 1.2, "#ffc172"]] },
  { l: 40, b: true,  d: 15.4, dl: -2.8,  s: 3.1, o: 0.78, p: [[1.3, 0.4, 1.0, "#fffaf0"], [1.0, 1.8, 0.8, "#ffe6ad"], [0.7, 0.6, 0.7, "#ffc172"]] },
  { l: 47, b: false, d: 8.6,  dl: -4.6,  s: 7.2, o: 0.88, p: [[3.0, 3.5, 2.4, "#fffaf0"], [1.4, 1.7, 2.2, "#ffe6ad"], [4.9, 3.4, 1.5, "#ffc172"]] },
  { l: 54, b: true,  d: 12.8, dl: -9.3,  s: 4.5, o: 0.86, p: [[2.1, 0.8, 1.6, "#fffaf0"], [1.7, 2.7, 1.3, "#ffe6ad"], [0.9, 1.0, 1.2, "#ffc172"]] },
  { l: 61, b: false, d: 9.9,  dl: -6.9,  s: 5.9, o: 0.92, p: [[1.6, 0.7, 1.9, "#fffaf0"], [2.6, 3.2, 1.9, "#ffe6ad"], [1.2, 1.6, 1.6, "#ffc172"]] },
  { l: 68, b: true,  d: 14.3, dl: -1.0,  s: 3.4, o: 0.78, p: [[1.8, 1.7, 1.3, "#fffaf0"], [0.5, 1.2, 1.1, "#ffe6ad"], [1.5, 0.7, 0.7, "#ffc172"]] },
  { l: 75, b: false, d: 7.4,  dl: -4.1,  s: 8.6, o: 0.86, p: [[3.0, 4.4, 2.8, "#fffaf0"], [2.2, 1.4, 2.0, "#ffe6ad"], [4.5, 3.9, 1.9, "#ffc172"]] },
  { l: 82, b: true,  d: 11.4, dl: -8.4,  s: 4.9, o: 0.88, p: [[1.9, 1.0, 1.8, "#fffaf0"], [1.5, 2.4, 1.5, "#ffe6ad"], [1.2, 1.2, 1.2, "#ffc172"]] },
  { l: 89, b: false, d: 10.3, dl: -5.7,  s: 5.4, o: 0.90, p: [[2.4, 1.0, 1.8, "#fffaf0"], [2.4, 3.3, 1.5, "#ffe6ad"], [1.1, 2.2, 1.1, "#ffc172"]] },
  { l: 95, b: true,  d: 14.0, dl: -2.4,  s: 3.8, o: 0.82, p: [[0.6, 0.8, 1.2, "#fffaf0"], [2.1, 1.5, 1.1, "#ffe6ad"], [0.5, 1.0, 1.0, "#ffc172"]] },
  { l: 8,  b: false, d: 11.0, dl: -9.0,  s: 5.2, o: 0.88, p: [[2.4, 0.6, 1.7, "#fffaf0"], [2.3, 3.0, 1.3, "#ffe6ad"], [1.5, 1.2, 1.2, "#ffc172"]] },
  { l: 30, b: true,  d: 9.6,  dl: -2.1,  s: 6.3, o: 0.84, p: [[3.4, 1.8, 2.2, "#fffaf0"], [1.0, 3.4, 1.5, "#ffe6ad"], [1.9, 1.3, 1.3, "#ffc172"]] },
  { l: 51, b: false, d: 14.8, dl: -6.3,  s: 4.1, o: 0.84, p: [[0.6, 0.6, 1.3, "#fffaf0"], [2.0, 1.9, 1.0, "#ffe6ad"], [1.4, 2.4, 1.0, "#ffc172"]] },
  { l: 71, b: true,  d: 8.1,  dl: -10.5, s: 7.6, o: 0.88, p: [[1.6, 3.2, 2.9, "#fffaf0"], [2.1, 1.1, 2.0, "#ffe6ad"], [2.8, 4.3, 1.9, "#ffc172"]] },
  { l: 86, b: false, d: 13.1, dl: -3.6,  s: 4.3, o: 0.86, p: [[1.7, 2.3, 1.4, "#fffaf0"], [0.7, 0.9, 1.1, "#ffe6ad"], [2.5, 1.3, 1.1, "#ffc172"]] },
];

/* The design file's 19 flakes were tuned for a 1600x800 panel. Full-bleed they
   read as a light flurry, which is the intent, but one band alone leaves visible
   gaps on a wide monitor — a second offset band fills it without changing the
   character. Low-power devices get the single band. */
function Snow({ passes }: { passes: number }) {
  const out = [];
  for (let k = 0; k < passes; k++) {
    for (let i = 0; i < FLAKES.length; i++) {
      const f = FLAKES[i];
      const left = (f.l + k * 3.7) % 100;
      const delay = f.dl - k * 2.3 - (k ? 0.7 : 0);
      out.push(
        <span
          key={`${k}-${i}`}
          style={{
            position: "absolute",
            left: `${left}%`,
            top: 0,
            bottom: 0,
            width: 0,
            willChange: "transform",
            animation: `${f.b ? "wcFlakeDropB" : "wcFlakeDrop"} ${f.d}s linear ${delay}s infinite`,
          }}
        >
          <span style={{ position: "relative", display: "block", width: f.s, height: f.s, opacity: f.o }}>
            {f.p.map((d, j) => (
              <span
                key={j}
                style={{
                  position: "absolute",
                  left: d[0],
                  top: d[1],
                  width: d[2],
                  height: d[2],
                  borderRadius: "50%",
                  background: d[3],
                }}
              />
            ))}
          </span>
        </span>,
      );
    }
  }
  return (
    <div data-wc-snow="" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {out}
    </div>
  );
}

export type WinterCabinSceneProps = {
  /** Keep at -1. See the note at the top of this file. */
  zIndex?: number;
  /**
   * Dims the painting behind the page copy. Default 0 — the painting shows raw,
   * which is the point of it. Legibility is carried entirely by the type halos
   * in cabin.css instead. Raise this only if some future section turns out to
   * sit badly on the sunrise bloom; even 0.15 is visible as a haze.
   */
  veil?: number;
  /** Bands of the 19-flake set to render. Default: 2, or 1 on low-power devices. */
  snowPasses?: number;
  className?: string;
};

export default function WinterCabinScene({
  zIndex = -1,
  veil = 0,
  snowPasses,
  className,
}: WinterCabinSceneProps) {
  useInjectedCss();
  const hidden = useHidden();
  const lowPower = useLowPower();
  const passes = snowPasses ?? (lowPower ? 1 : 2);

  return (
    <div
      data-wc-root=""
      data-wc-paused={hidden ? "1" : "0"}
      aria-hidden="true"
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        pointerEvents: "none",
        overflow: "hidden",
        background: "#26364a",
        contain: "paint",
      }}
    >
      {/* The painting, cover-fitted around --wc-fx. Everything pinned to a
          feature of the art (the lamp, the chimney) lives inside this box so it
          travels with the crop. */}
      <div
        data-wc-stage=""
        style={{
          position: "absolute",
          top: "50%",
          left: "var(--wc-fx)",
          transform: "translate(calc(-1 * var(--wc-fx)), -50%)",
          width: "var(--wc-stage-w)",
          height: "calc(var(--wc-stage-w) / 2)",
        }}
      >
        <img
          src={cabin3200}
          srcSet={`${cabin1600} 1600w, ${cabin3200} 3200w`}
          sizes="(max-aspect-ratio: 1/1) 200vh, 100vw"
          alt=""
          decoding="async"
          fetchPriority="high"
          draggable={false}
          style={{ display: "block", width: "100%", height: "100%", objectFit: "fill" }}
        />

        {/* Readability veil. A flat layer over the painting — deliberately not a
            backdrop-filter, which forces a full-viewport repaint on every scroll.
            It sits UNDER the lamp and smoke on purpose: dimming the valley is
            what makes the lit windows read as the one light source in it. */}
        {veil > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(
                180deg,
                rgba(10, 18, 32, ${(veil + 0.1).toFixed(3)}) 0%,
                rgba(10, 18, 32, ${veil.toFixed(3)}) 34%,
                rgba(10, 18, 32, ${(veil + 0.06).toFixed(3)}) 100%
              )`,
            }}
          />
        )}

        {/* Live layers, in the painting's own 1600x800 coordinate space. */}
        <svg
          viewBox="0 0 1600 800"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="wcLamp" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#ffd58a" stopOpacity="0.5" />
              <stop offset="0.5" stopColor="#ffb457" stopOpacity="0.18" />
              <stop offset="1" stopColor="#f0a93c" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="wcPuff" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#f2ece2" stopOpacity="0.8" />
              <stop offset="0.5" stopColor="#e4e2e0" stopOpacity="0.4" />
              <stop offset="1" stopColor="#d8dde4" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* window lamp */}
          <ellipse
            cx="1246"
            cy="404"
            rx="190"
            ry="54"
            fill="url(#wcLamp)"
            style={{ mixBlendMode: "screen", animation: "wcEmber 7.4s ease-in-out infinite" }}
          />

          {/* chimney smoke */}
          <g transform="translate(1246,246)" fill="url(#wcPuff)" style={{ opacity: 0.9 }}>
            {[
              [15, "wcChimneyA", "0s"],
              [13, "wcChimneyB", "-1.9s"],
              [16, "wcChimneyA", "-3.7s"],
              [12, "wcChimneyB", "-5.5s"],
              [14, "wcChimneyA", "-7.3s"],
              [13, "wcChimneyB", "-9.1s"],
            ].map(([r, name, delay], i) => (
              <g
                key={i}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  animation: `${name} 11s linear ${delay} infinite`,
                }}
              >
                <circle r={r as number} />
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Snow rides the viewport, not the stage, so it still covers the screen
          when the painting is cropped hard on a phone. */}
      <Snow passes={passes} />
    </div>
  );
}
