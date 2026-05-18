/*
 * Role: The main dashboard surface.
 * Author: Dennies Bor
 * Description:
 *   The primary view of the C-SWIM dashboard. A current space weather strip
 *   spans the top. Below it the live globe and the headline results sit side
 *   by side on wide screens and stack on narrow ones. A full-width
 *   vulnerability chart row follows, giving the altitude-inclination scatter
 *   the horizontal room it needs.
 */

import { lazy, Suspense } from "react";

import FleetGlobe from "../components/globe/FleetGlobe";
import ResultsPanel from "../components/results/ResultsPanel";
import SpaceWeatherStrip from "../components/live/SpaceWeatherStrip";

const AltitudeInclinationScatter = lazy(
  () => import("../components/charts/AltitudeInclinationScatter"),
);

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <SpaceWeatherStrip />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-4 items-start">
        <div className="min-w-0">
          <FleetGlobe />
        </div>
        <div className="min-w-0">
          <ResultsPanel />
        </div>
      </div>

      <div className="bg-surface-raised border border-line rounded-lg p-4">
        <h3 className="text-sm font-semibold text-ink mb-2">
          Failure probability by altitude and inclination
        </h3>
        <Suspense
          fallback={
            <div className="text-xs text-ink-muted">Loading chart.</div>
          }
        >
          <AltitudeInclinationScatter />
        </Suspense>
      </div>
    </div>
  );
}