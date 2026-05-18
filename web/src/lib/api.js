/*
 * Role: The single interface between the dashboard and the backend API.
 * Author: Dennies Bor
 * Description:
 *   Every network call the dashboard makes goes through this module. It owns
 *   the base URL and the endpoint paths, so no component contains a literal
 *   URL. Each function returns parsed JSON or throws on a non-success
 *   response, leaving retry and caching to the data-fetching layer. When the
 *   dashboard is later composed into a larger site, only the base URL here
 *   needs to change.
 */

// In development the Vite dev server proxies /api to the backend. In a
// deployed build this can be replaced with an absolute origin.
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function getJson(path) {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) {
        throw new Error(`Request to ${path} failed with status ${response.status}`);
    }
    return response.json();
}

// Vulnerability summary for a scenario: headline counts by class and regime.
export function fetchVulnerabilitySummary(scenarioId = "scen_00_100y") {
    return getJson(`/vulnerability/summary?scenario_id=${scenarioId}`);
}

// The P_fail distribution as a log-binned histogram.
export function fetchVulnerabilityDistribution(scenarioId = "scen_00_100y") {
    return getJson(`/vulnerability/distribution?scenario_id=${scenarioId}`);
}

// Current space weather summary: the latest sample from each live feed.
export function fetchLiveSummary() {
    return getJson("/live/now");
}

// The curated fleet for the globe: every high-regime satellite, every
// Critical and Elevated satellite, and a sampled background, with sampled
// trajectories over the forward window.
export function fetchFleet(scenarioId = "scen_00_100y") {
    return getJson(`/positions/fleet?scenario_id=${scenarioId}`);
}

// One satellite's full-resolution trajectory, for the trail drawn on click.
export function fetchTrail(noradId) {
    return getJson(`/positions/trail/${noradId}`);
}

// Backend liveness.
export function fetchHealth() {
    return getJson("/health");
}

// Recent solar wind time series for the dashboard sparklines.
export function fetchSolarWind(hours = 24) {
    return getJson(`/live/solar-wind?hours=${hours}`);
}

// Recent geomagnetic time series.
export function fetchGeomag(hours = 24) {
    return getJson(`/live/geomag?hours=${hours}`);
}

// Every analysed satellite for a scenario, with orbital placement and
// failure probability, for the vulnerability charts.
export function fetchAnalyzedFleet(scenarioId = "scen_00_100y") {
    return getJson(`/vulnerability/analyzed?scenario_id=${scenarioId}`);
}