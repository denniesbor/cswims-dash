"""
Role: Pydantic response schemas for live space weather endpoints.
Author: Dennies Bor
Description:
    Read models for the three feeds and a Summary model for the dashboard
    header strip. Each row schema mirrors its table directly. SummaryResponse
    flattens the latest sample from each feed into one object the frontend
    can render without extra fetches.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SolarWindRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    t: datetime
    bx_gsm: float | None
    by_gsm: float | None
    bz_gsm: float | None
    bt: float | None
    v: float | None
    n_p: float | None
    temperature: float | None
    p_dyn: float | None


class GeomagRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    t: datetime
    kp: float | None
    dst_estimate: float | None


class ProtonFluxRow(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    t: datetime
    satellite: str
    flux_gt10: float | None
    flux_gt50: float | None
    flux_gt100: float | None


class SummaryResponse(BaseModel):
    solar_wind: SolarWindRow | None
    geomag: GeomagRow | None
    proton_flux: ProtonFluxRow | None