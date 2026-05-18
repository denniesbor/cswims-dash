/*
 * Role: The altitude against inclination scatter, coloured by failure
 *   probability.
 * Author: Dennies Bor
 * Description:
 *   Places every analysed satellite by orbital inclination and altitude, with
 *   altitude on a logarithmic axis since it spans low Earth orbit to beyond
 *   geostationary. Each point is coloured by failure probability on a
 *   logarithmic colour scale, so the physical structure of the risk is
 *   visible: which combinations of altitude and inclination carry the high
 *   failure probabilities. Drawn with WebGL scatter to handle the full set of
 *   roughly ten thousand satellites smoothly.
 */

import { useMemo } from "react";

import Plot from "./Plot";
import { baseLayout, baseConfig } from "../../lib/plotlyTheme";
import { useAnalyzedFleet } from "../../hooks/useAnalyzedFleet";

const SCENARIO_ID = "scen_00_100y";

export default function AltitudeInclinationScatter() {
  const { data, isLoading, isError } = useAnalyzedFleet(SCENARIO_ID);

  const trace = useMemo(() => {
    if (!data || !data.satellites) {
      return null;
    }
    const pts = data.satellites.filter(
      (s) =>
        s.altitude_km != null &&
        s.inclination_deg != null &&
        s.altitude_km > 0,
    );
    return {
      x: pts.map((s) => s.inclination_deg),
      y: pts.map((s) => s.altitude_km),
      // Colour by log10 of the failure probability, floored so that the
      // smallest probabilities do not pull the scale to negative infinity.
      color: pts.map((s) => Math.log10(Math.max(s.p_fail, 1e-15))),
      name: pts.map((s) => s.name),
      pfail: pts.map((s) => s.p_fail),
    };
  }, [data]);

  if (isLoading) {
    return <div className="text-xs text-ink-muted">Loading fleet.</div>;
  }
  if (isError || !trace) {
    return (
      <div className="text-xs text-ink-muted">
        Analysed fleet data is unavailable.
      </div>
    );
  }

  return (
    <div>
      <Plot
        data={[
          {
            type: "scattergl",
            mode: "markers",
            x: trace.x,
            y: trace.y,
            customdata: trace.name.map((n, i) => [n, trace.pfail[i]]),
            marker: {
              size: 5,
              color: trace.color,
              colorscale: "RdBu",
              reversescale: true,
              cmin: -12,
              cmax: 0,
              colorbar: {
                title: { text: "P_fail", side: "right" },
                tickvals: [-12, -9, -6, -3, 0],
                ticktext: [
                  "10\u207b\u00b9\u00b2",
                  "10\u207b\u2079",
                  "10\u207b\u2076",
                  "10\u207b\u00b3",
                  "10\u2070",
                ],
                thickness: 12,
                len: 0.9,
                outlinewidth: 0,
                tickfont: { color: "#8b97a6" },
              },
              opacity: 0.75,
            },
            hovertemplate:
              "%{customdata[0]}<br>" +
              "Inclination %{x:.1f}\u00b0<br>" +
              "Altitude %{y:,.0f} km<br>" +
              "P_fail %{customdata[1]:.2e}<extra></extra>",
          },
        ]}
        layout={{
          ...baseLayout,
          height: 320,
          margin: { l: 60, r: 16, t: 8, b: 44 },
          xaxis: {
            ...baseLayout.xaxis,
            title: "Orbital inclination (degrees)",
            range: [0, 125],
          },
          yaxis: {
            ...baseLayout.yaxis,
            title: "Altitude (km)",
            type: "log",
            range: [Math.log10(200), Math.log10(60000)],
          },
        }}
        config={baseConfig}
      />
      <div className="text-xs text-ink-muted mt-1">
        Every analysed satellite placed by orbital inclination and altitude,
        the altitude axis logarithmic. Point colour gives the modelled failure
        probability. The high-altitude and high-inclination satellites carry
        the highest probabilities.
      </div>
    </div>
  );
}