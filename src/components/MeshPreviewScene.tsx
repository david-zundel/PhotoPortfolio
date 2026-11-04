import { useEffect, useRef, useState } from "react";

/**
 * PREVIEW ONLY — not part of the site. Renders the tulip photo as rebuilt by
 * 3D Photo Inpainting (vt-vl-lab, CVPR 2020), from public/preview-3dp/ (which
 * is excluded from git). Mounted only by the dev server with `?3dp` in the URL.
 *
 * The mesh is the 1920px 3DP output after offline packing (pack.mjs): reduced
 * from 27.5M to ~4.9M triangles at half-pixel screen error with every outline
 * locked, quantised to 12 bytes per vertex and compressed with meshoptimizer —
 * 439 MB down to ~15 MB.
 *
 * Colour comes from two sources: the full-resolution photograph where 3DP kept
 * the original pixel (vertex alpha 0), and 3DP's own colour where it invented
 * content or recoloured a pixel at a depth edge (alpha 255).
 *
 * The camera orbits exactly as GardenDepthScene does.
 */

type Meta = {
  nv: number; nt: number; W: number; H: number; f: number;
  z0: number; z1: number; tanX: number; tanY: number; tx0: number; ty0: number;
};
type Decoder = {
  ready: Promise<void>;
  decodeVertexBuffer(t: Uint8Array, count: number, size: number, src: Uint8Array): void;
  decodeIndexBuffer(t: Uint8Array, count: number, size: number, src: Uint8Array): void;
};

const VERT = `#version 300 es
layout(location = 0) in vec2 aPix;   // position on a 1/8-pixel grid (3DP vertices sit on pixel centres)
layout(location = 1) in float aZ;    // distance, 16-bit, 0..1 over [uZ.x, uZ.y]
layout(location = 2) in vec4 aC;     // 3DP's colour (used only where the photo cannot be)
uniform mat4 uMVP; uniform vec2 uHalf; uniform float uF; uniform vec2 uZ;
out vec3 vC; out float vOwn; out vec3 vPos;
void main() {
  vec2 ray = (aPix / 8.0 - uHalf) / uF;            // OpenCV convention: y down
  float z = mix(uZ.x, uZ.y, aZ);
  vC = aC.rgb; vOwn = aC.a;
  vPos = vec3(ray.x * z, -ray.y * z, -z);
  gl_Position = uMVP * vec4(vPos, 1.0);
}`;

/* Which colour a fragment gets is decided per PIXEL, by visibility:
   anything that can be seen from the photograph's own viewpoint IS the
   photograph, so it is painted from it; only surfaces hidden in the original
   shot — the ones a rotation uncovers — use 3DP's invented colour. uRest is a
   depth map rendered once from that original viewpoint.
   The first version decided per VERTEX (does 3DP's stored colour still match
   the photo?) and blended across each triangle. 3DP recolours a band around
   every depth edge, and after mesh reduction those triangles are large, so
   24.6% of the resting view came out in 3DP's softened colours — measured,
   and it read as "generated". Visibility makes the resting view the photo by
   construction.
   The photo coordinate is also computed per pixel from the exact 3D point,
   not interpolated from the vertices, which on large triangles drifted. */
const FRAG = `#version 300 es
precision highp float; in vec3 vC; in float vOwn; in vec3 vPos;
uniform sampler2D uTex; uniform highp sampler2D uRest; uniform highp sampler2D uZmin; uniform highp sampler2D uZmax;
uniform sampler2D uPush; uniform sampler2D uExt; uniform vec2 uT0; uniform vec2 uNF; uniform ivec2 uRestSize; uniform int uMode;
uniform float uHaveRest; uniform float uSharp; uniform float uDebug; uniform float uSettle; uniform float uNoExt; uniform float uNoBand; uniform float uMirror; uniform sampler2D uBehind; uniform float uHaveBehind; out vec4 o;
float lin(float d) { return 2.0 * uNF.x * uNF.y / (uNF.y + uNF.x - (2.0 * d - 1.0) * (uNF.y - uNF.x)); }
float zAt(highp sampler2D s, ivec2 t) { return lin(texelFetch(s, clamp(t, ivec2(0), uRestSize - 1), 0).r); }
float seen(float z, float zr) { return 1.0 - smoothstep(zr * 1.004, zr * 1.012, z); }
vec3 photoAt(vec2 at, vec2 uv) {
  // gradients from the unshifted coordinate, so an offset jump never tricks
  // the GPU into a blurry mip; 0.76 = the slight sharpening bias (2^-0.4)
  return textureGrad(uTex, clamp(at, 0.0, 1.0), dFdx(uv) * 0.76, dFdy(uv) * 0.76).rgb;
}
void main() {
  float z = -vPos.z;
  vec2 uv = 0.5 + (vPos.xy / z) / (2.0 * uT0);     // where this point sits in the original photo
  bool inFrame = all(greaterThanEqual(uv, vec2(0.0))) && all(lessThanEqual(uv, vec2(1.0)));
  vec3 photo = photoAt(uv, uv);
  vec3 c; float dbgHidden = 0.0, dbgBand = 0.0;
  if (uHaveRest > 0.5 && uMode > 0 && inFrame) {
    vec2 tc = uv * vec2(uRestSize);
    ivec2 t = ivec2(tc);
    /* SETTLED (uSettle = 1): exactly the photograph. Anything visible from the
       original viewpoint is painted from it; a 3x3 neighbourhood keeps pixels
       right at a flower's edge from being wrongly called hidden. */
    vec3 cRest = photo;
    if (uSettle > 0.0) cRest = mix(photo, vC, 1.0 - seen(z, zAt(uZmax, t)));
    /* DRAGGING (uSettle = 0): one fixed rule for the whole drag, so swinging
       through the centre changes nothing.
       hidden — exact (percentage-closer filtering over the 2x2 footprint):
         3DP's invented colour.
       band — far side of a depth edge. Those photo pixels carry the nearer
         flower's colour and would leave a light ghost of it; 3DP's colour
         there carries the same glow. Painted instead from the photo a few
         pixels further out along the direction away from the flower — past
         the glow, same background (offset precomputed in uPush). */
    vec3 cMove = photo;
    if (uSettle < 1.0) {
      vec2 g = tc - 0.5; ivec2 b = ivec2(floor(g)); vec2 f = fract(g);
      float hid = 1.0 - mix(mix(seen(z, zAt(uRest, b)), seen(z, zAt(uRest, b + ivec2(1, 0))), f.x),
                            mix(seen(z, zAt(uRest, b + ivec2(0, 1))), seen(z, zAt(uRest, b + ivec2(1, 1))), f.x), f.y);
      vec3 bg = photo;
      if (uNoBand < 0.5 && zAt(uZmin, t) < z * 0.97) {
        dbgBand = 1.0;
        vec2 off = (texelFetch(uPush, t, 0).rg - 0.5) * 32.0;
        bg = dot(off, off) > 0.25 ? photoAt(uv + off / vec2(uRestSize), uv) : vC;
      }
      // uncovered right behind a flower: clean background extended from the
      // photo, fading to 3DP's invented colour deeper in (28-44 texels)
      // what is behind the flowers: the clean plate (behind.webp, painted by LaMa) when the scene
      // has one, else the mesh's own fill colour
      vec3 fill = uHaveBehind > 0.5 ? textureGrad(uBehind, clamp(uv, 0.0, 1.0), dFdx(uv) * 0.76, dFdy(uv) * 0.76).rgb : vC;
      if (hid > 0.0 && uNoExt < 0.5) {
        vec2 eo = (texelFetch(uExt, t, 0).rg - 0.5) * 128.0;
        float el = length(eo);
        if (el > 0.5) fill = mix(photoAt(uv + eo / vec2(uRestSize), uv), vC, smoothstep(28.0, 44.0, el));
      }
      cMove = mix(bg, fill, hid);
      dbgHidden = hid;
    }
    c = mix(cMove, cRest, uSettle);
  } else if (uHaveRest > 0.5 && uMode > 0) {
    // outside the photo's frame: 3DP's own colour, or (our scenes) the photo mirrored at its edge,
    // which stays sharp instead of the dark blur the simplified border mesh carried
    // (sharp at the edge, softer farther out so the reflection's symmetry doesn't show)
    vec2 m = 1.0 - abs(1.0 - abs(uv));
    vec2 out2 = max(-uv, uv - 1.0) * vec2(1920.0, 1280.0);
    float k = 0.76 * min(exp2(max(max(out2.x, out2.y), 0.0) / 20.0), 48.0);
    c = uMirror > 0.5 ? textureGrad(uTex, m, dFdx(uv) * k, dFdy(uv) * k).rgb : vC;
  } else {
    c = mix(photo, vC, vOwn);                         // fallback: the old per-vertex rule
  }
  if (uSharp < 0.5) c = vC;                           // ?3dp=raw
  // &own: magenta = revealed (3DP's invented colour), cyan = edge band (dragging only)
  if (uDebug > 0.5) {
    float m = 1.0 - uSettle;
    c = mix(c, vec3(1.0, 0.0, 1.0), clamp(dbgHidden, 0.0, 1.0) * 0.75 * m);
    c = mix(c, vec3(0.0, 1.0, 1.0), clamp(dbgBand - dbgHidden, 0.0, 1.0) * 0.6 * m);
  }
  o = vec4(c, 1.0);
}`;
/* For each texel on the far side of a depth edge: the direction straight
   AWAY from the nearer object (weighted sum over a 25x25 window, every other texel, so neighbours
   get near-identical directions and the fill reads as a smooth continuation
   of the background rather than blocks), then the first step along it that
   is past the glow — not itself in the band — and not nearer (up to 28). Directions that
   run into the nearer object give no offset (3DP's colour is used there).
   Stored as an offset in an RGBA8 texture, built once at load. */
const PUSH_FRAG = `#version 300 es
precision highp float; uniform highp sampler2D uRest; uniform highp sampler2D uZmin; uniform ivec2 uSize; uniform vec2 uNF; out vec4 o;
float lin(float d) { return 2.0 * uNF.x * uNF.y / (uNF.y + uNF.x - (2.0 * d - 1.0) * (uNF.y - uNF.x)); }
float zr(ivec2 p) { return lin(texelFetch(uRest, clamp(p, ivec2(0), uSize - 1), 0).r); }
float zn(ivec2 p) { return lin(texelFetch(uZmin, clamp(p, ivec2(0), uSize - 1), 0).r); }
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  float z = zr(p);
  vec2 off = vec2(0.0);
  if (zn(p) < z * 0.97) {
    vec2 away = vec2(0.0);
    for (int j = -12; j <= 12; j += 2) for (int i = -12; i <= 12; i += 2) {
      if (zr(p + ivec2(i, j)) < z * 0.97) { vec2 v = -vec2(float(i), float(j)); away += v / max(dot(v, v), 1.0); }
    }
    if (dot(away, away) > 1e-6) {
      vec2 dir = normalize(away);
      for (int s = 1; s <= 28; s++) {
        ivec2 q = p + ivec2(round(dir * float(s)));
        float zq = zr(q);
        if (zq < z * 0.97) break;
        if (zn(q) >= zq * 0.97) { off = dir * float(s); break; }
      }
    }
  }
  o = vec4(off / 32.0 + 0.5, 0.0, 1.0);
}`;
/* For each texel on the NEAR side of a depth edge (a flower, as seen from the
   photo's viewpoint): the shortest step, in 8 directions up to 44 texels,
   across the edge to background that is farther AND clean (past the glow).
   Points uncovered right behind a flower when the camera moves project onto
   these texels; 3DP's invented colour there carries the flower's glow (it was
   built from the same contaminated edge pixels), which drew a light dotted
   trace of every flower's outline. They take this clean background instead. */
const EXT_FRAG = `#version 300 es
precision highp float; uniform highp sampler2D uRest; uniform highp sampler2D uZmin; uniform ivec2 uSize; uniform vec2 uNF; out vec4 o;
float lin(float d) { return 2.0 * uNF.x * uNF.y / (uNF.y + uNF.x - (2.0 * d - 1.0) * (uNF.y - uNF.x)); }
float zr(ivec2 p) { return lin(texelFetch(uRest, clamp(p, ivec2(0), uSize - 1), 0).r); }
float zn(ivec2 p) { return lin(texelFetch(uZmin, clamp(p, ivec2(0), uSize - 1), 0).r); }
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  float z = zr(p);
  vec2 off = vec2(0.0); float best = 1e9;
  for (int k = 0; k < 8; k++) {
    vec2 dir = vec2(cos(float(k) * 0.785398), sin(float(k) * 0.785398));
    bool crossed = false; float h0 = z, h1 = z, h2 = z;   // depths 1-3 steps back
    for (int s = 1; s <= 44; s++) {
      if (float(s) >= best) break;
      ivec2 q = p + ivec2(round(dir * float(s)));
      float zq = zr(q);
      // the edge is a JUMP in depth (within 3 steps), not a gentle slope: a long
      // subject leaning away (the deer's tail) is >3% farther at its tip, and
      // counting that as "behind" painted the revealed background with tail
      if (!crossed) { if (zq > min(h0, min(h1, h2)) * 1.03) crossed = true; else { h2 = h1; h1 = h0; h0 = zq; continue; } }
      if (zq < z * 1.03) break;                         // came back onto something as near: give up
      if (zn(q) >= zq * 0.97) { best = float(s); off = vec2(q - p); break; }   // clean background
    }
  }
  o = vec4(off / 128.0 + 0.5, 0.0, 1.0);
}`;
const REST_FRAG = `#version 300 es
precision mediump float; out vec4 o; void main() { o = vec4(1.0); }`;
const REST_NF = [0.5, 10.0];
/* One-dimensional min or max over the original-viewpoint depth map, written
   straight into another depth texture through gl_FragDepth (no float colour
   targets needed). Run twice (across, then down) it gives a square window.
   These maps never change, so they are built once at load instead of being
   re-derived per pixel every frame — that cut the per-pixel work from ~29
   depth lookups to 5 and is what keeps dragging smooth. */
const FILTER_VERT = `#version 300 es
void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
const FILTER_FRAG = `#version 300 es
precision highp float; uniform highp sampler2D uSrc; uniform ivec2 uSize; uniform ivec2 uDir; uniform int uR; uniform int uOp;
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  float v = uOp == 0 ? 1.0 : 0.0;
  for (int k = -12; k <= 12; k++) {
    if (k < -uR || k > uR) continue;
    float d = texelFetch(uSrc, clamp(p + uDir * k, ivec2(0), uSize - 1), 0).r;
    v = uOp == 0 ? min(v, d) : max(v, d);
  }
  gl_FragDepth = v;
}`;   // near/far of the depth pass; every scene sits within ~1..5

/* Soft subject layer (?3dp=deerfur). A depth mesh can only say "this pixel is
   deer" or "this pixel is background", but a hair pixel is both: part white
   hair, part green forest. So the subject's outline is drawn as its own
   see-through layer from an alpha matte (ViTMatte, re-solved at the photo's
   full resolution): colour = the un-mixed hair colour, opacity = the matte,
   placed at the subject's depth and blended over the mesh. The photo texture
   carries the un-mixed background in that band, so at rest
   matte x hair + (1 - matte) x background is exactly the photograph, and while
   dragging the hair travels with the deer and the forest shows between. */
const FUR_VERT = `#version 300 es
layout(location = 0) in vec3 aUVZ;   // position in the photo (0..1, y down) + distance
uniform mat4 uMVP; uniform vec2 uHalf; uniform float uF; uniform vec2 uSize;
out vec3 vPos;
void main() {
  vec2 ray = (aUVZ.xy * uSize - uHalf) / uF;
  float z = aUVZ.z;
  vPos = vec3(ray.x * z, -ray.y * z, -z);
  gl_Position = uMVP * vec4(vPos, 1.0);
  /* Win the depth test against the mesh's own copy of the subject with a small depth bias
     (~1% of the distance at z~2) instead of moving the layer 1% closer: being closer also made
     it shift 1% more while dragging (~3 px at a full drag), which opened a dark gap between a
     crisp petal and its soft edge. */
  gl_Position.z -= 0.0005 * gl_Position.w;
}`;
const FUR_FRAG = `#version 300 es
precision highp float; in vec3 vPos;
uniform sampler2D uFur; uniform vec2 uT0; uniform vec4 uBox; out vec4 o;
void main() {
  vec2 uv = 0.5 + (vPos.xy / -vPos.z) / (2.0 * uT0);   // same photo mapping as the main pass
  o = texture(uFur, (uv - uBox.xy) / uBox.zw);           // premultiplied at upload
}`;

/* Builds the switcher offers, in display order (folder under public/preview-3dp/). */
const SCENES = [
  { v: "", label: "Tulips" }, { v: "tulipshd", label: "Tulips · tiled depth" }, { v: "tulipssam", label: "Tulips · SAM 2" },
  { v: "oursmesh", label: "Tulips · our mesh" },
  { v: "ourssoft", label: "Tulips · soft edges" },
  { v: "deer", label: "Deer" }, { v: "deerhd", label: "Deer · tiled depth" }, { v: "deersam", label: "Deer · SAM 2" },
  { v: "deerfur", label: "Deer · soft fur" },
  { v: "oursdeer", label: "Deer · our mesh" },
  /* Apple SHARP experiment (research-licence model): a separate splat viewer page */
  { v: "sharp-tulips", label: "Tulips · Apple SHARP", page: "preview-3dp/sharp/index.html?scene=tulips", check: "preview-3dp/sharp/tulips.json" },
  { v: "sharp-full-tulips", label: "Tulips · SHARP + full photo", page: "preview-3dp/sharp/index.html?scene=sharp_full_tulips", check: "preview-3dp/sharp/sharp_full_tulips.json" },
  { v: "ours-tulips", label: "Tulips · our splat", page: "preview-3dp/sharp/index.html?scene=ours_tulips", check: "preview-3dp/sharp/ours_tulips.json" },
  { v: "ours-tulips-hd", label: "Tulips · our splat HD", page: "preview-3dp/sharp/index.html?scene=ours_tulips_hd", check: "preview-3dp/sharp/ours_tulips_hd.json" },
  { v: "sharp-deer", label: "Deer · Apple SHARP", page: "preview-3dp/sharp/index.html?scene=deer", check: "preview-3dp/sharp/deer.json" },
] as { v: string; label: string; page?: string; check?: string }[];

function perspective(fovy: number, a: number, n: number, f: number) {
  const t = 1 / Math.tan(fovy / 2), nf = 1 / (n - f);
  return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0];
}
const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: number[], b: number[]) =>
  [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: number[]) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
function lookAt(e: number[], c: number[], u: number[]) {
  const z = norm(sub(e, c)), x = norm(cross(u, z)), y = cross(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1];
}
function mul(a: number[], b: number[]) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
    for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}

export default function MeshPreviewScene({ zIndex = -1, swing = 5.5 }: { zIndex?: number; swing?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Loading 3D Photo Inpainting preview…");

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: true });
    if (!gl) { setStatus("WebGL2 unavailable"); return; }
    let alive = true, raf = 0, running = false, last = 0, moving = false;
    /* 0 while the mouse is down and the scene is gliding home, 1 once it has
       settled. The colouring rule switches on THIS, not on camera position,
       so swinging back and forth through the centre never changes anything;
       after release it crossfades to the exact photograph over 0.25s. */
    let settle = 1, fadeRaf = 0, fadeLast = 0;
    const SETTLE_S = 0.25, SETTLE_IN_S = 0.2;
    let tx = 0, ty = 0, cx = 0, cy = 0, aspect = 1, meta: Meta | null = null, count = 0;

    const mk = (t: number, s: string) => { const h = gl.createShader(t)!; gl.shaderSource(h, s); gl.compileShader(h); return h; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uMVP = U("uMVP"), uSettle = U("uSettle");
    let fur: { prog: WebGLProgram; vao: WebGLVertexArrayObject; n: number; mvp: WebGLUniformLocation | null } | null = null;
    /* ?3dp            -> tulips (files at the root of public/preview-3dp/)
       ?3dp=deer       -> public/preview-3dp/deer/
       ?3dp=raw / &raw -> 3DP's own colours instead of the full-res photo */
    const q = new URLSearchParams(window.location.search);
    /* &swing=4 tries a smaller drag range (degrees at full drag; default 5.5) */
    const sw = Math.min(10, Math.max(1, Number(q.get("swing")) || swing));
    const v = q.get("3dp") ?? "";
    const sharp = !(v === "raw" || q.has("raw"));
    const scene = v !== "raw" && /^[a-z0-9_-]+$/.test(v) ? v : "";
    const debugOwn = q.has("own");
    const holesDbg = q.has("holes");
    gl.uniform1f(U("uSharp"), sharp ? 1 : 0);
    gl.uniform1i(U("uTex"), 0);
    gl.uniform1f(U("uDebug"), debugOwn ? 1 : 0);
    /* Photo-based fill right behind a flower (the background continued from the photo itself).
       It was off for our mesh for a while (on the older 1920-grid mesh it copied stems); on the
       current mesh it is what makes uncovered areas look real, so it is on everywhere again.
       &noext turns it off for comparison. */
    /* Soft-edge scenes (ourssoft...) take the flower's glow out of the background when the edges
       are split, so neither renderer fill is needed there, and both painted copies of nearby stems
       and flowers into uncovered gaps (striped yellow bits, speckled stems). &fills turns them on. */
    const softScene = scene.startsWith("ourssoft") && !q.has("fills");
    gl.uniform1f(U("uNoExt"), q.has("noext") || softScene ? 1 : 0);
    /* The edge band (background right behind a flower repainted from a few px further out, so the
       flower's bright rim is not left behind on the background) stays on for every scene;
       &noband turns it off for comparison. */
    gl.uniform1f(U("uNoBand"), q.has("noband") || softScene ? 1 : 0);
    gl.uniform1f(U("uMirror"), scene.startsWith("ours") && !q.has("nomirror") ? 1 : 0);   // &nomirror: old border
    gl.enable(gl.DEPTH_TEST);

    /* Resolution: full device pixels at rest (so the photo's detail shows on a
       Retina screen), 1x while moving, where the difference is invisible and
       the fill cost is a quarter. The switch happens in the same task as a
       draw, so there is never a blank frame. */
    const fullDpr = Math.min(window.devicePixelRatio || 1, 2);
    /* Resolution while dragging. It used to drop to 1x, which made the whole picture
       go soft the moment a drag began (on a Retina screen, half the detail of the
       still photo). Full resolution now costs ~11 ms a frame on an M3 Pro (1x: ~8),
       so it stays. &movedpr=1 restores the old behaviour for comparison. */
    const moveDpr = Math.min(fullDpr, Math.max(1, Number(q.get("movedpr")) || fullDpr));
    const setSize = (dpr: number) => {
      const w = Math.round(window.innerWidth * dpr), h = Math.round(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      aspect = window.innerWidth / window.innerHeight;
    };
    const draw = () => {
      if (!meta) return;
      const tanY = aspect > meta.tanX / meta.tanY ? meta.tanX / aspect : meta.tanY;   // cover-fit
      const zP = -2.2, R = 2.2, th = (cx * sw * Math.PI) / 180, ph = (-cy * sw * Math.PI) / 180;
      const eye = [R * Math.sin(th) * Math.cos(ph), R * Math.sin(ph), zP + R * Math.cos(th) * Math.cos(ph)];
      const mvp = new Float32Array(mul(perspective(2 * Math.atan(tanY), aspect, 0.05, 50), lookAt(eye, [0, 0, zP], [0, 1, 0])));
      gl.uniformMatrix4fv(uMVP, false, mvp);
      gl.uniform1f(uSettle, settle);
      if (holesDbg) gl.clearColor(1, 0, 1, 1); else gl.clearColor(0.06, 0.07, 0.06, 1);   // &holes: gaps in magenta
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, 0);
      if (fur) {   // see-through layer last: blended, tested against the mesh, never writing depth
        gl.useProgram(fur.prog); gl.uniformMatrix4fv(fur.mvp, false, mvp); gl.bindVertexArray(fur.vao);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.depthFunc(gl.LEQUAL);
        gl.drawElements(gl.TRIANGLES, fur.n, gl.UNSIGNED_INT, 0);
        gl.disable(gl.BLEND); gl.depthMask(true); gl.depthFunc(gl.LESS);
        gl.bindVertexArray(null); gl.useProgram(prog);
      }
    };
    const resize = () => { setSize(moving ? moveDpr : fullDpr); draw(); };

    /* Easing is by elapsed TIME, not per frame. The card scene's per-frame 8%
       felt fine at 60fps, but on a heavy frame it stretches out and the scene
       trails the mouse. Tight while dragging, gentler on the way back. */
    const TAU_DRAG = 0.045, TAU_HOME = 0.22;
    let dragging = false;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      // ease INTO the dragging look as well (0.2 s), so the photo doesn't switch
      // to the 3D model's edges in a single frame when a drag starts
      if (settle > 0) settle = Math.max(0, settle - dt / SETTLE_IN_S);
      const k = 1 - Math.exp(-dt / (dragging ? TAU_DRAG : TAU_HOME));
      cx += (tx - cx) * k; cy += (ty - cy) * k;
      if (Math.abs(tx - cx) > 0.0008 || Math.abs(ty - cy) > 0.0008) { draw(); raf = requestAnimationFrame(tick); return; }
      cx = tx; cy = ty; running = false;
      if (dragging) { draw(); return; }          // holding still mid-drag: stop drawing
      moving = false; setSize(fullDpr);          // released and home: full resolution, then
      fadeLast = performance.now(); draw();      // crossfade to the exact photograph
      fadeRaf = requestAnimationFrame(fade);
    };
    const fade = (now: number) => {
      if (moving) return;
      settle = Math.min(1, settle + (now - fadeLast) / 1000 / SETTLE_S); fadeLast = now; draw();
      if (settle < 1) fadeRaf = requestAnimationFrame(fade);
    };
    const kick = () => {
      if (running || !meta) return;
      running = true;
      cancelAnimationFrame(fadeRaf);                 // settle eases down in tick()
      if (!moving) { moving = true; setSize(moveDpr); draw(); }
      last = performance.now(); raf = requestAnimationFrame(tick);
    };

    const root = document.documentElement;
    let sx = 0, sy = 0, bx = 0, by = 0, prevSel = "";
    const REACH = 0.35;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      if ((e.target as HTMLElement | null)?.closest("a, button, input, textarea, select, [role='button']")) return;
      dragging = true; prevSel = root.style.userSelect; root.style.userSelect = "none";
      sx = e.clientX; sy = e.clientY; bx = tx; by = ty;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      tx = Math.max(-1, Math.min(1, bx + (e.clientX - sx) / (window.innerWidth * REACH)));
      ty = Math.max(-1, Math.min(1, by + (e.clientY - sy) / (window.innerHeight * REACH)));
      kick();
    };
    const up = () => {
      if (!dragging) return;
      dragging = false; root.style.userSelect = prevSel; tx = 0; ty = 0;
      if (moving || cx !== 0 || cy !== 0) kick();   // a plain click changes nothing
    };

    const assets = `${import.meta.env.BASE_URL}preview-3dp/`;
    const dir = scene ? `${assets}${scene}/` : assets;
    const bin = (url: string) => fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url.split("/").pop()}: HTTP ${r.status}`);
      return r.arrayBuffer();
    });
    const isJson = (r: Response) => r.ok && (r.headers.get("content-type") ?? "").includes("json");
    (async () => {
      try {
        const t0 = performance.now();
        let name = "";
        for (const n of ["p1920", "p960"]) { if (isJson(await fetch(dir + n + ".json"))) { name = n; break; } }
        if (!name) throw new Error(`no packed mesh in public/preview-3dp/${scene ? scene + "/" : ""}`);
        const m: Meta = await (await fetch(dir + name + ".json")).json();
        const photoP = new Promise<HTMLImageElement>((res, rej) => {
          const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error("photo.webp missing")); im.src = dir + "photo.webp";
        });
        const decP = import(/* @vite-ignore */ `${assets}meshopt_decoder.mjs`).then(async (mod) => {
          const d = mod.MeshoptDecoder as Decoder; await d.ready; return d;
        });
        const [mv, mi, dec, photo] = await Promise.all([bin(dir + name + ".mv"), bin(dir + name + ".mi"), decP, photoP]);
        if (!alive) return;
        const verts = new Uint8Array(m.nv * 12), idx = new Uint32Array(m.nt * 3);
        dec.decodeVertexBuffer(verts, m.nv, 12, new Uint8Array(mv));
        dec.decodeIndexBuffer(new Uint8Array(idx.buffer), idx.length, 4, new Uint8Array(mi));

        const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
        // fixed locations (layout qualifiers), shared by the main and depth programs
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.SHORT, false, 12, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.UNSIGNED_SHORT, true, 12, 4);
        gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 12, 8);
        const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

        const tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, photo);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.uniform2f(U("uHalf"), m.W / 2, m.H / 2); gl.uniform1f(U("uF"), m.f);
        gl.uniform2f(U("uZ"), m.z0, m.z1); gl.uniform2f(U("uT0"), m.tx0, m.ty0);
        count = idx.length; meta = m;

        /* Depth from the photograph's own viewpoint, rendered once. Twice the
           mesh resolution so the band of 3DP colour along each edge stays
           under a pixel. If the depth target is unavailable, fall back to the
           per-vertex rule rather than failing. */
        let haveRest = false;
        const restProg = gl.createProgram()!;
        gl.attachShader(restProg, mk(gl.VERTEX_SHADER, VERT));
        gl.attachShader(restProg, mk(gl.FRAGMENT_SHADER, REST_FRAG));
        gl.linkProgram(restProg);
        if (gl.getProgramParameter(restProg, gl.LINK_STATUS)) {
          const RW = Math.min(4096, m.W * 2), RH = Math.round(RW * m.ty0 / m.tx0);
          const restTex = gl.createTexture();
          gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, restTex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, RW, RH, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          const fb = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, restTex, 0);
          gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
          if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
            gl.useProgram(restProg);
            const R = (n: string) => gl.getUniformLocation(restProg, n);
            // the original camera: at the origin, looking down -z, framing exactly the photo
            gl.uniformMatrix4fv(R("uMVP"), false, new Float32Array(
              perspective(2 * Math.atan(m.ty0), m.tx0 / m.ty0, REST_NF[0], REST_NF[1])));
            gl.uniform2f(R("uHalf"), m.W / 2, m.H / 2); gl.uniform1f(R("uF"), m.f); gl.uniform2f(R("uZ"), m.z0, m.z1);
            gl.viewport(0, 0, RW, RH); gl.clearDepth(1); gl.clear(gl.DEPTH_BUFFER_BIT);
            gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, 0);
            haveRest = true;

            const depthTex = (unit: number) => {
              const tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tx);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, RW, RH, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
              for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST],
                [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
              return tx;
            };
            const tmp = depthTex(4), zMin = depthTex(2), zMax = depthTex(3);
            const fp = gl.createProgram()!;
            gl.attachShader(fp, mk(gl.VERTEX_SHADER, FILTER_VERT)); gl.attachShader(fp, mk(gl.FRAGMENT_SHADER, FILTER_FRAG));
            gl.linkProgram(fp);
            if (gl.getProgramParameter(fp, gl.LINK_STATUS)) {
              gl.useProgram(fp);
              const F = (n: string) => gl.getUniformLocation(fp, n);
              gl.uniform2i(F("uSize"), RW, RH);
              gl.depthFunc(gl.ALWAYS);
              const pass = (src: WebGLTexture | null, srcUnit: number, dst: WebGLTexture | null, dx: number, dy: number, r: number, op: number) => {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, dst, 0);
                gl.activeTexture(gl.TEXTURE0 + srcUnit); gl.bindTexture(gl.TEXTURE_2D, src);
                gl.uniform1i(F("uSrc"), srcUnit); gl.uniform2i(F("uDir"), dx, dy); gl.uniform1i(F("uR"), r); gl.uniform1i(F("uOp"), op);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
              };
              // nearest within 12 texels: the band. Measured on the tulip photo, the
              // petals' glow reaches ~4px past the edge at 2048 wide (8 texels here),
              // further on out-of-focus petals; a 4-texel band left half of it in.
              pass(restTex, 1, tmp, 1, 0, 12, 0); pass(tmp, 4, zMin, 0, 1, 12, 0);
              pass(restTex, 1, tmp, 1, 0, 1, 1); pass(tmp, 4, zMax, 0, 1, 1, 1);   // farthest within 1 texel
              gl.depthFunc(gl.LESS);
              // offsets to clean background for the far side of every edge
              const pushTex = gl.createTexture(); gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, pushTex);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, RW, RH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
              for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST],
                [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
              const pp = gl.createProgram()!;
              gl.attachShader(pp, mk(gl.VERTEX_SHADER, FILTER_VERT)); gl.attachShader(pp, mk(gl.FRAGMENT_SHADER, PUSH_FRAG));
              gl.linkProgram(pp);
              const fb2 = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb2);
              gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pushTex, 0);
              gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
              if (gl.getProgramParameter(pp, gl.LINK_STATUS) && gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
                gl.useProgram(pp);
                gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, restTex);
                gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, zMin);
                gl.uniform1i(gl.getUniformLocation(pp, "uRest"), 1); gl.uniform1i(gl.getUniformLocation(pp, "uZmin"), 2);
                gl.uniform2i(gl.getUniformLocation(pp, "uSize"), RW, RH);
                gl.uniform2f(gl.getUniformLocation(pp, "uNF"), REST_NF[0], REST_NF[1]);
                gl.disable(gl.DEPTH_TEST); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.enable(gl.DEPTH_TEST);
              }
              const extTex = gl.createTexture(); gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, extTex);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, RW, RH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
              for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST],
                [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
              const ep = gl.createProgram()!;
              gl.attachShader(ep, mk(gl.VERTEX_SHADER, FILTER_VERT)); gl.attachShader(ep, mk(gl.FRAGMENT_SHADER, EXT_FRAG));
              gl.linkProgram(ep);
              gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, extTex, 0);
              if (gl.getProgramParameter(ep, gl.LINK_STATUS) && gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
                gl.useProgram(ep);
                gl.uniform1i(gl.getUniformLocation(ep, "uRest"), 1); gl.uniform1i(gl.getUniformLocation(ep, "uZmin"), 2);
                gl.uniform2i(gl.getUniformLocation(ep, "uSize"), RW, RH);
                gl.uniform2f(gl.getUniformLocation(ep, "uNF"), REST_NF[0], REST_NF[1]);
                gl.disable(gl.DEPTH_TEST); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.enable(gl.DEPTH_TEST);
              }
              gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
              // rebind each map to its own unit for the main pass
              gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, restTex);
              gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, zMin);
              gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, zMax);
              gl.useProgram(prog); gl.uniform1i(U("uMode"), 2);
            } else {
              gl.useProgram(prog); gl.uniform1i(U("uMode"), 0);   // filter pass unavailable: per-vertex fallback
            }
            gl.uniform2i(U("uRestSize"), RW, RH);
          }
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.useProgram(prog);
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(U("uRest"), 1); gl.uniform1i(U("uZmin"), 2); gl.uniform1i(U("uZmax"), 3); gl.uniform1i(U("uPush"), 5); gl.uniform1i(U("uExt"), 6);
        gl.uniform2f(U("uNF"), REST_NF[0], REST_NF[1]);
        gl.uniform1f(U("uHaveRest"), haveRest ? 1 : 0);

        /* Optional soft subject layer (see FUR_VERT): fur.json + fur.bin (float32
           u, v, distance per vertex, then uint32 triangles) + fur.webp (colour + matte). */
        /* Optional clean plate (behind.webp): the photo with the flowers removed and what is behind
           them painted in by LaMa, layer by layer in depth (see lama/plates.py). Surfaces a drag
           uncovers take their colour from it. &nobehind turns it off for comparison. */
        const bimg = await new Promise<HTMLImageElement | null>((res) => {
          const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = dir + "behind.webp";
        });
        if (!alive) return;
        if (bimg) {
          gl.useProgram(prog);
          const bt = gl.createTexture(); gl.activeTexture(gl.TEXTURE8); gl.bindTexture(gl.TEXTURE_2D, bt);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bimg);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.activeTexture(gl.TEXTURE0);
          gl.uniform1i(U("uBehind"), 8); gl.uniform1f(U("uHaveBehind"), q.has("nobehind") ? 0 : 1);
        }
        let furNote = "";
        const fr = await fetch(dir + "fur.json");
        if (isJson(fr)) {
          const fm: { box: number[]; PW: number; PH: number; nv: number; ni: number } = await fr.json();
          const [fb, fimg] = await Promise.all([bin(dir + "fur.bin"), new Promise<HTMLImageElement>((res, rej) => {
            const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error("fur.webp missing")); im.src = dir + "fur.webp";
          })]);
          if (!alive) return;
          const fp = gl.createProgram()!;
          gl.attachShader(fp, mk(gl.VERTEX_SHADER, FUR_VERT)); gl.attachShader(fp, mk(gl.FRAGMENT_SHADER, FUR_FRAG));
          gl.linkProgram(fp); gl.useProgram(fp);
          const FU = (n: string) => gl.getUniformLocation(fp, n);
          gl.uniform2f(FU("uHalf"), m.W / 2, m.H / 2); gl.uniform1f(FU("uF"), m.f); gl.uniform2f(FU("uSize"), m.W, m.H);
          gl.uniform2f(FU("uT0"), m.tx0, m.ty0);
          const [x0, y0, x1, y1] = fm.box;
          gl.uniform4f(FU("uBox"), x0 / fm.PW, 1 - y1 / fm.PH, (x1 - x0) / fm.PW, (y1 - y0) / fm.PH);
          gl.uniform1i(FU("uFur"), 7);
          const ft = gl.createTexture(); gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, ft);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fimg);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.activeTexture(gl.TEXTURE0);
          const vao = gl.createVertexArray()!; gl.bindVertexArray(vao);
          gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fb, 0, fm.nv * 3), gl.STATIC_DRAW);
          gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(fb, fm.nv * 12, fm.ni), gl.STATIC_DRAW);
          gl.bindVertexArray(null); gl.useProgram(prog);
          fur = { prog: fp, vao, n: fm.ni, mvp: FU("uMVP") };
          furNote = " · soft fur layer";
        }
        const mb = ((mv.byteLength + mi.byteLength) / 1e6).toFixed(1);
        setStatus(`${scene.startsWith("ours") ? "Our mesh (our depth + your photo; fill colours from 3D Photo Inpainting; no Apple model)" : "3D Photo Inpainting preview"}${scene ? ` (${scene})` : ""} · ${m.W}px geometry · ${(m.nt / 1e6).toFixed(2)}M triangles · ${mb} MB · `
          + `loaded in ${((performance.now() - t0) / 1000).toFixed(1)} s · ${sharp ? (haveRest ? "your photo wherever visible" : "full-res photo (per-vertex fallback)") : "raw colours"}${furNote} · drag to rotate`);
        resize();
        /* ?3dp&bench: window.__mpBench(mode) times the moving-camera frame on
           this machine's GPU — 0 = old per-vertex colouring, 2 = current
           visibility rule (precomputed edge map). */
        if (q.has("bench")) {
          (window as unknown as { __mpPose: (x: number, y: number, s?: number) => void }).__mpPose = (x, y, s) => {
            tx = cx = x; ty = cy = y; moving = x !== 0 || y !== 0; settle = s ?? (moving ? 0 : 1);
            setSize(moving ? moveDpr : fullDpr); draw();
          };
          (window as unknown as { __mpBench: (mode: number, frames?: number) => number }).__mpBench = (mode, frames = 40) => {
            const prev = [cx, cy, moving, settle] as const;
            gl.uniform1i(U("uMode"), mode); cx = 0.6; cy = -0.3; moving = true; settle = 0; setSize(moveDpr);
            const px = new Uint8Array(4); draw(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
            const t1 = performance.now();
            for (let i = 0; i < frames; i++) { draw(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
            const ms = (performance.now() - t1) / frames;
            gl.uniform1i(U("uMode"), 2); [cx, cy, moving, settle] = prev; setSize(moving ? moveDpr : fullDpr); draw();
            return Math.round(ms * 100) / 100;
          };
        }
      } catch (err) {
        setStatus(`Preview files missing — ${(err as Error).message}`);
      }
    })();

    setSize(fullDpr);
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });
    return () => {
      alive = false; cancelAnimationFrame(raf); cancelAnimationFrame(fadeRaf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      root.style.userSelect = prevSel;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [swing]);

  /* One-click switcher between the builds being compared. Its own fixed layer
     above the page (the scene itself sits behind everything at zIndex -1);
     clicks on links never start a drag. */
  const here = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("3dp") ?? "";
  /* builds not made yet stay hidden (the dev server answers a missing file with
     index.html, so only a JSON reply counts) */
  const [built, setBuilt] = useState<Record<string, boolean>>({});
  useEffect(() => {
    for (const sc of SCENES) {
      fetch(`${import.meta.env.BASE_URL}${sc.check ?? `preview-3dp/${sc.v ? sc.v + "/" : ""}p1920.json`}`, { cache: "no-store" })
        .then((r) => r.ok && (r.headers.get("content-type") ?? "").includes("json"))
        .catch(() => false)
        .then((ok) => setBuilt((b) => ({ ...b, [sc.v]: ok })));
    }
  }, []);
  return (
    <>
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex, pointerEvents: "none", background: "#0f120f" }}>
        <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block" }} />
        <div style={{ position: "absolute", left: 12, bottom: 10, font: "12px system-ui, sans-serif",
          color: "#e8efe6", background: "rgba(0,0,0,0.55)", padding: "4px 8px", borderRadius: 6 }}>
          {status}
        </div>
      </div>
      <nav aria-label="3D preview builds" style={{ position: "fixed", right: 12, bottom: 10, zIndex: 60, display: "flex", gap: 6,
        font: "12px system-ui, sans-serif" }}>
        {SCENES.filter((sc) => built[sc.v] || sc.v === here).map((sc) => (
          <a key={sc.v || "tulips"} href={sc.page ? `${import.meta.env.BASE_URL}${sc.page}` : sc.v ? `?3dp=${sc.v}` : "?3dp"}
            style={{ padding: "4px 8px", borderRadius: 6, textDecoration: "none",
              color: here === sc.v ? "#0f120f" : "#e8efe6",
              background: here === sc.v ? "#e8efe6" : "rgba(0,0,0,0.55)" }}>
            {sc.label}
          </a>
        ))}
      </nav>
    </>
  );
}
