/*
 * Role: The failure probability distribution chart.
 * Author: Dennies Bor
 * Description:
 *   Renders the distribution of satellite failure probability as a histogram
 *   on a logarithmic probability axis. The backend returns counts in bins of
 *   log10 of the failure probability. Each bar is coloured by the
 *   vulnerability class its probability range falls into, using the shared
 *   classification palette. Drawn with the dashboard's own Plotly wrapper and
 *   the shared dark theme.
 */

import { useMemo } from "react";

import Plot from "./Plot";
import { baseLayout, baseConfig } from "../../lib/plotlyTheme";
import { useVulnerabilityDistribution } from "../../hooks/useVulnerabilityDistribution";
import { CLASSIFICATION_COLOR } from "../../lib/classification";

const SCENARIO_ID = "scen_00_100y";

// Map a log10 failure probability to the vulnerability class whose range it
// falls in. The thresholds match the C-SWIM classification scheme.
function classForLogPfail(logP) {
  if (logP >= -2) return "CRITICAL";
  if (logP >= -3) return "ELEVATED";
  if (logP >= -6) return "MODERATE";
  if (logP >= -10) return "LOW";
  return "NEGLIGIBLE";
}

export default function PfailDistribution() {
  const { data, isLoading, isError } = useVulnerabilityDistribution(SCENARIO_ID);

  const trace = useMemo(() => {
    if (!data || !data.bins) {
      return null;
    }
    const centers = data.bins.map(
      (b) => (b.log_p_fail_lower + b.log_p_fail_upper) / 2,
    );
    const counts = data.bins.map((b) => b.count);
    const colors = centers.map((c) => CLASSIFICATION_COLOR[classForLogPfail(c)]);
    const widths = data.bins.map(
      (b) => (b.log_p_fail_upper - b.log_p_fail_lower) * 0.95,
    );
    return { centers, counts, colors, widths };
  }, [data]);

  if (isLoading) {
    return <div className="text-xs text-ink-muted">Loading distribution.</div>;
  }
  if (isError || !trace) {
    return (
      <div className="text-xs text-ink-muted">
        Distribution data is unavailable.
      </div>
    );
  }

  return (
    <div>
      <Plot
        data={[
          {
            type: "bar",
            x: trace.centers,
            y: trace.counts,
            width: trace.widths,
            marker: { color: trace.colors },
            hovertemplate:
              "log<sub>10</sub> P<sub>fail</sub> %{x:.1f}<br>" +
              "%{y} satellites<extra></extra>",
          },
        ]}
        layout={{
          ...baseLayout,
          height: 240,
          xaxis: {
            ...baseLayout.xaxis,
            title: "Failure probability",
            tickmode: "array",
            tickvals: [-60, -50, -40, -30, -20, -10, 0],
            ticktext: [
              "10\u207b\u2076\u2070",
              "10\u207b\u2075\u2070",
              "10\u207b\u2074\u2070",
              "10\u207b\u00b3\u2070",
              "10\u207b\u00b2\u2070",
              "10\u207b\u00b9\u2070",
              "10\u2070",
            ],
          },
          yaxis: {
            ...baseLayout.yaxis,
            title: "Satellites",
          },
        }}
        config={baseConfig}
        style={{ width: "100%" }}
        useResizeHandler
      />
      <div className="text-xs text-ink-muted mt-1">
        Distribution of modelled failure probability across the analysed
        fleet, on a logarithmic axis. Bar colour marks the vulnerability class
        each probability range falls into.
      </div>
    </div>
  );
}