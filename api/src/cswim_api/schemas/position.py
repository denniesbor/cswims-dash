"""
Role: Pydantic response schemas for satellite position endpoints.
Author: Dennies Bor
Description:
    Two endpoints. /fleet returns every satellite's sampled trajectory over
    a short-tail-mostly-forward window, joined with vulnerability class, so
    the Cesium globe can render the whole fleet as moving, coloured points
    that the browser animates locally. /trail returns one satellite's
    full-resolution path, fetched on click. FleetSatellite carries static
    identity and p_fail plus a compact column-array form of the trajectory
    so the payload stays small over the wire.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FleetSatellite(BaseModel):
    """One satellite: identity, vulnerability, and a sampled track.

    The track is stored as parallel arrays rather than a list of point
    objects. For 13k satellites this roughly halves the JSON size by not
    repeating field names per sample.
    """
    norad_id: int
    name: str
    regime: str
    p_fail: float | None
    classification_pfail: str | None
    t: list[datetime]
    lat: list[float]
    lon: list[float]
    alt_km: list[float]


class FleetResponse(BaseModel):
    scenario_id: str
    window_start: datetime
    window_end: datetime
    satellite_count: int
    total_samples: int
    satellites: list[FleetSatellite]


class TrajectoryPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    t: datetime
    lat: float
    lon: float
    alt_km: float


class TrailResponse(BaseModel):
    norad_id: int
    name: str
    regime: str
    method: str | None
    p_fail: float | None
    classification_pfail: str | None
    window_start: datetime
    window_end: datetime
    count: int
    points: list[TrajectoryPoint]