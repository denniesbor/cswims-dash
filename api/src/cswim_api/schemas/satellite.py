"""
Role: Pydantic response schemas for satellite catalog endpoints.
Author: Dennies Bor
Description:
    SatelliteRead exposes the columns relevant to a fleet listing or detail
    view. SatelliteList wraps a page of results with the total count for the
    matched query so the frontend can render pagination controls without
    issuing a separate count request. ScenarioRead naming convention is
    followed throughout: read-only models, from_attributes=True so FastAPI
    can convert ORM rows directly.
"""

from datetime import date

from pydantic import BaseModel, ConfigDict


class SatelliteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    norad_id: int
    name: str
    operator: str | None
    un_state: str | None
    launch_date: date | None
    mass_kg: float | None
    regime: str
    classification: str | None
    constellation: str | None
    perigee_km: float | None
    apogee_km: float | None
    inclination_deg: float | None
    altitude_km: float | None
    elapsed_yrs: float | None


class SatelliteList(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[SatelliteRead]