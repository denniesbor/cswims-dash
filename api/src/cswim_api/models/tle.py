"""
Role: ORM models for TLEs and propagated satellite trajectories.
Author: Dennies Bor
Description:
    Tle holds the latest two-line element set per satellite. SatelliteTrajectory
    holds time-series positions: one row per (satellite, timestamp), generated
    by propagating forward from the latest TLE for a horizon longer than the
    refresh cadence. Cadence is regime-dependent (LEO/HEO 60s, MEO 120s, GEO
    300s). Old rows are cleaned up periodically; the table is treated as a
    rolling 72-hour window. BRIN index on t makes time-range queries fast
    while keeping the index tiny.
"""

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from cswim_api.models.base import Base


class Tle(Base):
    __tablename__ = "tles"

    norad_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("satellites.norad_id"), primary_key=True
    )
    epoch: Mapped["DateTime"] = mapped_column(DateTime(timezone=True), nullable=False)
    line1: Mapped[str] = mapped_column(Text, nullable=False)
    line2: Mapped[str] = mapped_column(Text, nullable=False)
    object_name: Mapped[str | None] = mapped_column(String(64))
    fetched_at: Mapped["DateTime"] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )
    source: Mapped[str] = mapped_column(String(16), nullable=False, server_default="SPACETRACK")


class SatelliteTrajectory(Base):
    __tablename__ = "satellite_trajectories"
    __table_args__ = (
        Index("ix_trajectories_t_brin", "t", postgresql_using="brin"),
        Index("ix_trajectories_norad_t", "norad_id", "t"),
    )

    norad_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("satellites.norad_id"), primary_key=True
    )
    t: Mapped["DateTime"] = mapped_column(DateTime(timezone=True), primary_key=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
    alt_km: Mapped[float] = mapped_column(Float, nullable=False)
    method: Mapped[str] = mapped_column(String(8), nullable=False)
    tle_epoch: Mapped["DateTime | None"] = mapped_column(DateTime(timezone=True))