/*
 * Role: Helpers for interpreting the fleet trajectory payload.
 * Author: Dennies Bor
 * Description:
 *   The fleet endpoint returns each satellite as parallel arrays of sample
 *   times and positions. These helpers extract a single current sample for
 *   static placement, and build a time-interpolated Cesium position property
 *   for animated placement. Keeping this logic here keeps the globe component
 *   focused on rendering.
 */

import {
    Cartesian3,
    JulianDate,
    SampledPositionProperty,
} from "cesium";

// Given a satellite's sample arrays, return the index of the sample whose
// timestamp is closest to the supplied reference time.
export function nearestSampleIndex(sat, referenceMs) {
    let bestIndex = 0;
    let bestDelta = Infinity;
    for (let i = 0; i < sat.t.length; i += 1) {
        const delta = Math.abs(new Date(sat.t[i]).getTime() - referenceMs);
        if (delta < bestDelta) {
            bestDelta = delta;
            bestIndex = i;
        }
    }
    return bestIndex;
}

// Return the satellite's current geodetic position as a plain object.
export function currentPosition(sat) {
    const idx = nearestSampleIndex(sat, Date.now());
    return {
        lat: sat.lat[idx],
        lon: sat.lon[idx],
        altKm: sat.alt_km[idx],
    };
}

// Build a time-interpolated Cesium position property from a satellite's
// sample arrays. Cesium interpolates between the supplied samples, so a
// satellite given sparse samples still moves smoothly as the clock runs.
export function buildPositionProperty(sat) {
    const property = new SampledPositionProperty();
    for (let i = 0; i < sat.t.length; i += 1) {
        const time = JulianDate.fromIso8601(new Date(sat.t[i]).toISOString());
        const position = Cartesian3.fromDegrees(
            sat.lon[i],
            sat.lat[i],
            sat.alt_km[i] * 1000,
        );
        property.addSample(time, position);
    }
    return property;
}

// Convert a trail payload's point list into an array of Cartesian3
// positions suitable for a Cesium polyline.
export function trailPositions(points) {
    return points.map((p) =>
        Cartesian3.fromDegrees(p.lon, p.lat, p.alt_km * 1000),
    );
}

// Split a trail's points into the portion at or before a reference time and
// the portion after it. The reference time is supplied as a millisecond
// timestamp. Returns two arrays of Cartesian3 positions. A single point is
// repeated across the boundary so the two segments meet without a gap.
export function splitTrail(points, referenceMs) {
    const past = [];
    const future = [];
    for (let i = 0; i < points.length; i += 1) {
        const p = points[i];
        const cart = Cartesian3.fromDegrees(p.lon, p.lat, p.alt_km * 1000);
        if (new Date(p.t).getTime() <= referenceMs) {
            past.push(cart);
        } else {
            future.push(cart);
        }
    }
    // Bridge the gap so the dashed and dotted segments touch at the boundary.
    if (past.length > 0 && future.length > 0) {
        future.unshift(past[past.length - 1]);
    }
    return { past, future };
}