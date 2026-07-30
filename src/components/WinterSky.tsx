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

/**
 * WinterSky — a soft watercolor winter sky that scrolls with the page
 * (icy morning at the top → lavender-pink dusk at the bottom), with drifting
 * color washes and a paper texture. Snow is owned by the separate <Weather />
 * layer. Respects prefers-reduced-motion (see .ws-blob rule in index.css).
 */
const WinterSky = () => {
  return (
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
  );
};

export default WinterSky;
