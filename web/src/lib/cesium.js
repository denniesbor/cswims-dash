/*
 * Role: Cesium configuration for the dashboard.
 * Author: Dennies Bor
 * Description:
 *   Centralises Cesium setup. The dashboard uses a Cesium ion account. The
 *   ion access token is read from the VITE_CESIUM_ION_TOKEN environment
 *   variable so it is not hardcoded in source. Imagery is a realistic global
 *   satellite layer from ion and terrain is ion world terrain. Globe
 *   lighting, enabled in the globe component, shades the night side. No night
 *   lights layer is used, so the globe shows a realistic daytime Earth with a
 *   day and night terminator and no city lights.
 */

import {
    Ion,
    createWorldImageryAsync,
    createWorldTerrainAsync,
} from "cesium";

// The ion access token is supplied through the environment. Vite only
// exposes variables prefixed with VITE_ to the browser.
Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN ?? "";

// Realistic global satellite imagery from Cesium ion. Returns a promise,
// so the globe component resolves it before adding the layer.
export function createImageryProvider() {
    return createWorldImageryAsync();
}

// Cesium ion world terrain, which gives the globe real elevation relief.
// Returns a promise, resolved by the globe component.
export function createTerrainProvider() {
    return createWorldTerrainAsync();
}

// Default options applied to the Cesium viewer. Widgets not relevant to this
// dashboard are disabled, leaving the globe, the navigation, and the clock
// and timeline that drive the live animation.
export const VIEWER_OPTIONS = {
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    timeline: true,
    animation: true,
};