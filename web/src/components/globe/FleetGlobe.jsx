/*
 * Role: The three-dimensional globe for the dashboard.
 * Author: Dennies Bor
 * Description:
 *   Renders the Cesium globe and the satellite fleet. Each satellite is drawn
 *   as a small marker coloured by its vulnerability class, placed on a
 *   time-interpolated trajectory so it moves along its orbit as the Cesium
 *   clock advances. The globe uses Cesium ion imagery and terrain, with globe
 *   lighting enabled so the night side is shaded. Selecting a satellite draws
 *   its trajectory as a two-part trail: the portion already traversed is
 *   dashed, the portion still ahead is dotted, divided at the current clock
 *   time. The trail clears itself five seconds after it appears. The curated
 *   fleet is roughly one thousand satellites, which the entity renderer
 *   handles comfortably.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Color,
  ImageryLayer,
  JulianDate,
  PolylineDashMaterialProperty,
} from "cesium";
import {
  BillboardGraphics,
  Entity,
  PolylineGraphics,
  Viewer,
} from "resium";

import {
  VIEWER_OPTIONS,
  createImageryProvider,
  createTerrainProvider,
} from "../../lib/cesium";
import { useFleet } from "../../hooks/useFleet";
import { useTrail } from "../../hooks/useTrail";
import {
  buildPositionProperty,
  splitTrail,
} from "../../lib/fleet";
import { iconForClassification } from "../../lib/satelliteIcon";

// The trail is drawn in a single neutral colour so it reads as a path and is
// not confused with the classification colour of a satellite marker.
const TRAIL_COLOR = Color.fromCssColorString("#38bdf8");

function FleetEntities({ satellites }) {
  // Build the entity descriptors once per fleet payload. Each satellite is
  // given a time-interpolated position property so it moves along its
  // trajectory as the clock advances. The NORAD identifier is attached as an
  // entity property so it can be recovered when the satellite is selected.
  const entities = useMemo(() => {
    return satellites.map((sat) => ({
      key: `sat-${sat.norad_id}`,
      norad_id: sat.norad_id,
      name: sat.name,
      position: buildPositionProperty(sat),
      image: iconForClassification(sat.classification_pfail),
    }));
  }, [satellites]);

  return (
    <>
      {entities.map((e) => (
        <Entity
          key={e.key}
          name={e.name}
          position={e.position}
          properties={{ noradId: e.norad_id }}
        >
          <BillboardGraphics image={e.image} scale={0.8} />
        </Entity>
      ))}
    </>
  );
}

export default function FleetGlobe() {
  const { data, isLoading, isError, error } = useFleet();
  const viewerRef = useRef(null);
  const [imageryReady, setImageryReady] = useState(false);
  const [selectedNoradId, setSelectedNoradId] = useState(null);
  const [trailVisible, setTrailVisible] = useState(false);

  const { data: trail } = useTrail(selectedNoradId);

  // Resolve the asynchronous ion imagery and terrain providers, then set them
  // on the viewer. The imagery becomes the single base layer and the terrain
  // replaces the default, giving a realistic Earth surface.
  useEffect(() => {
    let cancelled = false;
    Promise.all([createImageryProvider(), createTerrainProvider()]).then(
      ([imageryProvider, terrainProvider]) => {
        if (cancelled) {
          return;
        }
        const viewer = viewerRef.current?.cesiumElement;
        if (!viewer) {
          return;
        }
        viewer.imageryLayers.removeAll();
        viewer.imageryLayers.add(new ImageryLayer(imageryProvider));
        viewer.terrainProvider = terrainProvider;
        setImageryReady(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Enable globe lighting so the night side is shaded, following the real
  // position of the sun. Whether a satellite is sunlit or in eclipse is a
  // genuine physical condition, so this is informative as well as realistic.
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) {
      return;
    }
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.dynamicAtmosphereLighting = true;
    viewer.scene.globe.showGroundAtmosphere = true;
  }, [imageryReady]);

  // Set the clock to the fleet's time window once the fleet has loaded. The
  // clock starts at the current time, is bounded to the window the fleet data
  // covers, and advances fast enough that orbital motion is visible. The
  // timeline at the foot of the globe reflects this range.
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer || !data) {
      return;
    }
    const start = JulianDate.fromIso8601(
      new Date(data.window_start).toISOString(),
    );
    const stop = JulianDate.fromIso8601(
      new Date(data.window_end).toISOString(),
    );
    const now = JulianDate.fromIso8601(new Date().toISOString());

    viewer.clock.startTime = start;
    viewer.clock.stopTime = stop;
    viewer.clock.currentTime = now;
    viewer.clock.clockRange = 2;
    viewer.clock.multiplier = 60;
    viewer.clock.shouldAnimate = true;

    if (viewer.timeline) {
      viewer.timeline.zoomTo(start, stop);
    }
  }, [data]);

  // Track which satellite the user has selected. The NORAD identifier is
  // stored as an entity property; read it back when the selection changes.
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) {
      return;
    }
    const listener = () => {
      const entity = viewer.selectedEntity;
      const noradProp = entity?.properties?.noradId;
      if (noradProp) {
        const value = noradProp.getValue(viewer.clock.currentTime);
        setSelectedNoradId(value ?? null);
      } else {
        setSelectedNoradId(null);
      }
    };
    viewer.selectedEntityChanged.addEventListener(listener);
    return () => {
      viewer.selectedEntityChanged.removeEventListener(listener);
    };
  }, [imageryReady]);

  // When a trail for a newly selected satellite arrives, show it, then hide
  // it again after five seconds. Selecting another satellite restarts the
  // timer, so an earlier timeout cannot hide a later trail.
  useEffect(() => {
    if (!trail) {
      setTrailVisible(false);
      return;
    }
    setTrailVisible(true);
    const timer = setTimeout(() => setTrailVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [trail]);

  // Split the trail into the portion already traversed and the portion still
  // ahead, divided at the current clock time so the boundary sits at the
  // satellite. The past is drawn dashed, the future dotted.
  const trailSegments = useMemo(() => {
    if (!trail || !trail.points || trail.points.length === 0) {
      return null;
    }
    const viewer = viewerRef.current?.cesiumElement;
    const clockMs = viewer
      ? JulianDate.toDate(viewer.clock.currentTime).getTime()
      : Date.now();
    return splitTrail(trail.points, clockMs);
  }, [trail]);

  return (
    <div className="relative w-full h-[78vh] min-h-[520px] rounded-lg overflow-hidden border border-line">
      <Viewer
        ref={viewerRef}
        full={false}
        style={{ width: "100%", height: "100%" }}
        {...VIEWER_OPTIONS}
      >
        {data && <FleetEntities satellites={data.satellites} />}

        {trailVisible && trailSegments && trailSegments.past.length > 1 && (
          <Entity key={`trail-past-${selectedNoradId}`}>
            <PolylineGraphics
              positions={trailSegments.past}
              width={2}
              material={
                new PolylineDashMaterialProperty({
                  color: TRAIL_COLOR,
                  dashLength: 16,
                })
              }
            />
          </Entity>
        )}

        {trailVisible && trailSegments && trailSegments.future.length > 1 && (
          <Entity key={`trail-future-${selectedNoradId}`}>
            <PolylineGraphics
              positions={trailSegments.future}
              width={2}
              material={
                new PolylineDashMaterialProperty({
                  color: TRAIL_COLOR,
                  dashLength: 4,
                  dashPattern: 255,
                })
              }
            />
          </Entity>
        )}
      </Viewer>

      {isLoading && (
        <div className="absolute top-3 left-3 bg-surface border border-line rounded px-3 py-2 text-sm text-ink-muted">
          Loading fleet.
        </div>
      )}
      {isError && (
        <div className="absolute top-3 left-3 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-800">
          Failed to load the fleet. {error.message}
        </div>
      )}
      {data && (
        <div className="absolute top-3 left-3 bg-surface border border-line rounded px-3 py-2 text-sm text-ink">
          {data.satellite_count.toLocaleString()} satellites shown
        </div>
      )}
    </div>
  );
}