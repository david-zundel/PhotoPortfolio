/**
 * Weather — the site's ONLY snow system.
 *
 * Opens as a blizzard over the hero, then hands off to calm snow as the page
 * scrolls. Replaces any existing snowfall component: delete that one, this
 * layer owns all the weather. See WEATHER.md.
 *
 * Mount ONCE, high in the tree. Renders a fixed, pointer-events:none layer
 * over the viewport. It never fully unmounts — calm snow is the resting state.
 *
 * Defaults below are the approved settings: coverage 0.6, snowDensity 1.5,
 * fadeDistance 820.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";

/* ---------- tuning ---------- */

const TONE: Record<string, string> = {
  dark: "radial-gradient(ellipse at 50% 44%, rgba(139,155,181,0.88), rgba(157,172,196,0.5) 42%, rgba(178,190,209,0) 72%)",
  slate: "radial-gradient(ellipse at 50% 48%, rgba(178,191,211,0.9), rgba(196,208,225,0.5) 45%, rgba(208,219,234,0) 73%)",
  pale: "radial-gradient(ellipse at 50% 50%, rgba(232,239,247,0.94), rgba(226,235,246,0.5) 46%, rgba(236,243,250,0) 73%)",
  light: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.96), rgba(255,255,255,0.52) 46%, rgba(255,255,255,0) 73%)",
};

type Cloud = { g: keyof typeof TONE | string; x: number; y: number; w: number; h: number; b: number; o: number; cy: number; d: number; delay: number };

/** 9 masses, painted back-to-front: two dark, two slate, then pale/white. */
const CLOUDS: Cloud[] = [
  { g: "dark",  x: -30, y: -20, w: 92, h: 84, b: 62, o: 0.82, cy: -4, d: 58, delay: 3 },
  { g: "dark",  x: 34,  y: 18,  w: 86, h: 76, b: 70, o: 0.72, cy: 5,  d: 66, delay: 37 },
  { g: "slate", x: -14, y: 30,  w: 98, h: 70, b: 66, o: 0.76, cy: -3, d: 51, delay: 19 },
  { g: "slate", x: 50,  y: -26, w: 74, h: 88, b: 58, o: 0.66, cy: 6,  d: 44, delay: 28 },
  { g: "pale",  x: -22, y: -8,  w: 72, h: 68, b: 46, o: 0.78, cy: -5, d: 34, delay: 0 },
  { g: "pale",  x: 20,  y: 42,  w: 88, h: 62, b: 56, o: 0.7,  cy: 4,  d: 47, delay: 13 },
  { g: "light", x: -26, y: 52,  w: 96, h: 60, b: 60, o: 0.72, cy: -3, d: 39, delay: 31 },
  { g: "light", x: 40,  y: 4,   w: 62, h: 74, b: 42, o: 0.6,  cy: 6,  d: 30, delay: 21 },
  { g: "light", x: 4,   y: -24, w: 80, h: 66, b: 50, o: 0.66, cy: -4, d: 43, delay: 9 },
];

const PRESETS = {
  heavy:    { wash: 0.28, cloud: 0.74, gloom: 0.85, blur: 1.4, dens: 0.72 },
  whiteout: { wash: 0.42, cloud: 1.0,  gloom: 1.15, blur: 2.2, dens: 1.0 },
  total:    { wash: 0.56, cloud: 1.2,  gloom: 1.3,  blur: 3.2, dens: 1.35 },
};

type Kind = "far" | "mid" | "dust" | "near" | "glyph" | "crystal";
type LayerCfg = { dx0: number; dxR: number; op0: number; opR: number; dur0: number; durR: number; cs0?: number; csR?: number };

/** Base particle counts at snowDensity 1 (~223). Wind is a global 2.1x multiplier. */
/** Horizontal wind. 1.0 keeps the fall inside 45°; dx is also hard-capped at the
 *  fall distance, so no particle ever travels sideways faster than it falls. */
const WIND = 1.0;
const LAYERS: Array<{ kind: Kind; count: number; salt: number; cfg: LayerCfg }> = [
  { kind: "far",     count: 64, salt: 11, cfg: { dx0: 200, dxR: 150, op0: 0.40, opR: 0.30, dur0: 5.0, durR: 1.7 } },
  { kind: "mid",     count: 44, salt: 12, cfg: { dx0: 260, dxR: 180, op0: 0.70, opR: 0.30, dur0: 3.3, durR: 1.1 } },
  { kind: "dust",    count: 52, salt: 15, cfg: { dx0: 150, dxR: 120, op0: 0.32, opR: 0.26, dur0: 6.4, durR: 2.1 } },
  { kind: "near",    count: 20, salt: 13, cfg: { dx0: 380, dxR: 240, op0: 0.42, opR: 0.32, dur0: 1.7, durR: 0.7 } },
  // Storm crystals are smaller and fewer than the calm ones — at whiteout
  // density, large crystals read as clutter rather than weather.
  { kind: "crystal", count: 34, salt: 16, cfg: { dx0: 240, dxR: 170, op0: 0.62, opR: 0.28, dur0: 4.3, durR: 1.4, cs0: 8, csR: 6 } },
  { kind: "glyph",   count: 9,  salt: 14, cfg: { dx0: 220, dxR: 140, op0: 0.50, opR: 0.28, dur0: 4.6, durR: 1.4 } },
];

/** Calm snow — the resting weather below the fold. ~142 particles at density 1. */
const CALM_LAYERS: Array<{ kind: Kind; count: number; salt: number; cfg: LayerCfg }> = [
  { kind: "dust",    count: 44, salt: 31, cfg: { dx0: 14, dxR: 30, op0: 0.34, opR: 0.26, dur0: 20, durR: 7 } },
  { kind: "mid",     count: 42, salt: 32, cfg: { dx0: 20, dxR: 44, op0: 0.62, opR: 0.30, dur0: 17, durR: 6 } },
  { kind: "crystal", count: 44, salt: 34, cfg: { dx0: 22, dxR: 46, op0: 0.62, opR: 0.28, dur0: 18, durR: 6, cs0: 12, csR: 8 } },
  { kind: "glyph",   count: 12, salt: 33, cfg: { dx0: 26, dxR: 50, op0: 0.50, opR: 0.30, dur0: 15, durR: 5 } },
];

const KEYFRAMES = `
@keyframes bz-fall {
  0% { transform: translate3d(0, -40px, 0); opacity: 0; }
  7% { opacity: var(--op, 0.8); }
  88% { opacity: var(--op, 0.8); }
  100% { transform: translate3d(var(--dx, 140px), var(--travel, 780px), 0); opacity: 0; }
}
@keyframes bz-curve {
  0% { transform: translate3d(0, -40px, 0); opacity: 0; }
  9% { opacity: var(--op, 0.8); }
  50% { transform: translate3d(calc(var(--dx, 140px) * 0.32), calc(var(--travel, 780px) * 0.5), 0); }
  84% { opacity: var(--op, 0.8); }
  100% { transform: translate3d(var(--dx, 140px), var(--travel, 780px), 0); opacity: 0; }
}
/* Drift only — no scale(). Scaling a 40-70px-blurred layer forces the browser
   to re-rasterise the blur at every step, which costs frames continuously. */
@keyframes bz-cloud {
  0% { transform: translate3d(-45%, 0, 0); opacity: 0; }
  16% { opacity: var(--op, 0.6); }
  50% { transform: translate3d(15%, var(--cy, -4%), 0); }
  80% { opacity: var(--op, 0.6); }
  100% { transform: translate3d(85%, 0, 0); opacity: 0; }
}
@keyframes bz-squall {
  0% { transform: translate3d(-60%, 0, 0) scaleY(1); opacity: 0; }
  22% { opacity: var(--op, 0.3); }
  72% { opacity: var(--op, 0.3); }
  100% { transform: translate3d(120%, var(--cy, 4%), 0) scaleY(1.3); opacity: 0; }
}
@keyframes bz-breathe { 0%, 100% { opacity: 0.84; } 40% { opacity: 1; } }
@keyframes bz-spin { from { rotate: 0deg; } to { rotate: 360deg; } }
`;

/** Six-armed crystal, referenced by every crystal particle via <use>. */
const SPRITE = (
  <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
    <defs>
      <g id="bz-arm" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12,12 L12,1.6" />
        <path d="M12,5.2 L9.1,2.9" />
        <path d="M12,5.2 L14.9,2.9" />
        <path d="M12,8.6 L10,7" />
        <path d="M12,8.6 L14,7" />
      </g>
      <symbol id="bz-crystal" viewBox="0 0 24 24">
        <use href="#bz-arm" />
        <use href="#bz-arm" transform="rotate(60 12 12)" />
        <use href="#bz-arm" transform="rotate(120 12 12)" />
        <use href="#bz-arm" transform="rotate(180 12 12)" />
        <use href="#bz-arm" transform="rotate(240 12 12)" />
        <use href="#bz-arm" transform="rotate(300 12 12)" />
      </symbol>
    </defs>
  </svg>
);

/* ---------- helpers ---------- */

/** Deterministic hash — same snow every load, no hydration mismatch. */
function rnd(i: number, salt: number) {
  const x = Math.sin((i + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function useKeyframes() {
  useEffect(() => {
    const ID = "bz-keyframes";
    if (document.getElementById(ID)) return;
    const el = document.createElement("style");
    el.id = ID;
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
  }, []);
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * Scroll progress 0→1 over `fadeDistance`, rAF-throttled and MONOTONIC:
 * progress only ever advances, so scrolling back up to the hero keeps clear
 * skies. The storm is a once-per-load first impression; it returns on reload.
 */
function useScrollProgress(fadeDistance: number) {
  const [q, setQ] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const read = () => {
      raf.current = 0;
      // Quantised to 2% steps: ~50 repaints over the fade instead of one per
      // scroll event, which is what makes the handoff feel smooth.
      const raw = Math.round(Math.min(1, Math.max(0, window.scrollY / fadeDistance)) * 50) / 50;
      setQ((prev) => Math.max(prev, raw));
    };
    const onScroll = () => {
      if (!raf.current) raf.current = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [fadeDistance]);
  return q;
}

/**
 * Storm teardown level, deferred until scrolling STOPS.
 *   0 = everything mounted, 1 = clouds dropped, 2 = all storm layers dropped.
 * Unmounting 9 blurred clouds and ~350 particles mid-gesture is a compositor
 * spike that reads as a pause in the snow. Invisible layers cost a little for a
 * moment; a hitch during the one animation the user is watching costs more.
 */
function useTeardown(q: number) {
  const [cleared, setCleared] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => {
      const level = q >= 0.999 ? 2 : q >= 0.8 ? 1 : 0;
      setCleared((prev) => (level > prev ? level : prev));
    }, 450);
    return () => window.clearTimeout(t);
  }, [q]);
  return cleared;
}

function useViewportHeight() {
  const [h, setH] = useState(() => (typeof window === "undefined" ? 900 : window.innerHeight));
  useEffect(() => {
    let t: number | undefined;
    const on = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => setH(window.innerHeight), 200);
    };
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("resize", on);
      window.clearTimeout(t);
    };
  }, []);
  return h;
}

/* ---------- component ---------- */

export type WeatherProps = {
  /** Global white/cloud multiplier. 0.6 = approved. */
  coverage?: number;
  /** Blizzard particle multiplier. 1.5 = approved (~335 particles). */
  snowDensity?: number;
  /** Calm-snow particle multiplier — the resting weather (~142 at 1). */
  calmDensity?: number;
  /** Scroll distance in px over which the storm clears. 820 = approved. */
  fadeDistance?: number;
  preset?: keyof typeof PRESETS;
  zIndex?: number;
  className?: string;
};

export default function Weather({
  coverage = 0.6,
  snowDensity = 1.5,
  calmDensity = 1,
  fadeDistance = 820,
  preset = "whiteout",
  zIndex = 40,
  className,
}: WeatherProps) {
  useKeyframes();
  const reduced = useReducedMotion();
  const q = useScrollProgress(fadeDistance);
  const cleared = useTeardown(q);
  const vh = useViewportHeight();
  const p = PRESETS[preset] ?? PRESETS.whiteout;

  const travel = vh + 70;
  const ramp = (end: number) => Math.max(0, 1 - q / end);

  const buildField = (
    layers: typeof LAYERS,
    dens: number,
    wind: number,
    keyPrefix: string
  ) => {
    const scale = travel / 780;
    const out: React.ReactNode[] = [];
    for (const layer of layers) {
      const count = Math.max(1, Math.round(layer.count * dens));
      for (let i = 0; i < count; i++) {
        const a = rnd(i, layer.salt);
        const b = rnd(i, layer.salt + 7);
        const c = rnd(i, layer.salt + 13);
        const d = rnd(i, layer.salt + 21);
        // Hard-capped at 45°: horizontal travel never exceeds the fall distance.
        const dx = Math.min(travel, Math.round((layer.cfg.dx0 + b * layer.cfg.dxR) * wind * scale));
        const tilt = (Math.atan2(dx, travel) * 180) / Math.PI;
        const op = layer.cfg.op0 + c * layer.cfg.opR;
        const st: React.CSSProperties & Record<string, any> = {
          position: "absolute",
          left: `${(d * 112 - 10).toFixed(2)}%`,
          top: "-6%",
          background: "#fff",
          willChange: "transform",
          "--dx": `${dx}px`,
          "--travel": `${travel}px`,
          "--op": op.toFixed(2),
        };

        const spin = layer.kind === "crystal";
        if (spin) {
          const size = `${(((layer.cfg.cs0 ?? 13) + a * (layer.cfg.csR ?? 15)) * scale).toFixed(1)}px`;
          st.background = "none";
          st.width = size;
          st.height = size;
          st.color = `rgba(255,255,255,${(0.82 + c * 0.18).toFixed(2)})`;
          // Fixed random tilt per crystal — keeps orientation variety WITHOUT the
          // continuous rotation. The old spin read as the flakes tumbling "upward".
          st.rotate = `${Math.round(b * 90 - 45)}deg`;
          // Only the biggest get a shadow — drop-shadow on hundreds of animated
          // elements is the one thing here that actually costs frames.
          if (a > 0.72) st.filter = "drop-shadow(0 1px 1.5px rgba(112,142,176,0.5))";
        } else if (layer.kind === "glyph") {
          st.background = "none";
          st.color = "rgba(255,255,255,0.85)";
          st.fontSize = `${((10 + a * 8) * scale).toFixed(1)}px`;
          st.lineHeight = 1;
          st.rotate = `${Math.round(b * 40 - 20)}deg`;
        } else if (layer.kind === "near") {
          st.width = `${((2.4 + a * 1.8) * scale).toFixed(1)}px`;
          st.height = `${((15 + a * 14) * scale).toFixed(1)}px`;
          st.borderRadius = "40%";
          st.filter = `blur(${(1.2 + a * 0.9).toFixed(1)}px)`;
          st.rotate = `${tilt.toFixed(1)}deg`;
        } else {
          const base = layer.kind === "dust" ? 1 + a * 1.2 : layer.kind === "far" ? 1.8 + a * 2.2 : 3.4 + a * 3;
          const s = `${(base * scale).toFixed(1)}px`;
          st.width = s;
          st.height = s;
          st.borderRadius = "50%";
          if (layer.kind === "far") st.filter = "blur(0.5px)";
          else if (layer.kind === "dust") st.filter = "blur(0.8px)";
          else st.boxShadow = "0 0 4px rgba(255,255,255,0.6)";
        }

        if (reduced) {
          st.opacity = op;
          st.top = `${(a * 96).toFixed(1)}%`;
          if (spin) st.rotate = `${Math.round(b * 60)}deg`;
        } else {
          st.opacity = 0;
          const dur = (layer.cfg.dur0 - a * layer.cfg.durR) / wind;
          const name = layer.kind === "mid" || layer.kind === "near" ? "bz-fall" : "bz-curve";
          // Crystals no longer spin — they keep the fixed tilt set above and just
          // fall straight down like the rest of the snow.
          st.animation = `${name} ${dur.toFixed(2)}s linear ${(-c * dur).toFixed(2)}s infinite`;
        }

        out.push(
          spin ? (
            <svg key={`${keyPrefix}${layer.kind}${i}`} style={st} viewBox="0 0 24 24">
              <use href="#bz-crystal" />
            </svg>
          ) : (
            <span key={`${keyPrefix}${layer.kind}${i}`} style={st}>
              {layer.kind === "glyph" ? "❄" : null}
            </span>
          )
        );
      }
    }
    return out;
  };

  const flakes = useMemo(
    () => buildField(LAYERS, p.dens * snowDensity * (reduced ? 0.5 : 1), WIND, "b"),
    [p.dens, snowDensity, reduced, travel]
  );

  const calmFlakes = useMemo(
    () => buildField(CALM_LAYERS, calmDensity * (reduced ? 0.5 : 1), 1, "c"),
    [calmDensity, reduced, travel]
  );

  const clouds = useMemo(
    () =>
      CLOUDS.map((c, i) => {
        const st: React.CSSProperties & Record<string, any> = {
          position: "absolute",
          left: `${c.x}%`,
          top: `${c.y}%`,
          width: `${c.w}%`,
          height: `${c.h}%`,
          background: TONE[c.g] ?? TONE.light,
          filter: `blur(${c.b}px)`,
        };
        if (reduced) {
          st.opacity = c.o * 0.85;
        } else {
          st.opacity = 0;
          st.willChange = "transform";
          st["--op"] = c.o;
          st["--cy"] = `${c.cy}%`;
          st.animation = `bz-cloud ${c.d}s linear ${-c.delay}s infinite`;
        }
        return <div key={`c${i}`} style={st} />;
      }),
    [reduced]
  );

  const squalls = useMemo(() => {
    if (reduced) return null;
    return [0, 1, 2, 3, 4].map((i) => (
      <div
        key={`s${i}`}
        style={
          {
            position: "absolute",
            left: 0,
            top: `${-12 + i * 24}%`,
            width: "75%",
            height: `${16 + i * 5}%`,
            background:
              "linear-gradient(96deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 45%, rgba(255,255,255,0.2) 78%, rgba(255,255,255,0) 100%)",
            filter: `blur(${8 + i * 4}px)`,
            opacity: 0,
            willChange: "transform",
            "--op": 0.34 + i * 0.06,
            "--cy": `${3 + i * 2}%`,
            animation: `bz-squall ${4.6 + i * 1.5}s ease-in-out ${-i * 1.9}s infinite`,
          } as React.CSSProperties
        }
      />
    ));
  }, [reduced]);

  const stormGone = cleared >= 2;
  // Calm snow crossfades in over the first 70% of the fade and then stays.
  const calmOpacity = Math.min(1, q / 0.7);

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ position: "fixed", inset: 0, zIndex, pointerEvents: "none", contain: "strict" }}
    >
      {SPRITE}
      {!stormGone && (
        <>
      {/* storm gloom — darkens the sky behind */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          // Deliberately NOT mix-blend-mode: multiply. A blended layer forces
          // the entire stacking context (every particle) to re-composite each
          // time its opacity changes, which shows up as a hitch on scroll.
          background: "linear-gradient(180deg, rgba(108,128,158,0.46), rgba(146,165,188,0.26) 60%)",
          opacity: Math.min(1, p.gloom * coverage) * ramp(0.62),
          willChange: "opacity",
        }}
      />
      {/* Atmospheric backdrop-blur removed for scroll performance: a full-viewport
          backdrop-filter forces the browser to re-render everything behind this
          layer on every scroll frame, which read as a whole-page "refresh"/pause
          while scrolling. The storm still reads through the gloom + wash + cloud
          layers below. */}
      {/* drifting cloud masses — dropped on the first idle after they hit 0 */}
      {cleared < 1 && (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: Math.min(1, p.cloud * coverage) * ramp(0.8), willChange: "opacity" }}>
          {clouds}
        </div>
      )}
      {/* flat wash — outer div owns the scroll fade, inner one breathes.
          Do NOT merge these: a running opacity animation beats an inline opacity. */}
      <div style={{ position: "absolute", inset: 0, opacity: p.wash * coverage * ramp(0.65), willChange: "opacity" }}>
        <div style={{ position: "absolute", inset: 0, background: "#fff", animation: reduced ? undefined : "bz-breathe 13s ease-in-out infinite" }} />
      </div>
      {/* snow + squalls */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 1 - q, willChange: "opacity" }}>{flakes}</div>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 1 - q, willChange: "opacity" }}>{squalls}</div>
      {/* edge glow — snow packing into the corners of frame */}
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 130px 55px rgba(255,255,255,0.85)", opacity: coverage * ramp(0.6), willChange: "opacity" }} />
        </>
      )}
      {/* calm snow — the resting weather, never unmounts */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: calmOpacity, willChange: "opacity" }}>{calmFlakes}</div>
    </div>
  );
}
