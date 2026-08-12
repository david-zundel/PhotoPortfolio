import Weather from "@/components/Weather";
import WinterSky from "@/components/WinterSky";
import WinterTreeline from "@/components/WinterTreeline";
import RunningDeer from "@/components/RunningDeer";
import AutumnPondScene from "@/components/AutumnPondScene";
import { useSeason, usePondPhase, type Season } from "@/lib/season";

/**
 * The app-level scene layer. Mount ONCE in App.tsx, replacing the treeline and
 * the six deer.
 *
 * Winter keeps its original mount exactly: treeline and herd at z-20…33, in
 * FRONT of the page content. Autumn is the opposite — one fixed backdrop at
 * z-0, behind everything. That difference is deliberate, not an oversight: the
 * deer are a foreground band along the bottom, the pond is a whole environment.
 */
export const SeasonScene = () => {
  const [season] = useSeason();
  const phase = usePondPhase();

  if (season === "autumn") {
    return (
      <AutumnPondScene phase={phase} grading="faithful" zIndex={0} />
    );
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
 * <Weather /> are now — the pond brings its own sky and weather, so in autumn
 * this renders nothing.
 */
export const SeasonSky = () => {
  const [season] = useSeason();
  if (season === "autumn") return null;
  return (
    <>
      <WinterSky />
      <Weather coverage={0.25} snowDensity={0.7} calmDensity={0.45} zIndex={5} />
    </>
  );
};

const LABELS: Record<Season, string> = { autumn: "Autumn", winter: "Winter" };

/** Nav control. Styled off .nav-pill so it sits in the existing bar unchanged. */
export const SeasonToggle = () => {
  const [season, set] = useSeason();
  const next: Season = season === "autumn" ? "winter" : "autumn";
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
