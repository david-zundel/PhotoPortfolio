import Weather from "@/components/Weather";
import WinterSky from "@/components/WinterSky";
import WinterTreeline from "@/components/WinterTreeline";
import RunningDeer from "@/components/RunningDeer";
import AutumnPondScene from "@/components/AutumnPondScene";
import WinterCabinScene from "@/components/WinterCabinScene";
import { useSeason, usePondPhase, SEASONS, type Season } from "@/lib/season";

/**
 * The app-level scene layer. Mount ONCE in App.tsx, replacing the treeline and
 * the six deer.
 *
 * Winter keeps its original mount exactly: treeline and herd at z-20…33, in
 * FRONT of the page content. Autumn and the cabin are the opposite — one fixed
 * backdrop at z-(-1), behind everything. That difference is deliberate, not an
 * oversight: the deer are a foreground band along the bottom, while the pond
 * and the cabin valley are each a whole environment.
 */
export const SeasonScene = () => {
  const [season] = useSeason();
  const phase = usePondPhase();

  if (season === "autumn") {
    // zIndex -1 (NOT 0): the page wrapper on Index/Gallery has `isolate`, so its
    // inner z-10 content can't rise above a z-0 fixed sibling that paints later
    // in the DOM — the pond would cover the whole site. At -1 the pond sits below
    // all content while still showing above the body background. Do not "tidy" to 0.
    return (
      <AutumnPondScene phase={phase} grading="faithful" zIndex={-1} />
    );
  }

  // Same zIndex reasoning as the pond above — see WinterCabinScene's header.
  if (season === "cabin") {
    return <WinterCabinScene zIndex={-1} />;
  }

  return (
    <>
      <WinterTreeline zIndex={20} />
      <RunningDeer height={104} hopHeight={30} cycleSeconds={0.8} crossSeconds={13} crossDelay={-6.5} bottom={8} zIndex={33} />
      <RunningDeer height={92} hopHeight={28} cycleSeconds={0.86} crossSeconds={15} crossDelay={0} bottom={11} zIndex={32} />
      <RunningDeer height={82} hopHeight={26} cycleSeconds={0.9} crossSeconds={17} crossDelay={-12.75} bottom={13} zIndex={31} />
      <RunningDeer height={72} hopHeight={24} cycleSeconds={0.95} crossSeconds={20} crossDelay={-5} bottom={15} zIndex={30} />
      <RunningDeer height={98} hopHeight={29} cycleSeconds={0.83} crossSeconds={14} crossDelay={-8.4} bottom={9} zIndex={33} />
      <RunningDeer height={78} hopHeight={25} cycleSeconds={0.92} crossSeconds={18} crossDelay={-16.2} bottom={14} zIndex={31} />
    </>
  );
};

/**
 * The per-page sky. Mount inside Index and Gallery where <WinterSky /> and
 * <Weather /> are now. Only the original winter scene needs it; the pond and
 * the cabin each paint their own sky and weather, so this renders nothing for
 * them.
 */
export const SeasonSky = () => {
  const [season] = useSeason();
  // The pond and the cabin both bring their own sky and weather.
  if (season !== "winter") return null;
  return (
    <>
      <WinterSky />
      <Weather coverage={0.25} snowDensity={0.7} calmDensity={0.45} zIndex={5} />
    </>
  );
};

const LABELS: Record<Season, string> = { autumn: "Autumn", winter: "Winter", cabin: "Cabin" };

/**
 * Nav control. Styled off .nav-pill so it sits in the existing bar unchanged.
 * Steps through SEASONS in order and wraps, so adding a fourth scene is a
 * one-line change in season.ts plus a label here.
 */
export const SeasonToggle = () => {
  const [season, set] = useSeason();
  const next: Season = SEASONS[(SEASONS.indexOf(season) + 1) % SEASONS.length];
  return (
    <button
      onClick={() => set(next)}
      className="nav-pill"
      title={`Switch to the ${LABELS[next].toLowerCase()} scene`}
      aria-label={`Scene: ${LABELS[season]}. Switch to ${LABELS[next]}.`}
    >
      {LABELS[season]}
    </button>
  );
};
