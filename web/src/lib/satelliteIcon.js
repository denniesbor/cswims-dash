/*
 * Role: Generates satellite marker icons for the globe, coloured by class.
 * Author: Dennies Bor
 * Description:
 *   Cesium draws markers as billboards, which require an image. Rather than
 *   load an icon font, this module draws a simple satellite glyph onto a
 *   small canvas, once per vulnerability classification colour. Each canvas
 *   is cached and reused by every satellite of that class, so the cost is a
 *   handful of canvases regardless of fleet size. The glyph is a central body
 *   with two solar panels, filled in the classification colour with a thin
 *   dark outline so it remains visible against both land and ocean.
 */

import {
    CLASSIFICATION_COLOR,
    UNCLASSIFIED_COLOR,
} from "./classification";

const ICON_SIZE = 32;
const cache = new Map();

// Draw a single satellite glyph in the given colour onto a fresh canvas.
function drawSatelliteIcon(fillColor) {
    const canvas = document.createElement("canvas");
    canvas.width = ICON_SIZE;
    canvas.height = ICON_SIZE;
    const ctx = canvas.getContext("2d");

    const cx = ICON_SIZE / 2;
    const cy = ICON_SIZE / 2;

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#0f172a";
    ctx.fillStyle = fillColor;

    // Central body.
    const bodyW = 8;
    const bodyH = 10;
    ctx.beginPath();
    ctx.rect(cx - bodyW / 2, cy - bodyH / 2, bodyW, bodyH);
    ctx.fill();
    ctx.stroke();

    // Two solar panels, one each side of the body.
    const panelW = 9;
    const panelH = 6;
    const gap = 2;

    ctx.beginPath();
    ctx.rect(cx - bodyW / 2 - gap - panelW, cy - panelH / 2, panelW, panelH);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(cx + bodyW / 2 + gap, cy - panelH / 2, panelW, panelH);
    ctx.fill();
    ctx.stroke();

    return canvas;
}

// Return a cached icon canvas for a classification value. Unrecognised or
// missing classifications use the unclassified colour.
export function iconForClassification(classification) {
    const key = classification ?? "UNCLASSIFIED";
    if (cache.has(key)) {
        return cache.get(key);
    }
    const color = CLASSIFICATION_COLOR[classification] ?? UNCLASSIFIED_COLOR;
    const canvas = drawSatelliteIcon(color);
    cache.set(key, canvas);
    return canvas;
}