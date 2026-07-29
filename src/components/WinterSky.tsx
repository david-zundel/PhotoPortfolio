import { useEffect, useRef } from "react";

// Soft color washes scattered down the whole (scrolling) page. [top, left, size, color]
const BLOBS: Array<[string, string, string, string]> = [
  ["8vh", "6vw", "42vw", "rgba(240,206,190,.85)"],
  ["4vh", "62vw", "40vw", "rgba(198,196,214,.75)"],
  ["46vh", "70vw", "34vw", "rgba(244,224,206,.7)"],
  ["70vh", "-4vw", "36vw", "rgba(200,214,230,.7)"],
  ["120vh", "30vw", "40vw", "rgba(250,247,240,.8)"],
  ["165vh", "64vw", "34vw", "rgba(226,210,232,.7)"],
  ["210vh", "-2vw", "38vw", "rgba(244,222,214,.7)"],
  ["255vh", "40vw", "36vw", "rgba(214,206,228,.7)"],
  ["300vh", "66vw", "34vw", "rgba(246,220,206,.7)"],
  ["345vh", "6vw", "40vw", "rgba(230,204,220,.7)"],
  ["390vh", "44vw", "36vw", "rgba(244,216,202,.72)"],
];
const ANIMS = ["wsFloatA 92s", "wsFloatB 118s", "wsFloatC 104s"];

type Flake = {
  x: number; y: number; spd: number; amp: number; ph: number; phs: number;
  op: number; fl: boolean; r: number; size: number; rot: number; rots: number;
};

/**
 * WinterSky — a soft watercolor winter sky that scrolls with the page
 * (icy morning at the top → lavender-pink dusk at the bottom), with a
 * paper texture and a light, continuous snowfall (fine dots + crystal flakes).
 * Respects prefers-reduced-motion.
 */
const WinterSky = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    let W = 0, H = 0, DPR = 1;
    let flakes: Flake[] = [];

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = window.innerWidth * DPR;
      H = canvas.height = window.innerHeight * DPR;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      const mobile = window.innerWidth < 760;
      const area = window.innerWidth * window.innerHeight;
      const flakeN = Math.min(mobile ? 3 : 7, Math.round(area / (mobile ? 160000 : 185000)));   // sparse crystal snowflakes
      const dotN = Math.min(mobile ? 16 : 48, Math.round(area / (mobile ? 42000 : 32000)));      // more fine "normal" snow
      const mk = (isFlake: boolean, depth: number): Flake => ({
        x: Math.random() * W, y: Math.random() * H,
        spd: (0.25 + depth * 1.15) * DPR, amp: rnd(6, 22) * DPR,
        ph: Math.random() * 6.28, phs: rnd(0.006, 0.018),
        op: 0.5 + depth * 0.45, fl: isFlake,
        r: (0.8 + depth * 2.3) * DPR, size: (4.5 + depth * 6) * DPR,
        rot: Math.random() * 6.28, rots: rnd(-0.01, 0.01),
      });
      flakes = [];
      for (let i = 0; i < flakeN; i++) flakes.push(mk(true, 0.5 + Math.random() * 0.5));
      for (let i = 0; i < dotN; i++) flakes.push(mk(false, Math.random()));
    };

    const drawFlake = (x: number, y: number, s: number, rot: number, op: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.strokeStyle = `rgba(255,255,255,${op})`;
      ctx.lineWidth = Math.max(0.7, s * 0.11);
      ctx.lineCap = "round";
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, s * 0.52); ctx.lineTo(s * 0.26, s * 0.7); ctx.moveTo(0, s * 0.52); ctx.lineTo(-s * 0.26, s * 0.7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, s * 0.76); ctx.lineTo(s * 0.18, s * 0.9); ctx.moveTo(0, s * 0.76); ctx.lineTo(-s * 0.18, s * 0.9); ctx.stroke();
      }
      ctx.restore();
    };

    const drawAll = () => {
      for (const f of flakes) {
        if (f.fl) drawFlake(f.x, f.y, f.size, f.rot, f.op * 0.9);
        else { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.2832); ctx.fillStyle = `rgba(255,255,255,${f.op})`; ctx.fill(); }
      }
    };

    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(2.5, (now - last) / 16.67);
      last = now;
      ctx.clearRect(0, 0, W, H);
      for (const f of flakes) {
        f.ph += f.phs * dt;
        f.y += f.spd * dt;
        f.x += Math.sin(f.ph) * f.amp * 0.02 * dt;
        if (f.fl) f.rot += f.rots * dt;
        if (f.y > H + 8) { f.y = -8; f.x = Math.random() * W; }
        if (f.x < -12) f.x = W + 12;
        if (f.x > W + 12) f.x = -12;
      }
      drawAll();
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    if (reduce) {
      drawAll(); // one static frame, no animation
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="winter-sky" aria-hidden="true">
        <div className="ws-grad" />
        {BLOBS.map(([top, left, size, color], i) => (
          <div
            key={i}
            className="ws-blob"
            style={{
              top,
              left,
              width: size,
              height: size,
              background: `radial-gradient(closest-side, ${color}, transparent 74%)`,
              animation: `${ANIMS[i % 3]} ease-in-out infinite alternate`,
            }}
          />
        ))}
        <div className="ws-bloom" />
        <div className="ws-grain" />
      </div>
      <div className="ws-haze" aria-hidden="true" />
      <canvas ref={canvasRef} className="ws-snow" aria-hidden="true" />
    </>
  );
};

export default WinterSky;
