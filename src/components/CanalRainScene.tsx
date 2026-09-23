import { useEffect, useRef, useState } from "react";

import canal1500 from "@/assets/canal-1500.webp";
import canal3000 from "@/assets/canal-3000.webp";
import canal4500 from "@/assets/canal-4500.webp";
import canalMax from "@/assets/canal-6000.webp";

/** Intrinsic width of the largest source, for the srcset descriptor. */
const MAX_W = 6000;

/**
 * CanalRainScene — the "Canal in the Rain" backdrop.
 *
 * Same split as WinterCabinScene, for the same reason. The source design paints
 * ~90,000 elliptical dabs off a reference photograph, which its own README
 * warns "takes a noticeable moment"; that painting is baked once offline to
 * WebP (400 KB) so the page pays nothing for it. What could not be baked is the
 * rain — it has to move — so that is ported faithfully and runs on one canvas.
 *
 * Mounted at zIndex -1, NOT 0: the page wrapper on Index/Gallery has `isolate`,
 * so its inner z-10 content cannot rise above a z-0 fixed sibling that paints
 * later in the DOM, and the scene would cover the whole site.
 */

const STYLE_ID = "cr-scene-css";

/* The painting is 3:2 — a much gentler crop than the cabin's 2:1 — and the
   canal recedes to a vanishing point in the middle of the frame, so a centred
   crop is already the right one at every aspect ratio. No focal shift needed. */
const CSS = `
[data-cr-root] { --cr-fx: 50%; --cr-stage-w: max(100vw, 100vh * 1.5); }
`;

/** The canal surface, normalised to the painting. Lifted from the design file. */
const WATER: [number, number][] = [
  [0.29, 0.52], [0.47, 0.52], [0.58, 0.575], [0.74, 0.64], [0.87, 0.72],
  [1, 0.8], [1, 1], [0, 1], [0, 0.92], [0.14, 0.745], [0.29, 0.72],
  [0.33, 0.685], [0.325, 0.66], [0.29, 0.56],
];

function inWater(xn: number, yn: number) {
  let c = false;
  for (let i = 0, j = WATER.length - 1; i < WATER.length; j = i++) {
    const [xi, yi] = WATER[i];
    const [xj, yj] = WATER[j];
    if (yi > yn !== yj > yn && xn < ((xj - xi) * (yn - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** mulberry32 — the design file's RNG, seed 771 for rain, so the look matches. */
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const STREAK_TINTS = [
  "236,240,244", "214,224,236", "240,234,222",
  "200,214,228", "132,146,162", "150,160,176",
];
const RING_NEAR = ["232,238,244", "214,224,236", "242,236,224"];
const RING_FAR = ["150,162,176", "176,188,200"];

type Dot = { t: number; r: number; a: number; dx: number; c: string };
type Drop = { x: number; y: number; v: number; l: number; dots?: Dot[] };
type RingDot = { th: number; rj: number; r: number; a: number; skip: boolean; c: string };
type Ring = {
  x: number; y: number; a: number; s: number;
  dots: RingDot[]; splash: { dx: number; dy: number; r: number }[]; two: boolean;
};

const RAIN_K = { none: 0, light: 1, heavy: 2.6 } as const;
export type RainStrength = keyof typeof RAIN_K;

function useInjectedCss() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

/** cores/memory/viewport sniff, matching Weather.tsx and WinterCabinScene. */
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

export type CanalRainSceneProps = {
  /** Keep at -1. See the note at the top of this file. */
  zIndex?: number;
  rain?: RainStrength;
  className?: string;
};

export default function CanalRainScene({ zIndex = -1, rain = "light", className }: CanalRainSceneProps) {
  useInjectedCss();
  const lowPower = useLowPower();
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (reduced?.matches) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const k = RAIN_K[rain] ?? 1;
    if (!k) return;

    /* Rain lives in VIEWPORT space, not the painting's. The stage is far wider
       than the screen on a tall window, and drawing streaks across all of it
       would spend most of the frame on drops nobody can see. Only the ripple
       rings need the painting's coordinates — they have to land on the canal —
       so those are born in viewport space and tested against the stage rect. */
    let vw = 0, vh = 0, dpr = 1;
    let stageRect = { left: 0, top: 0, width: 1, height: 1 };
    let sc = 1;          // painting scale: how big a 1500-space pixel is on screen
    let nDrops = 0, ringRate = 0;

    const R = rng(771);
    const pool: Drop[] = [];
    let rings: Ring[] = [];

    const measure = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5);
      canvas.width = Math.max(1, Math.round(vw * dpr));
      canvas.height = Math.max(1, Math.round(vh * dpr));
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const r = stage.getBoundingClientRect();
      stageRect = { left: r.left, top: r.top, width: r.width || 1, height: r.height || 1 };
      sc = stageRect.width / 1500;

      /* The design's 160 drops and 38 rings/s are tuned for a 1500px-wide
         panel. Scale both by how much screen there actually is, so a phone
         isn't drawing desktop-density rain into a third of the pixels. */
      const spread = Math.max(0.35, Math.min(1.7, vw / 1500));
      nDrops = Math.round(160 * k * spread * (lowPower ? 0.55 : 1));
      ringRate = 38 * k * spread * (lowPower ? 0.5 : 1);
      while (pool.length < nDrops) {
        pool.push({ x: R() * vw * 1.1, y: R() * vh, v: 700 + R() * 500, l: 8 + R() * 14 });
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.documentElement);
    window.addEventListener("resize", measure);

    let raf = 0;
    let last = performance.now();
    let running = true;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!running) return;

      ctx.clearRect(0, 0, vw, vh);

      // --- streaks: a short run of tapering dabs along the fall ---
      for (let i = 0; i < nDrops; i++) {
        const p = pool[i];
        const v = p.v * sc;
        p.y += v * dt;
        p.x -= v * dt * 0.12;
        if (p.y > vh) {
          p.y = -20;
          p.x = R() * vw * 1.1;
        }
        if (!p.dots) {
          const n = 3 + Math.floor(R() * 4);
          p.dots = Array.from({ length: n }, (_, j) => ({
            t: (j + R() * 0.6) / n,
            r: 0.6 + R() * 0.6,
            a: 0.22 + R() * 0.32,
            dx: (R() - 0.5) * 0.9,
            c: STREAK_TINTS[Math.floor(R() * 6)],
          }));
        }
        const len = p.l * sc;
        for (const q of p.dots) {
          const k2 = 1 - q.t * 0.6;
          ctx.fillStyle = `rgba(${q.c},${(q.a * k2).toFixed(3)})`;
          ctx.beginPath();
          ctx.ellipse(
            p.x + len * 0.12 * q.t + q.dx * sc,
            p.y - len * q.t,
            q.r * k2 * sc,
            q.r * k2 * 1.7 * sc,
            -0.12, 0, 6.28318,
          );
          ctx.fill();
        }
      }

      // --- rings: born on the canal, flattened and shrunk with distance ---
      let births = ringRate * dt;
      while (births > 0) {
        if (R() < births) {
          for (let t = 0; t < 8; t++) {
            const x = R() * vw;
            const y = vh * (0.3 + Math.pow(R(), 0.8) * 0.7);
            const xn = (x - stageRect.left) / stageRect.width;
            const yn = (y - stageRect.top) / stageRect.height;
            if (xn < 0 || xn > 1 || yn < 0 || yn > 1) continue;
            if (!inWater(xn, yn)) continue;
            const d = (yn - 0.5) / 0.5;
            const sz = (3 + d * 16) * sc;
            const n = 7 + Math.floor((3 + d * 16) * 0.9);
            const dots: RingDot[] = Array.from({ length: n }, (_, j) => {
              const th = ((j + (R() - 0.5) * 0.7) / n) * 6.28318;
              return {
                th,
                rj: 0.85 + R() * 0.3,
                r: (0.5 + R() * 0.5 + d * 0.5) * sc,
                a: 0.3 + R() * 0.45,
                skip: R() < 0.22,
                c: Math.sin(th) > 0
                  ? RING_NEAR[Math.floor(R() * 3)]
                  : RING_FAR[Math.floor(R() * 2)],
              };
            });
            const splash = Array.from({ length: 2 + Math.floor(R() * 3) }, () => ({
              dx: (R() - 0.5) * 2 * sc,
              dy: -R() * (2 + d * 4) * sc,
              r: (0.5 + R() * 0.6) * sc,
            }));
            rings.push({ x, y, a: 0, s: sz, dots, splash, two: R() < 0.45 });
            break;
          }
        }
        births -= 1;
      }

      rings = rings.filter((r) => {
        r.a += dt / 1.1;
        if (r.a >= 1) return false;
        if (r.a < 0.18) {
          const k3 = 1 - r.a / 0.18;
          for (const q of r.splash) {
            ctx.fillStyle = `rgba(236,242,248,${(0.6 * k3).toFixed(3)})`;
            ctx.beginPath();
            ctx.ellipse(r.x + q.dx, r.y + q.dy * (0.4 + r.a * 4), q.r, q.r * 1.3, 0, 0, 6.28318);
            ctx.fill();
          }
        }
        const passes = r.two ? [r.a, r.a - 0.28] : [r.a];
        for (const ra of passes) {
          if (ra <= 0) continue;
          const rad = r.s * (0.2 + ra);
          const fade = 1 - ra;
          for (const q of r.dots) {
            if (q.skip) continue;
            ctx.fillStyle = `rgba(${q.c},${(q.a * fade).toFixed(3)})`;
            ctx.beginPath();
            ctx.ellipse(
              r.x + Math.cos(q.th) * rad * q.rj,
              r.y + Math.sin(q.th) * rad * 0.26 * q.rj,
              q.r * 1.6, q.r * 0.6, 0, 0, 6.28318,
            );
            ctx.fill();
          }
        }
        return true;
      });
    };

    raf = requestAnimationFrame(frame);

    /* A hidden tab still gets rAF callbacks throttled, not stopped, and a
       backgrounded loop that keeps integrating dt wakes up with a pile of
       rings. Freeze it instead. */
    const onVisibility = () => {
      running = !document.hidden;
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [rain, lowPower]);

  return (
    <div
      data-cr-root=""
      ref={rootRef}
      aria-hidden="true"
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        pointerEvents: "none",
        overflow: "hidden",
        background: "#6f7a84",
        contain: "paint",
      }}
    >
      <div
        data-cr-stage=""
        ref={stageRef}
        style={{
          position: "absolute",
          top: "50%",
          left: "var(--cr-fx)",
          transform: "translate(calc(-1 * var(--cr-fx)), -50%)",
          width: "var(--cr-stage-w)",
          height: "calc(var(--cr-stage-w) / 1.5)",
        }}
      >
        {/* srcset deliberately OVERSTATES the width by 1.5x.

            The browser's normal rule — serve about one source pixel per device
            pixel — assumes the source has real detail at that size. This one
            does not: it is a painting built from a 1500x1000 reference, so at
            density 1.0 you see every soft dab edge at full size with nothing in
            reserve. Measured on a 2560x1440 monitor at 100% scaling, the honest
            `sizes` picked the 3000px source and landed at exactly 1.00. Asking
            for 150vw instead of 100vw pushes that to ~1.7 and the softness goes.

            The stage itself is `max(100vw, 100vh * 1.5)`, and 150vh only wins
            once the viewport is TALLER than 3:2 — so that is the breakpoint,
            not 2/3. Get it wrong and tablet-ish aspect ratios under-report.

            Phones are capped on purpose: a handset at DPR 3 would otherwise
            pull the largest source, which is 700 KB for a screen where 3000
            already lands well above 2x density.

            Sources come from the handoff's 6000x4000 backing store. That is a
            resolution change only — same seed, same strokes, same logical
            1500x1000 coordinates. The one thing that does NOT come along for
            free is the glow pass: its blur radii are in DEVICE pixels, so they
            scale with the backing store (14/5px at 2x became 28/10px at 4x).
            Re-bake from the handoff rather than by hand, or the window bloom
            comes out the wrong size. */}
        <img
          src={canalMax}
          srcSet={`${canal1500} 1500w, ${canal3000} 3000w, ${canal4500} 4500w, ${canalMax} ${MAX_W}w`}
          sizes="(max-width: 820px) 1000px, (max-aspect-ratio: 3/2) 225vh, 150vw"
          alt=""
          decoding="async"
          draggable={false}
          style={{ display: "block", width: "100%", height: "100%", objectFit: "fill" }}
        />
      </div>

      <canvas
        data-cr-rain=""
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
}
