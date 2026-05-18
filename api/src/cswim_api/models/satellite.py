"""
Role: ORM model for the active satellite fleet.
Author: Dennies Bor
Description:
    Mirrors classified_satellites.parquet from the C-SWIM pipeline. One row per
    NORAD-catalogued active payload. Orbital regime, classification, and
    operator come from the merged Space-Track + Planet4589 + manual mapping
    upstream; they are treated as facts here, not recomputed.
"""

from sqlalchemy import CheckConstraint, Date, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from cswim_api.models.base import Base


class Satellite(Base):
    __tablename__ = "satellites"
    __table_args__ = (
        CheckConstraint(
            "regime IN ('LEO', 'MEO', 'GEO', 'HEO')",
            name="regime_valid",
        ),
        Index("ix_satellites_regime", "regime"),
        Index("ix_satellites_classification", "classification"),
        Index("ix_satellites_un_state", "un_state"),
    )

    norad_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    operator: Mapped[str | None] = mapped_column(String(256))
    un_state: Mapped[str | None] = mapped_column(String(128))
    launch_date: Mapped["Date | None"] = mapped_column(Date)
    mass_kg: Mapped[float | None] = mapped_column(Float)
    regime: Mapped[str] = mapped_column(String(8), nullable=False)
    classification: Mapped[str | None] = mapped_column(String(64))
    constellation: Mapped[str | None] = mapped_column(String(128))
    perigee_km: Mapped[float | None] = mapped_column(Float)
    apogee_km: Mapped[float | None] = mapped_column(Float)
    inclination_deg: Mapped[float | None] = mapped_column(Float)
    altitude_km: Mapped[float | None] = mapped_column(Float)
    elapsed_yrs: Mapped[float | None] = mapped_column(Float)