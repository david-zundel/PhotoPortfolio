/**
 * RunningDeer — storybook deer that bounds across the bottom of the viewport.
 *
 * Mount ONCE, high in the tree (e.g. app/layout.tsx, just inside <body>):
 *
 *   import RunningDeer from "@/components/RunningDeer";
 *   …
 *   <RunningDeer />
 *
 * Everything is driven by CSS custom properties, so values can be changed three ways
 * WITHOUT touching the SVG:
 *   1. props            <RunningDeer hopHeight={60} crossSeconds={18} />
 *   2. CSS             .someScope { --deer-hop: 60px; --deer-cross: 18s; }
 *   3. live dev panel   add ?deerlab=1 to any URL (or pass devPanel) → sliders,
 *                       persisted to localStorage, printable as a props snippet.
 *
 * No dependencies. Self-contained: injects its own <style> once.
 * Respects prefers-reduced-motion (deer holds still, off-canvas).
 */

"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";

export type RunningDeerProps = {
  /** main body colour */
  color?: string;
  /** far-side limbs + far antler (a lighter tone reads as depth) */
  farColor?: string;
  /** single outline colour for the whole silhouette */
  inkColor?: string;
  /** dapples + muzzle patch */
  creamColor?: string;
  /** deer height in px */
  height?: number;
  /** seconds for one crossing of the viewport */
  crossSeconds?: number;
  /** peak hop height in px */
  hopHeight?: number;
  /** seconds per bound (one full leg cycle) */
  cycleSeconds?: number;
  /** distance from the bottom of the viewport, px */
  bottom?: number;
  /** travel direction */
  direction?: "ltr" | "rtl";
  /** stack order — keep below your content */
  zIndex?: number;
  /** offset the crossing loop, seconds (use negative values to stagger a herd) */
  crossDelay?: number;
  /** show the live tweak panel (also enabled by ?deerlab=1) */
  devPanel?: boolean;
};

const DEFAULTS = {
  color: "#8a5a3b",
  farColor: "#b98a63",
  inkColor: "#4a2f22",
  creamColor: "#f5e6d0",
  height: 150,
  crossSeconds: 13,
  hopHeight: 44,
  cycleSeconds: 0.86,
  bottom: 0,
  direction: "ltr" as const,
  zIndex: 0,
  crossDelay: 0,
};

const STYLE_ID = "running-deer-keyframes";

const CSS = `
@keyframes rdCross { from { left: -280px; } to { left: calc(100% + 140px); } }
@keyframes rdHop {
  0%   { transform: translateY(0) rotate(4deg) scaleY(0.96); }
  6%   { transform: translateY(0) rotate(2deg) scaleY(0.89); }
  12%  { transform: translateY(0) rotate(0deg) scaleY(0.93); }
  18%  { transform: translateY(calc(-0.12 * var(--deer-hop))) rotate(-6deg) scaleY(1.06); }
  24%  { transform: translateY(calc(-0.34 * var(--deer-hop))) rotate(-8deg) scaleY(1.05); }
  32%  { transform: translateY(calc(-0.66 * var(--deer-hop))) rotate(-7deg) scaleY(1.02); }
  40%  { transform: translateY(calc(-0.86 * var(--deer-hop))) rotate(-5deg) scaleY(1); }
  48%  { transform: translateY(calc(-0.97 * var(--deer-hop))) rotate(-4deg) scaleY(1); }
  54%  { transform: translateY(calc(-1 * var(--deer-hop))) rotate(-3.5deg) scaleY(1); }
  62%  { transform: translateY(calc(-1 * var(--deer-hop))) rotate(-3deg) scaleY(1); }
  68%  { transform: translateY(calc(-0.97 * var(--deer-hop))) rotate(-2deg) scaleY(1); }
  76%  { transform: translateY(calc(-0.86 * var(--deer-hop))) rotate(0deg) scaleY(1); }
  84%  { transform: translateY(calc(-0.62 * var(--deer-hop))) rotate(2deg) scaleY(1); }
  91%  { transform: translateY(calc(-0.33 * var(--deer-hop))) rotate(3.5deg) scaleY(1); }
  96%  { transform: translateY(calc(-0.11 * var(--deer-hop))) rotate(4deg) scaleY(0.99); }
  100% { transform: translateY(0) rotate(4deg) scaleY(0.96); }
}
/* pairs hold their hooves on the ground: fore land first, hinds push off last */
@keyframes rdForeHold {
  0%, 84% { transform: translateY(0); }
  92%  { transform: translateY(calc(0.26 * var(--deer-hop))); }
  96%  { transform: translateY(calc(0.12 * var(--deer-hop))); }
  100% { transform: translateY(0); }
}
@keyframes rdHindHold {
  0%   { transform: translateY(calc(-0.12 * var(--deer-hop))); }
  8%   { transform: translateY(calc(-0.06 * var(--deer-hop))); }
  12%  { transform: translateY(0); }
  18%  { transform: translateY(calc(0.12 * var(--deer-hop))); }
  24%  { transform: translateY(calc(0.34 * var(--deer-hop))); }
  32%  { transform: translateY(calc(0.1 * var(--deer-hop))); }
  40%, 84% { transform: translateY(0); }
  92%  { transform: translateY(calc(-0.14 * var(--deer-hop))); }
  100% { transform: translateY(calc(-0.12 * var(--deer-hop))); }
}
@keyframes rdLegs {
  0% { transform: rotate(18deg); }  6% { transform: rotate(6deg); }
  12% { transform: rotate(-8deg); } 18% { transform: rotate(-18deg); }
  24% { transform: rotate(-12deg); } 40% { transform: rotate(8deg); }
  58% { transform: rotate(22deg); } 76% { transform: rotate(26deg); }
  90% { transform: rotate(24deg); } 100% { transform: rotate(18deg); }
}
@keyframes rdLegsHind {
  0% { transform: rotate(20deg); }  8% { transform: rotate(14deg); }
  12% { transform: rotate(6deg); } 18% { transform: rotate(-10deg); }
  24% { transform: rotate(-26deg); } 34% { transform: rotate(-30deg); }
  50% { transform: rotate(-24deg); } 66% { transform: rotate(-8deg); }
  80% { transform: rotate(8deg); } 92% { transform: rotate(18deg); }
  100% { transform: rotate(20deg); }
}
@keyframes rdCannonFore {
  0% { transform: rotate(-6deg); }  8% { transform: rotate(-18deg); }
  18% { transform: rotate(-10deg); } 24% { transform: rotate(-4deg); }
  40% { transform: rotate(-46deg); } 58% { transform: rotate(-42deg); }
  76% { transform: rotate(-14deg); } 90% { transform: rotate(-4deg); }
  100% { transform: rotate(-6deg); }
}
@keyframes rdCannonHind {
  0% { transform: rotate(20deg); } 12% { transform: rotate(6deg); }
  18% { transform: rotate(-2deg); } 24% { transform: rotate(-8deg); }
  34% { transform: rotate(6deg); } 50% { transform: rotate(34deg); }
  66% { transform: rotate(40deg); } 80% { transform: rotate(26deg); }
  92% { transform: rotate(22deg); } 100% { transform: rotate(20deg); }
}
@keyframes rdNeck {
  0% { transform: rotate(9deg); }  8% { transform: rotate(13deg); }
  18% { transform: rotate(2deg); } 26% { transform: rotate(-14deg); }
  40% { transform: rotate(-10deg); } 58% { transform: rotate(-5deg); }
  78% { transform: rotate(1deg); } 92% { transform: rotate(6deg); }
  100% { transform: rotate(9deg); }
}
@keyframes rdEar {
  0% { transform: rotate(-14deg); } 14% { transform: rotate(10deg); }
  34% { transform: rotate(16deg); } 58% { transform: rotate(4deg); }
  80% { transform: rotate(-10deg); } 100% { transform: rotate(-14deg); }
}
@keyframes rdArch {
  0% { transform: scale(1.01, 0.97) rotate(1deg); }
  8% { transform: scale(1.02, 0.94) rotate(2deg); }
  24% { transform: scale(1.05, 1) rotate(-2deg); }
  40% { transform: scale(0.98, 1.03) rotate(-1deg); }
  58% { transform: scale(0.96, 1.05) rotate(0deg); }
  76% { transform: scale(1.02, 1) rotate(1deg); }
  92% { transform: scale(1.04, 0.98) rotate(2deg); }
  100% { transform: scale(1.01, 0.97) rotate(1deg); }
}
.rd-root { position: fixed; left: 0; right: 0; bottom: 0; pointer-events: none; overflow: hidden; }
.rd-travel { position: absolute; bottom: var(--deer-bottom); animation: rdCross var(--deer-cross) linear infinite; }
.rd-hop { transform-origin: 24% 100%; animation: rdHop var(--deer-cycle) linear infinite; }
.rd-svg { height: var(--deer-height); width: auto; display: block; }
.rd-part { transform-box: view-box; }
@media (prefers-reduced-motion: reduce) {
  .rd-root * { animation-play-state: paused !important; }
}
`;

function useInjectedStyle() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
}

export default function RunningDeer(props: RunningDeerProps) {
  const filterId = `rd-ink-${useId().replace(/[:]/g, "")}`;
  useInjectedStyle();

  const [lab, setLab] = useState<Partial<RunningDeerProps> | null>(null);
  const [labOpen, setLabOpen] = useState(false);

  useEffect(() => {
    const wanted =
      props.devPanel ||
      new URLSearchParams(window.location.search).has("deerlab");
    if (!wanted) return;
    setLabOpen(true);
    try {
      const saved = localStorage.getItem("running-deer-lab");
      if (saved) setLab(JSON.parse(saved));
    } catch {}
  }, [props.devPanel]);

  const v = { ...DEFAULTS, ...props, ...(lab ?? {}) };

  const setLabValue = (k: keyof RunningDeerProps, value: number | string) => {
    const next = { ...(lab ?? {}), [k]: value };
    setLab(next);
    try {
      localStorage.setItem("running-deer-lab", JSON.stringify(next));
    } catch {}
  };

  const cycle = `${v.cycleSeconds}s`;
  const d = (fraction: number) => ({
    animationDelay: `calc(${cycle} * ${fraction})`,
  });

  const vars = {
    "--deer-color": v.color,
    "--deer-far": v.farColor,
    "--deer-ink": v.inkColor,
    "--deer-cream": v.creamColor,
    "--deer-height": `${v.height}px`,
    "--deer-hop": `${v.hopHeight}px`,
    "--deer-cross": `${v.crossSeconds}s`,
    "--deer-cycle": cycle,
    "--deer-bottom": `${v.bottom}px`,
    zIndex: v.zIndex,
    height: `${v.height + v.hopHeight + v.bottom + 8}px`,
  } as CSSProperties;

  const foreLeg = (
    hip: string,
    knee: string,
    upper: string,
    cannon: string,
    delay: number
  ) => (
    <g style={{ animation: `rdForeHold ${cycle} linear infinite` }}>
      <g
        className="rd-part"
        style={{
          transformOrigin: hip,
          animation: `rdLegs ${cycle} linear infinite`,
          ...d(delay),
        }}
      >
        <path d={upper} />
        <g
          className="rd-part"
          style={{
            transformOrigin: knee,
            animation: `rdCannonFore ${cycle} linear infinite`,
          }}
        >
          <path d={cannon} />
        </g>
      </g>
    </g>
  );

  const hindLeg = (
    hip: string,
    hock: string,
    upper: string,
    cannon: string,
    delay: number
  ) => (
    <g style={{ animation: `rdHindHold ${cycle} linear infinite` }}>
      <g
        className="rd-part"
        style={{
          transformOrigin: hip,
          animation: `rdLegsHind ${cycle} linear infinite`,
          ...d(delay),
        }}
      >
        <path d={upper} />
        <g
          className="rd-part"
          style={{
            transformOrigin: hock,
            animation: `rdCannonHind ${cycle} linear infinite`,
          }}
        >
          <path d={cannon} />
        </g>
      </g>
    </g>
  );

  return (
    <>
      <div className="rd-root" style={vars} aria-hidden="true">
        <div className="rd-travel" style={{ animationDelay: `${v.crossDelay}s` }}>
          <div className="rd-hop">
            <svg
              className="rd-svg"
              viewBox="0 8 220 228"
              style={{
                transform: v.direction === "ltr" ? "scaleX(-1)" : undefined,
              }}
            >
              <defs>
                <filter
                  id={filterId}
                  x="-25%"
                  y="-25%"
                  width="150%"
                  height="150%"
                >
                  <feMorphology
                    in="SourceAlpha"
                    operator="dilate"
                    radius="2.1"
                    result="d"
                  />
                  <feFlood floodColor="var(--deer-ink)" result="c" />
                  <feComposite in="c" in2="d" operator="in" result="o" />
                  <feMerge>
                    <feMergeNode in="o" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g filter={`url(#${filterId})`}>
                {/* far side */}
                <g fill="var(--deer-far)">
                  {foreLeg(
                    "100px 126px",
                    "104px 156px",
                    "M98,124 C110,126 112,138 112,156 L96,156 C93,142 92,130 92,124 Z",
                    "M96,152 L112,152 C113,180 113,210 114,232 L105,232 C104,210 100,180 96,152 Z",
                    -0.08
                  )}
                  {hindLeg(
                    "142px 120px",
                    "146px 178px",
                    "M138,116 C152,118 162,134 160,154 C158,168 153,174 152,180 L140,176 C144,164 140,158 134,146 C130,134 131,120 134,116 Z",
                    "M140,176 L152,180 C152,196 154,218 156,232 L147,232 C144,220 143,200 140,176 Z",
                    -0.07
                  )}
                </g>
                {/* head + neck: leads the arc, carries the far antler and the ear */}
                <g
                  className="rd-part"
                  style={{
                    transformOrigin: "88px 100px",
                    animation: `rdNeck ${cycle} linear infinite`,
                  }}
                >
                  <g fill="var(--deer-far)">
                    <path d="M62,60 C66,48 72,38 80,28 L74,26 C66,38 60,48 57,60 Z" />
                    <path d="M70,40 C76,36 82,34 88,34 L88,39 C82,39 76,41 71,45 Z" />
                  </g>
                  <g fill="var(--deer-color)">
                    <path d="M46,68 C44,52 42,38 39,22 L44,26 C48,40 53,52 58,64 Z" />
                    <path d="M44,46 C38,42 32,39 26,38 L29,44 C35,45 40,48 47,53 Z" />
                    <path d="M41,30 C38,25 35,20 34,14 L38,17 C40,22 44,27 46,31 Z" />
                    <g
                      className="rd-part"
                      style={{
                        transformOrigin: "58px 72px",
                        animation: `rdEar ${cycle} linear infinite`,
                        animationDelay: `calc(${cycle} * -0.06)`,
                      }}
                    >
                      <path d="M56,68 C64,60 76,56 80,62 C82,68 70,76 60,76 Z" />
                    </g>
                    <path d="M52,64 C42,70 30,78 23,86 C19,90 21,96 27,96 C35,96 45,90 52,82 C60,94 68,108 76,124 C84,132 98,124 96,104 C88,96 64,74 55,60 C53,56 51,58 52,64 Z" />
                    <path
                      d="M22,89 C26,85 31,85 33,89 C31,94 25,95 22,94 Z"
                      fill="var(--deer-cream)"
                    />
                    <circle cx="40" cy="77" r="2.2" fill="var(--deer-ink)" />
                    <circle cx="24" cy="91" r="1.2" fill="var(--deer-ink)" />
                  </g>
                </g>
                {/* near side + barrel */}
                <g fill="var(--deer-color)">
                  {foreLeg(
                    "86px 126px",
                    "92px 156px",
                    "M84,124 C96,126 100,138 100,156 L84,156 C81,142 78,130 78,124 Z",
                    "M84,152 L100,152 C101,180 101,210 102,232 L93,232 C92,210 88,180 84,152 Z",
                    0
                  )}
                  {hindLeg(
                    "150px 120px",
                    "156px 178px",
                    "M146,116 C162,118 172,134 170,154 C168,168 163,174 162,180 L148,176 C152,164 148,158 142,146 C137,134 138,120 142,116 Z",
                    "M148,176 L162,180 C162,196 164,218 166,232 L156,232 C153,220 152,200 148,176 Z",
                    0
                  )}
                  <g
                    className="rd-part"
                    style={{
                      transformOrigin: "128px 126px",
                      animation: `rdArch ${cycle} linear infinite`,
                    }}
                  >
                    <path d="M72,128 C69,116 74,108 78,106 C86,100 96,97 106,99 C114,101 124,103 134,100 C152,95 166,91 175,96 C182,93 182,101 178,105 C184,121 180,141 168,149 C164,153 158,157 148,159 C130,163 108,161 90,154 C86,146 80,138 72,128 Z" />
                    <g fill="var(--deer-cream)">
                      <circle cx="116" cy="118" r="3" />
                      <circle cx="132" cy="124" r="2.4" />
                      <circle cx="150" cy="116" r="2.6" />
                    </g>
                  </g>
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>

      {labOpen && (
        <div
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 9999,
            width: 232,
            padding: "14px 16px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.94)",
            boxShadow: "0 8px 28px rgba(20,24,32,0.18)",
            font: "12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace",
            color: "#2b3240",
            display: "grid",
            gap: 8,
          }}
        >
          <strong style={{ letterSpacing: "0.08em" }}>DEER LAB</strong>
          {(
            [
              ["hopHeight", 0, 140, 2, "hop px"],
              ["height", 60, 340, 5, "size px"],
              ["crossSeconds", 4, 40, 1, "cross s"],
              ["cycleSeconds", 0.4, 2, 0.02, "bound s"],
              ["bottom", 0, 160, 2, "bottom px"],
            ] as const
          ).map(([key, min, max, step, label]) => (
            <label key={key} style={{ display: "grid", gap: 2 }}>
              <span>
                {label}: {String(v[key])}
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={Number(v[key])}
                onChange={(e) => setLabValue(key, Number(e.target.value))}
              />
            </label>
          ))}
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            colour
            <input
              type="color"
              value={v.color}
              onChange={(e) => setLabValue("color", e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() =>
              navigator.clipboard?.writeText(
                `<RunningDeer color="${v.color}" height={${v.height}} hopHeight={${v.hopHeight}} crossSeconds={${v.crossSeconds}} cycleSeconds={${v.cycleSeconds}} bottom={${v.bottom}} />`
              )
            }
            style={{
              padding: "6px 8px",
              border: "1px solid #cdd5e0",
              borderRadius: 5,
              background: "#fff",
              cursor: "pointer",
              font: "inherit",
            }}
          >
            copy props
          </button>
        </div>
      )}
    </>
  );
}
