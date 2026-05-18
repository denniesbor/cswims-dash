/*
 * Role: Single source of truth for the satellite vulnerability classification scheme.
 * Author: Dennies Bor
 * Description:
 *   The C-SWIM analysis sorts satellites into five vulnerability classes by
 *   failure probability, plus an unanalysed category. This module defines the
 *   class order, the colour assigned to each class, and helper lookups. Every
 *   component that renders a classification, the globe, the histograms, the
 *   tables, the legends, imports from here so the dashboard is visually
 *   consistent and a single edit re-themes the whole application. The colours
 *   are chosen to remain distinguishable in greyscale print and under common
 *   forms of colour vision deficiency.
 */

// Ordered from most to least severe. This order is used for legends,
// stacked bars, and table sorting throughout the dashboard.
export const CLASSIFICATION_ORDER = [
    "CRITICAL",
    "ELEVATED",
    "MODERATE",
    "LOW",
    "NEGLIGIBLE",
];

export const CLASSIFICATION_COLOR = {
    CRITICAL: "#67001f",
    ELEVATED: "#d6604d",
    MODERATE: "#fddbc7",
    LOW: "#92c5de",
    NEGLIGIBLE: "#053061",
};

export const UNCLASSIFIED_COLOR = "#3f4756";

// A short human-readable description of what each class means, suitable
// for tooltips and legend captions. P_fail is the modelled probability
// of dose-induced failure under the scenario.
export const CLASSIFICATION_DESCRIPTION = {
    CRITICAL: "Failure probability above 1 in 100",
    ELEVATED: "Failure probability between 1 in 1000 and 1 in 100",
    MODERATE: "Failure probability between 1 in 100000 and 1 in 1000",
    LOW: "Failure probability between 1 in 10 million and 1 in 100000",
    NEGLIGIBLE: "Failure probability below 1 in 10 million",
};

// Return the colour for a classification value, falling back to the
// unclassified colour when the value is null, undefined, or unrecognised.
export function colorForClassification(classification) {
    if (!classification) {
        return UNCLASSIFIED_COLOR;
    }
    return CLASSIFICATION_COLOR[classification] ?? UNCLASSIFIED_COLOR;
}

// Return a display label for a classification value. Unanalysed satellites
// are labelled explicitly rather than shown as blank.
export function labelForClassification(classification) {
    return classification ?? "NOT ANALYSED";
}