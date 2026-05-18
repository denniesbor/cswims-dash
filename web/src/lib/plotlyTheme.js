/*
 * Role: Shared Plotly theme for the dashboard charts.
 * Author: Dennies Bor
 * Description:
 *   Encodes the dark dashboard appearance once so every Plotly chart matches
 *   the interface. Provides a base layout with transparent backgrounds, the
 *   Inter typeface, muted gridlines and ticks, and tight margins, plus a
 *   config that strips the Plotly mode bar to keep the charts clean. Chart
 *   components spread baseLayout into their own layout and override only the
 *   axis titles, scales, and other chart-specific settings.
 */

// Colours pulled from the dashboard CSS tokens. Kept in sync with index.css.
const INK = "#e6edf3";
const INK_MUTED = "#8b97a6";
const LINE = "#2a313c";

export const baseLayout = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: {
        family: "Inter, system-ui, sans-serif",
        size: 12,
        color: INK_MUTED,
    },
    margin: { l: 52, r: 16, t: 8, b: 44 },
    xaxis: {
        gridcolor: LINE,
        zerolinecolor: LINE,
        linecolor: LINE,
        tickcolor: LINE,
        titlefont: { color: INK, size: 12 },
        automargin: true,
    },
    yaxis: {
        gridcolor: LINE,
        zerolinecolor: LINE,
        linecolor: LINE,
        tickcolor: LINE,
        titlefont: { color: INK, size: 12 },
        automargin: true,
    },
    bargap: 0.04,
    showlegend: false,
    hoverlabel: {
        bgcolor: "#161b22",
        bordercolor: LINE,
        font: { family: "Inter, system-ui, sans-serif", color: INK },
    },
};

// Strip the Plotly mode bar and disable the logo for a clean dashboard look.
export const baseConfig = {
    displayModeBar: false,
    responsive: true,
};