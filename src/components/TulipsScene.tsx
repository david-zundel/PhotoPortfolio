import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion as m } from "framer-motion";
import { Rotate3d, X } from "lucide-react";

/**
 * TulipsScene — the tulip photograph as a backdrop you can turn a few degrees.
 *
 * The photo itself appears at once (a plain <img>, 0.2-0.6 MB). Once the page has finished
 * loading, the 3D version streams in behind it (~13 MB, ~11 MB on phones: mesh, soft-edge layer,
 * clean plate, full-resolution photo) and fades in when its first frame is drawn. At rest the 3D
 * version IS the photo, so the fade is invisible; it only shows when the view moves.
 *
 *  - mouse / pen: drag on the hero to turn the view; it eases home on release
 *  - touch screens: tilting the phone turns the view (iPhones ask permission first, from the
 *    explore button; until then the view drifts slowly). A finger on the hero scrolls the page as
 *    usual; the "Explore in 3D" button opens explore mode, where the photo fills the screen, the
 *    page can't scroll, and dragging anywhere turns the view, until Done
 *  - portrait phones get a centre crop of the photo at higher resolution (the still and the 3D
 *    textures), since they only ever show the middle ~40% of its width
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
/* 3:4 or narrower: every phone held upright, and tablets in portrait */
const PORTRAIT = "(max-aspect-ratio: 3/4)";

type Plan = { motion: "drag" | "tilt"; small: boolean; touch: boolean } | null;
type MotionPermission = { requestPermission?: () => Promise<"granted" | "denied"> };

const mq = (q: string) => typeof window !== "undefined" && !!window.matchMedia?.(q).matches;

/** Decide once, on the client, whether this visitor gets the 3D version. */
function plan3D(): Plan {
  if (typeof window === "undefined") return null;
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
  // any touch screen gets explore mode (an iPad with a trackpad still gets touched)
  return { motion: touchOnly ? "tilt" : "drag", small: touchOnly || devicePx < 2600, touch: mq("(any-pointer: coarse)") };
}

export default function TulipsScene({ zIndex = -1 }: { zIndex?: number }) {
  const [plan] = useState<Plan>(plan3D);
  const [mount, setMount] = useState(false);
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [portrait, setPortrait] = useState(() => mq(PORTRAIT));
  const [tilting, setTilting] = useState(false);
  const [explore, setExplore] = useState(false);
  const asked = useRef(false);

  // start the 3D download only after the page (and the still photo) have loaded
  useEffect(() => {
    if (!plan) return;
    let t = 0;
    const go = () => { t = window.setTimeout(() => setMount(true), 400); };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => { window.removeEventListener("load", go); clearTimeout(t); };
  }, [plan]);

  // turning a phone sideways swaps the portrait crop for the full-width set (a fresh load)
  useEffect(() => {
    const q = window.matchMedia?.(PORTRAIT);
    if (!q) return;
    const on = () => setPortrait(q.matches);
    q.addEventListener?.("change", on);
    return () => q.removeEventListener?.("change", on);
  }, []);

  const crop = !!plan?.small && portrait;
  const key = crop ? "portrait" : "full";
  const ready = readyKey === key;

  /* Explore mode, from a button on the hero (touch screens). On iPhones (iOS 13+) the same tap
     asks for motion access, since Safari only opens that prompt from a tap; Android sends
     orientation without asking. If it's refused, explore mode still works by dragging. */
  const home = plan?.touch && ready && !explore ? document.getElementById("home") : null;
  const openExplore = () => {
    const DO = window.DeviceOrientationEvent as unknown as MotionPermission | undefined;
    if (plan?.motion === "tilt" && !tilting && !asked.current && typeof DO?.requestPermission === "function") {
      asked.current = true;
      DO.requestPermission().catch(() => "denied");   // if allowed, the view starts following the phone
    }
    setExplore(true);
  };

  return (
    <div aria-hidden="true" className="backdrop-fixed" style={{ zIndex, pointerEvents: "none", background: "#0f120f" }}>
      <picture>
        {/* portrait screens: the centre of the photo at its full height (3:4 crop), so a phone's
            ~2500-2800 px tall screen isn't showing a 1920 px tall image stretched */}
        <source
          media={PORTRAIT}
          srcSet={`${DIR}still-p1200.webp 1200w, ${DIR}still-p2160.webp 2160w`}
          sizes="75vh"
        />
        <img
          src={`${DIR}still-1600.webp`}
          srcSet={`${DIR}still-1600.webp 1600w, ${DIR}still-2880.webp 2880w`}
          /* object-fit: cover on a screen narrower than 3:2 shows the photo at 1.5x the screen's
             height in width, not 100vw */
          sizes="(max-aspect-ratio: 3/2) 150vh, 100vw"
          alt=""
          decoding="async"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      </picture>
      {plan && mount && !failed && (
        <div key={key} style={{ position: "absolute", inset: 0, opacity: ready ? 1 : 0, transition: "opacity 0.6s ease" }}>
          <Suspense fallback={null}>
            <MeshScene
              zIndex={0}
              dir={DIR}
              decoder={`${BASE}meshopt_decoder.mjs`}
              motion={plan.motion}
              small={plan.small}
              crop={crop}
              dragArea="#home"
              onReady={() => setReadyKey(key)}
              onFail={() => setFailed(true)}
              onTilt={() => setTilting(true)}
              discover={explore}
            />
          </Suspense>
        </div>
      )}
      {home && createPortal(
        <m.button
          type="button"
          onClick={openExplore}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          /* centred with framer's x (its y animation owns the transform, so a translate class
             would be overwritten) */
          className="absolute left-1/2 bottom-28 z-10 flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-body text-white/90 backdrop-blur-md"
          style={{ x: "-50%", background: "rgba(12, 22, 12, 0.55)" }}
        >
          <Rotate3d size={16} strokeWidth={1.75} aria-hidden="true" />
          Explore in 3D
        </m.button>,
        home,
      )}
      {explore && createPortal(
        <ExploreLayer tilt={plan?.motion === "tilt"} onDone={() => setExplore(false)} />,
        document.body,
      )}
    </div>
  );
}

/**
 * Explore mode's layer: a clear surface over the whole page that takes every touch (so the page
 * can't scroll and Safari's toolbar stays put), a Done button, and a short hint. The page itself
 * fades out (html[data-explore], see index.css); MeshPreviewScene turns the view for drags that
 * start on [data-explore-surface].
 */
function ExploreLayer({ tilt, onDone }: { tilt: boolean; onDone: () => void }) {
  const surface = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-explore", "");
    // iOS ignores touch-action for some gestures (rubber-banding, the toolbar): stop them here.
    // A native listener, because React's touch listeners are passive and can't prevent anything.
    const el = surface.current;
    const block = (e: TouchEvent) => { if (e.cancelable) e.preventDefault(); };
    el?.addEventListener("touchmove", block, { passive: false });
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") done.current(); };
    window.addEventListener("keydown", key);
    return () => {
      html.removeAttribute("data-explore");
      el?.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", key);
    };
  }, []);
  return (
    <div
      ref={surface}
      data-explore-surface=""
      role="dialog"
      aria-label="Explore the tulips in 3D"
      className="fixed inset-0 z-[100] select-none"
      style={{ touchAction: "none", WebkitTouchCallout: "none" }}
    >
      <m.button
        type="button"
        onClick={onDone}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="absolute flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm font-body text-white/90 backdrop-blur-md"
        style={{ top: "max(16px, env(safe-area-inset-top))", right: 16, background: "rgba(12, 22, 12, 0.55)" }}
      >
        <X size={16} strokeWidth={1.75} aria-hidden="true" />
        Done
      </m.button>
      <m.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 4, times: [0, 0.12, 0.8, 1], delay: 0.3 }}
        className="pointer-events-none absolute left-0 right-0 text-center text-sm font-body text-white/90"
        style={{ bottom: "max(40px, calc(env(safe-area-inset-bottom) + 24px))", textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}
      >
        {tilt ? "Drag or tilt to look around" : "Drag to look around"}
      </m.p>
    </div>
  );
}
