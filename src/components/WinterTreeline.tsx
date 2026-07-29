/**
 * WinterTreeline — a winter forest edge fixed along the bottom of the viewport.
 * Uses the Claude-design tree artwork (tall spruce, squat fir, bare birch) with a
 * pale distance band, a snow drift, and full-colour foreground trees. Responsive:
 * spans the width at a controlled band height (no clipping / no stretching).
 * Purely decorative (pointer-events: none, aria-hidden). Pair with <RunningDeer />
 * at a higher zIndex so the deer bounds in front of the drift.
 */
import { useMemo, type CSSProperties } from "react";

const DEFAULT_COLORS = {
  near: "#5d7566",
  far: "#c2d2dc",
  ink: "#41352a",
  snow: "#f7f1e6",
  birch: "#efe7da",
};
type Colors = typeof DEFAULT_COLORS;

const CONIFA_TIERS = [
  "M38,118 C38,132 38,142 37,152 L53,152 C52,142 52,132 52,118 Z",
  "M45,60 C53,88 63,108 80,128 C62,136 28,136 10,128 C27,108 37,88 45,60 Z",
  "M45,30 C52,52 60,68 72,84 C58,90 32,90 18,84 C30,68 38,52 45,30 Z",
  "M45,4 C50,20 56,32 64,44 C56,48 34,48 26,44 C34,32 40,20 45,4 Z",
];
const CONIFA_SNOW = [
  "M10,128 C28,136 62,136 80,128 C77,121 71,127 64,126 C56,125 52,130 44,129 C36,128 32,123 24,124 C18,125 15,121 10,128 Z",
  "M18,84 C32,90 58,90 72,84 C69,78 64,84 57,83 C50,82 46,86 39,85 C33,84 29,79 24,81 C21,82 20,78 18,84 Z",
  "M26,44 C34,48 56,48 64,44 C61,39 56,44 50,43 C44,42 40,45 34,44 C30,43 29,40 26,44 Z",
  "M45,4 C48,11 49,14 48,17 C46,19 43,18 42,16 C41,12 43,8 45,4 Z",
];
const CONIFB_TIERS = [
  "M46,106 C46,114 46,120 45,124 L59,124 C58,120 58,114 58,106 Z",
  "M52,44 C60,74 72,94 94,112 C74,120 30,120 10,112 C32,94 44,74 52,44 Z",
  "M52,10 C58,34 66,50 80,66 C64,74 40,74 24,66 C38,50 46,34 52,10 Z",
];
const CONIFB_SNOW = [
  "M10,112 C30,120 74,120 94,112 C90,105 83,111 74,110 C64,109 58,114 48,113 C38,112 32,106 24,107 C18,108 15,105 10,112 Z",
  "M24,66 C40,74 64,74 80,66 C76,60 70,66 62,65 C54,64 50,68 42,67 C36,66 30,61 24,66 Z",
  "M52,10 C56,18 57,22 55,25 C52,27 48,26 47,23 C46,19 49,15 52,10 Z",
];
const BIRCH_BARK = [
  "M40,52 C32,44 24,38 13,34 L15,29 C26,33 34,40 43,48 Z",
  "M45,40 C52,32 60,26 70,21 L72,26 C62,30 54,36 48,44 Z",
  "M39,80 C31,74 22,70 11,68 L12,63 C24,65 33,69 42,76 Z",
  "M46,68 C53,62 61,58 69,55 L71,60 C62,62 55,66 49,72 Z",
  "M36,150 C34,120 34,90 37,58 C38,40 40,24 42,6 L51,6 C49,26 47,44 46,60 C44,92 45,122 47,150 Z",
];
const BIRCH_TICKS = [
  "M38,112 C41,110 44,111 46,113 L38,116 Z",
  "M38,92 C41,90 43,91 45,93 L37,96 Z",
  "M39,132 C42,130 45,131 47,133 L39,136 Z",
  "M41,30 C43,29 45,30 46,31 L41,33 Z",
];
const BIRCH_SNOW = [
  "M13,32 C20,33 28,37 35,42 C30,46 24,42 18,39 C14,37 11,36 13,32 Z",
  "M71,19 C73,23 69,25 63,28 C57,31 52,35 48,40 C46,35 54,28 62,23 C66,20 69,18 71,19 Z",
  "M11,66 C18,67 26,70 33,74 C29,78 23,75 17,72 C13,70 10,70 11,66 Z",
];
const ASPECT: Record<string, number> = {
  conifA: 90 / 152, conifB: 104 / 124, birch: 84 / 150, conifA_s: 90 / 152, conifB_s: 104 / 124,
};
const SNOW_BANK =
  "M0,200 C180,192 320,204 500,198 C680,192 840,203 1040,197 C1240,191 1400,201 1600,196 L1600,220 L0,220 Z";

function buildScene(c: Colors) {
  const paths = (arr: string[]) => arr.map((d) => `<path d="${d}"/>`).join("");
  const defs = `<defs>
    <symbol id="conifA" viewBox="0 0 90 152">${paths(CONIFA_TIERS)}<g fill="${c.snow}" stroke="none">${paths(CONIFA_SNOW)}</g></symbol>
    <symbol id="conifB" viewBox="0 0 104 124">${paths(CONIFB_TIERS)}<g fill="${c.snow}" stroke="none">${paths(CONIFB_SNOW)}</g></symbol>
    <symbol id="birch" viewBox="0 0 84 150"><g fill="${c.birch}" stroke="${c.ink}" stroke-width="1.6" stroke-linejoin="round">${paths(BIRCH_BARK)}</g><g fill="${c.ink}" stroke="none" opacity="0.72">${paths(BIRCH_TICKS)}</g><g fill="${c.snow}" stroke="none">${paths(BIRCH_SNOW)}</g></symbol>
    <symbol id="conifA_s" viewBox="0 0 90 152">${paths(CONIFA_TIERS)}</symbol>
    <symbol id="conifB_s" viewBox="0 0 104 124">${paths(CONIFB_TIERS)}</symbol>
  </defs>`;
  const use = (shape: string, cx: number, baseY: number, h: number) => {
    const w = h * ASPECT[shape];
    return `<use href="#${shape}" x="${(cx - w / 2).toFixed(1)}" y="${(baseY - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/>`;
  };

  const farSpecs: Array<[string, number, number, number]> = [];
  for (let i = 0; i < 14; i++) {
    farSpecs.push([i % 2 === 0 ? "conifA_s" : "conifB_s", 44 + i * 114 + (i % 3) * 12, 196, 56 + (i % 4) * 7]);
  }
  const far = `<g fill="${c.far}" stroke="none" opacity="0.8">${farSpecs.map((s) => use(...s)).join("")}</g>`;

  const nearSpecs: Array<[string, number, number, number]> = [
    ["conifA", 150, 210, 128], ["conifB", 300, 210, 104], ["birch", 430, 210, 120],
    ["conifA", 980, 210, 132], ["conifB", 1120, 210, 100], ["birch", 1258, 210, 112], ["conifA", 1430, 210, 122],
  ];
  const near = `<g fill="${c.near}" stroke="${c.ink}" stroke-width="1.8" stroke-linejoin="round" paint-order="stroke">${nearSpecs.map((s) => use(...s)).join("")}</g>`;

  return defs + far + `<path d="${SNOW_BANK}" fill="${c.snow}"/>` + near;
}

export default function WinterTreeline({
  zIndex = 20,
  height = 172,
  colors,
}: {
  zIndex?: number;
  height?: number;
  colors?: Partial<Colors>;
}) {
  const c = { ...DEFAULT_COLORS, ...colors };
  const scene = useMemo(() => buildScene(c), [c.near, c.far, c.ink, c.snow, c.birch]);
  const wrap: CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    height,
    zIndex,
    pointerEvents: "none",
    overflow: "hidden",
  };
  return (
    <div style={wrap} aria-hidden="true">
      <svg
        viewBox="0 0 1600 220"
        preserveAspectRatio="xMidYMax slice"
        style={{ width: "100%", height: "100%", display: "block" }}
        dangerouslySetInnerHTML={{ __html: scene }}
      />
    </div>
  );
}
