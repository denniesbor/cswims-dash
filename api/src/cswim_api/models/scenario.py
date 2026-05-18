"""
Role: ORM model for SEP storm scenarios.
Author: Dennies Bor
Description:
    Mirrors sep_scenarios_joint.csv. Each row is one joint bootstrap
    realisation at one return period (e.g. scen_03 at 100 yr). The
    has_pfail flag marks which scenarios have full vulnerability outputs
    computed. In v1 only scen_00 at 100 yr has has_pfail=True; the
    others are read-only context for future research extensions.
"""

from sqlalchemy import Boolean, CheckConstraint, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from cswim_api.models.base import Base


class Scenario(Base):
    __tablename__ = "scenarios"
    __table_args__ = (
        CheckConstraint(
            "return_period_years IN (50, 100, 150)",
            name="return_period_valid",
        ),
    )

    scenario_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    bootstrap_index: Mapped[int] = mapped_column(Integer, nullable=False)
    return_period_years: Mapped[int] = mapped_column(Integer, nullable=False)

    dst_min: Mapped[float | None] = mapped_column(Float)
    bz_min: Mapped[float | None] = mapped_column(Float)
    by_max: Mapped[float | None] = mapped_column(Float)
    v_max: Mapped[float | None] = mapped_column(Float)
    pdyn_max: Mapped[float | None] = mapped_column(Float)
    n_p_max: Mapped[float | None] = mapped_column(Float)
    kp_max: Mapped[float | None] = mapped_column(Float)

    j_gt10_peak: Mapped[float | None] = mapped_column(Float)
    j_gt30_peak: Mapped[float | None] = mapped_column(Float)
    j_gt100_peak: Mapped[float | None] = mapped_column(Float)
    fluence_gt10: Mapped[float | None] = mapped_column(Float)
    fluence_gt30: Mapped[float | None] = mapped_column(Float)
    fluence_gt100: Mapped[float | None] = mapped_column(Float)

    has_pfail: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)