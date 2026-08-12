/**
 * season.ts — which scene is showing, and what time of day the pond is at.
 *
 * A module-level store rather than a React context, so mounting it costs one
 * import in App.tsx and one in Navbar.tsx — no provider to thread through.
 */

import { useSyncExternalStore, useEffect, useState } from "react";
import type { PondPhase } from "@/components/AutumnPondScene";

export type Season = "autumn" | "winter";

const KEY = "dz:season";
const DEFAULT: Season = "autumn";

let season: Season = read();
const listeners = new Set<() => void>();

function read(): Season {
  if (typeof localStorage === "undefined") return DEFAULT;
  const v = localStorage.getItem(KEY);
  return v === "winter" || v === "autumn" ? v : DEFAULT;
}

function publish() {
  // Lets plain CSS retune per season: html[data-season="autumn"] .winter-name {…}
  document.documentElement.setAttribute("data-season", season);
  listeners.forEach((l) => l());
}

export function setSeason(next: Season) {
  if (next === season) return;
  season = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* private mode — the choice just won't persist */
  }
  publish();
}

export function useSeason(): [Season, (s: Season) => void] {
  const s = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => season,
    () => DEFAULT,
  );
  useEffect(publish, []);
  return [s, setSeason];
}

/**
 * The visitor's local clock → a pond phase. AutumnPondScene never reads the
 * clock itself; this is the only place that decides.
 *
 * Boundaries are wall-clock, not true solar time — a real sunrise calculation
 * would need the visitor's latitude and the date, which is more than this is
 * worth. Re-checks every minute so a page left open rolls over.
 */
export function phaseForHour(h: number): PondPhase {
  if (h >= 4.5 && h < 6.5) return "dawn";
  if (h >= 6.5 && h < 8.5) return "sunrise";
  if (h >= 8.5 && h < 16.5) return "afternoon";
  if (h >= 16.5 && h < 18.5) return "sunset";
  if (h >= 18.5 && h < 20.5) return "evening";
  return "night";
}

function now(): PondPhase {
  const d = new Date();
  return phaseForHour(d.getHours() + d.getMinutes() / 60);
}

export function usePondPhase(): PondPhase {
  const [phase, setPhase] = useState<PondPhase>(now);
  useEffect(() => {
    const id = setInterval(() => setPhase(now()), 60_000);
    return () => clearInterval(id);
  }, []);
  // Published so CSS can respond to the light. The hero's secondary copy sits
  // directly on raw sky, which swings from #e6f4fb at midday to #0d1533 at
  // night — no single colour reads on both, so season.css flips it by phase.
  useEffect(() => {
    document.documentElement.setAttribute("data-phase", phase);
  }, [phase]);
  return phase;
}
