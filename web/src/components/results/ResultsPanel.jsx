/*
 * Role: The vulnerability results column of the dashboard.
 * Author: Dennies Bor
 * Description:
 *   Presents the headline findings of the C-SWIM study alongside the live
 *   globe. The count of satellites at severe risk, the classification
 *   breakdown as a proportional bar, and the failure probability distribution
 *   chart. Headings name the quantity shown rather than using generic labels.
 *   The distribution chart is lazily imported so Plotly is only downloaded
 *   when this panel renders.
 */

import { lazy, Suspense } from "react";

import { useVulnerabilitySummary } from "../../hooks/useVulnerabilitySummary";
import {
  CLASSIFICATION_ORDER,
  CLASSIFICATION_COLOR,
} from "../../lib/classification";
import { formatCount } from "../../lib/format";

const PfailDistribution = lazy(() => import("../charts/PfailDistribution"));

const SCENARIO_ID = "scen_00_100y";

function ClassificationBar({ byClassification, total }) {
  const ordered = CLASSIFICATION_ORDER.map((cls) =>
    byClassification.find((d) => d.classification_pfail === cls),
  ).filter(Boolean);

  return (
    <div>
      <div className="flex w-full h-7 rounded overflow-hidden border border-line">
        {ordered.map((d) => {
          const pct = (d.count / total) * 100;
          const darkText =
            d.classification_pfail === "MODERATE" ||
            d.classification_pfail === "LOW";
          return (
            <div
              key={d.classification_pfail}
              className="flex items-center justify-center text-xs font-medium"
              style={{
                width: `${pct}%`,
                backgroundColor: CLASSIFICATION_COLOR[d.classification_pfail],
                color: darkText ? "#0d1117" : "#e6edf3",
              }}
              title={`${d.classification_pfail}: ${d.count}`}
            >
              {pct >= 8 ? d.count : ""}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-xs">
        {ordered.map((d) => (
          <div
            key={d.classification_pfail}
            className="flex items-center gap-1.5"
          >
            <span
              className="inline-block w-3 h-3 rounded-sm border border-line"
              style={{
                backgroundColor: CLASSIFICATION_COLOR[d.classification_pfail],
              }}
            />
            <span className="text-ink font-medium">
              {d.classification_pfail}
            </span>
            <span className="text-ink-muted">{formatCount(d.count)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultsPanel() {
  const { data, isLoading, isError } = useVulnerabilitySummary(SCENARIO_ID);

  if (isLoading) {
    return (
      <div className="text-sm text-ink-muted">
        Loading vulnerability results.
      </div>
    );
  }
  if (isError) {
    return (
      <div className="bg-surface-raised border border-line text-elevated rounded-lg p-4 text-sm">
        Failed to load the vulnerability results.
      </div>
    );
  }

  const critical =
    data.by_classification.find((d) => d.classification_pfail === "CRITICAL")
      ?.count ?? 0;
  const elevated =
    data.by_classification.find((d) => d.classification_pfail === "ELEVATED")
      ?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="bg-surface-raised border border-line rounded-lg p-4">
        <div className="text-xs text-ink-muted uppercase tracking-wide">
          Satellites at severe risk
        </div>
        <div className="text-3xl font-semibold text-ink mt-1">
          {formatCount(critical + elevated)}
        </div>
        <div className="text-xs text-ink-muted mt-1">
          Critical and Elevated classes, of{" "}
          {formatCount(data.total_satellites)} analysed, under the
          one-in-one-hundred-year event.
        </div>
      </div>

      <div className="bg-surface-raised border border-line rounded-lg p-4">
        <h3 className="text-sm font-semibold text-ink mb-3">
          Fleet by failure probability class
        </h3>
        <ClassificationBar
          byClassification={data.by_classification}
          total={data.total_satellites}
        />
      </div>

      <div className="bg-surface-raised border border-line rounded-lg p-4">
        <h3 className="text-sm font-semibold text-ink mb-2">
          Failure probability distribution
        </h3>
        <Suspense
          fallback={
            <div className="text-xs text-ink-muted">Loading chart.</div>
          }
        >
          <PfailDistribution />
        </Suspense>
      </div>
    </div>
  );
}