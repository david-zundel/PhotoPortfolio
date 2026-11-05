import { lazy, Suspense, useEffect, useState } from "react";

/**
 * TulipsScene — the tulip photograph as a backdrop you can turn a few degrees.
 *
 * The photo itself appears at once (a plain <img>, 0.3-0.6 MB). Once the page has finished
 * loading, the 3D version streams in behind it (~13 MB, ~10.5 MB on phones: mesh, soft-edge layer, clean plate,
 * full-resolution photo) and fades in when its first frame is drawn. At rest the 3D version IS
 * the photo, so the fade is invisible; it only shows when the view moves.
 *
 *  - mouse / pen: drag on the hero to turn the view; it eases home on release
 *  - touch screens: a slow automatic drift (dragging would fight scrolling)
 *  - reduced motion, Save-Data / slow connection, no WebGL2, a lost GPU context, or a device
 *    that can't draw it at ~30 fps: the still photo stays
 *
 * How the 3D assets are made (offline, see handoff/3dp/oursplat): Depth Anything V2 Small for
 * depth, SAM 2.1 outlines, ViTMatte soft edges, a LaMa clean plate behind the flowers, packed
 * with meshoptimizer. Every model used is Apache-2.0 or MIT licensed.
 *
 * Mounted at zIndex -1 like the other scenes: the page wrapper on Index/Gallery has `isolate`,
 * so a z-0 fixed sibling that paints later would cover the site.
 */

const MeshScene = lazy(() => import("@/components/MeshPreviewScene"));
const BASE = `${import.meta.env.BASE_URL}hero3d/`;
const DIR = `${BASE}tulips/`;

type Plan = { motion: "drag" | "sway"; small: boolean } | null;

/** Decide once, on the client, whether this visitor gets the 3D version. */
function plan3D(): Plan {
  if (typeof window === "undefined") return null;
  const mq = (q: string) => !!window.matchMedia?.(q).matches;
  if (mq("(prefers-reduced-motion: reduce)")) return null;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData || /2g|3g/.test(conn?.effectiveType ?? "")) return null;
  try {
    const probe = document.createElement("canvas").getContext("webgl2");
    if (!probe) return null;
    probe.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    return null;
  }
  const touchOnly = mq("(pointer: coarse)") && !mq("(any-pointer: fine)");
  const devicePx = Math.max(window.screen.width, window.screen.height) * (window.devicePixelRatio || 1);
  return { motion: touchOnly ? "sway" : "drag", small: touchOnly || devicePx < 2600 };
}

export default function TulipsScene({ zIndex = -1 }: { zIndex?: number }) {
  const [plan] = useState<Plan>(plan3D);
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // start the 3D download only after the page (and the still photo) have loaded
  useEffect(() => {
    if (!plan) return;
    let t = 0;
    const go = () => { t = window.setTimeout(() => setMount(true), 400); };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => { window.removeEventListener("load", go); clearTimeout(t); };
  }, [plan]);

  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex, pointerEvents: "none", background: "#0f120f" }}>
      <img
        src={`${DIR}still-1600.webp`}
        srcSet={`${DIR}still-1600.webp 1600w, ${DIR}still-2880.webp 2880w`}
        sizes="100vw"
        alt=""
        decoding="async"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {plan && mount && !failed && (
        <div style={{ position: "absolute", inset: 0, opacity: ready ? 1 : 0, transition: "opacity 0.6s ease" }}>
          <Suspense fallback={null}>
            <MeshScene
              zIndex={0}
              dir={DIR}
              decoder={`${BASE}meshopt_decoder.mjs`}
              motion={plan.motion}
              small={plan.small}
              dragArea="#home"
              onReady={() => setReady(true)}
              onFail={() => setFailed(true)}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
