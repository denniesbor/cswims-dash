"""
Role: ORM models for live space weather telemetry (DSCOVR, SWPC, GOES).
Author: Dennies Bor
Description:
    Mirrors the three real-time feeds we ingest from NOAA SWPC. SolarWindLive
    holds DSCOVR plasma plus magnetic field merged on a common timestamp.
    GeomagLive holds the Kp nowcast and a Dst estimate derived from Kp via
    the inverse of the heuristic used in the C-SWIM paper. ProtonFluxLive
    holds integral proton flux at three energy channels from the primary
    GOES satellite. Tables are append-only with t as the time axis; refresh
    runs upsert by primary key so re-fetches of the same window are idempotent.
"""

from sqlalchemy import DateTime, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from cswim_api.models.base import Base


class SolarWindLive(Base):
    __tablename__ = "solar_wind_live"

    t: Mapped["DateTime"] = mapped_column(DateTime(timezone=True), primary_key=True)
    bx_gsm: Mapped[float | None] = mapped_column(Float)
    by_gsm: Mapped[float | None] = mapped_column(Float)
    bz_gsm: Mapped[float | None] = mapped_column(Float)
    bt: Mapped[float | None] = mapped_column(Float)
    v: Mapped[float | None] = mapped_column(Float)
    n_p: Mapped[float | None] = mapped_column(Float)
    temperature: Mapped[float | None] = mapped_column(Float)
    p_dyn: Mapped[float | None] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(32), nullable=False, server_default="SWPC-DSCOVR")


class GeomagLive(Base):
    __tablename__ = "geomag_live"

    t: Mapped["DateTime"] = mapped_column(DateTime(timezone=True), primary_key=True)
    kp: Mapped[float | None] = mapped_column(Float)
    dst_estimate: Mapped[float | None] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(32), nullable=False, server_default="SWPC")


class ProtonFluxLive(Base):
    __tablename__ = "proton_flux_live"

    t: Mapped["DateTime"] = mapped_column(DateTime(timezone=True), primary_key=True)
    satellite: Mapped[str] = mapped_column(String(16), primary_key=True)
    flux_gt10: Mapped[float | None] = mapped_column(Float)
    flux_gt50: Mapped[float | None] = mapped_column(Float)
    flux_gt100: Mapped[float | None] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(32), nullable=False, server_default="SWPC-GOES")