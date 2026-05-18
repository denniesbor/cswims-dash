/*
 * Role: The current space weather strip across the top of the dashboard.
 * Author: Dennies Bor
 * Description:
 *   Presents present space weather as a row of tiles. Each tile shows the
 *   current value of a driver, its unit, and a sparkline of recent history so
 *   a trend is visible at a glance. The solar wind drivers come from the
 *   recent solar wind series. Values update on a one-minute cadence.
 */

import { useSolarWind } from "../../hooks/useSolarWind";
import { useLiveSummary } from "../../hooks/useLiveSummary";
import Sparkline from "../common/Sparkline";
import { formatFixed } from "../../lib/format";

function Tile({ label, value, unit, series, color }) {
  return (
    <div className="bg-surface-raised border border-line rounded-lg px-4 py-3 flex-1 min-w-[180px]">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="flex items-end justify-between mt-1 gap-3">
        <div className="text-xl font-semibold text-ink">
          {value}
          {unit && (
            <span className="text-sm text-ink-muted font-normal"> {unit}</span>
          )}
        </div>
        {series && series.length > 1 && (
          <Sparkline values={series} color={color} />
        )}
      </div>
    </div>
  );
}

export default function SpaceWeatherStrip() {
  const { data: sw } = useSolarWind(24);
  const { data: summary } = useLiveSummary();

  const speedSeries = sw ? sw.map((r) => r.v) : [];
  const bzSeries = sw ? sw.map((r) => r.bz_gsm) : [];

  const latest = summary ?? {};
  const swNow = latest.solar_wind ?? {};
  const gmNow = latest.geomag ?? {};
  const pfNow = latest.proton_flux ?? {};

  return (
    <div className="flex flex-wrap gap-3">
      <Tile
        label="Solar wind speed"
        value={swNow.v != null ? formatFixed(swNow.v, 0) : "n/a"}
        unit="km/s"
        series={speedSeries}
        color="#58a6ff"
      />
      <Tile
        label="IMF Bz"
        value={swNow.bz_gsm != null ? formatFixed(swNow.bz_gsm, 1) : "n/a"}
        unit="nT"
        series={bzSeries}
        color="#d6604d"
      />
      <Tile
        label="Kp index"
        value={gmNow.kp != null ? formatFixed(gmNow.kp, 1) : "n/a"}
      />
      <Tile
        label="Proton flux > 10 MeV"
        value={pfNow.flux_gt10 != null ? formatFixed(pfNow.flux_gt10, 1) : "n/a"}
        unit="pfu"
      />
    </div>
  );
}