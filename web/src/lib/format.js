/*
 * Role: Consistent formatting of numbers, units, and scientific notation.
 * Author: Dennies Bor
 * Description:
 *   A scientific dashboard must render quantities consistently. Large counts
 *   carry thousands separators. Quantities that span many orders of magnitude,
 *   such as the failure probability, are shown in scientific notation. Units
 *   are kept separate from values so they can be styled in roman type. Every
 *   component formats numbers through this module rather than calling toFixed
 *   or toLocaleString directly, so the presentation is uniform.
 */

// Format an integer count with thousands separators, for example 10650
// becomes "10,650".
export function formatCount(value) {
    if (value === null || value === undefined) {
        return "n/a";
    }
    return value.toLocaleString("en-US");
}

// Format a value in scientific notation with a chosen number of significant
// figures, returning the mantissa and exponent separately so a component can
// typeset the exponent as a superscript. For example 0.000509 with two
// significant figures returns { mantissa: "5.1", exponent: -4 }.
export function toScientific(value, sigFigs = 2) {
    if (value === null || value === undefined || value === 0) {
        return { mantissa: "0", exponent: 0 };
    }
    const exponent = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = value / Math.pow(10, exponent);
    return {
        mantissa: mantissa.toFixed(sigFigs - 1),
        exponent,
    };
}

// Format a plain decimal to a fixed number of places. Use for quantities
// that do not span scales, such as a probability already known to be
// order one, or a percentage.
export function formatFixed(value, places = 2) {
    if (value === null || value === undefined) {
        return "n/a";
    }
    return value.toFixed(places);
}

// Format a quantity together with its unit. The value and unit are returned
// as a single string with a thin space between them. Components that need
// to style the unit separately should call the parts individually instead.
export function formatWithUnit(value, unit, places = 1) {
    if (value === null || value === undefined) {
        return "n/a";
    }
    return `${value.toFixed(places)}\u2009${unit}`;
}

// Format an ISO timestamp as a compact UTC string for display, for example
// "2026-05-16 16:44 UTC".
export function formatUtc(isoString) {
    if (!isoString) {
        return "n/a";
    }
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, "0");
    return (
        `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
        `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
    );
}