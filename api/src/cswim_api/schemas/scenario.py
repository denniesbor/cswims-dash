"""
Role: Pydantic response schemas for storm scenario endpoints.
Author: Dennies Bor
Description:
    Mirrors the columns of the scenarios table. ScenarioRead is the read-only
    response model used by GET /api/scenarios. The from_attributes config
    lets FastAPI convert SQLAlchemy ORM instances to this schema directly
    without an explicit dict() step in every route handler.
"""

from pydantic import BaseModel, ConfigDict


class ScenarioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    scenario_id: str
    bootstrap_index: int
    return_period_years: int
    has_pfail: bool

    dst_min: float | None
    bz_min: float | None
    by_max: float | None
    v_max: float | None
    pdyn_max: float | None
    n_p_max: float | None
    kp_max: float | None

    j_gt10_peak: float | None
    j_gt30_peak: float | None
    j_gt100_peak: float | None
    fluence_gt10: float | None
    fluence_gt30: float | None
    fluence_gt100: float | None