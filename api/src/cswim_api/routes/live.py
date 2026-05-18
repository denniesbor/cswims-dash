"""
Role: HTTP routes for live space weather telemetry.
Author: Dennies Bor
Description:
    Four endpoints, all read-only. Each list endpoint takes an `hours`
    parameter bounded at 1-168 (one hour to one week) and returns rows
    in chronological order, suitable for direct line-plotting. /now
    returns the latest sample from each feed in one object for the
    dashboard header.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from cswim_api.db import get_session
from cswim_api.models import GeomagLive, ProtonFluxLive, SolarWindLive
from cswim_api.schemas.live import (
    GeomagRow,
    ProtonFluxRow,
    SolarWindRow,
    SummaryResponse,
)


router = APIRouter(prefix="/live", tags=["live"])


def _window_start(hours: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(hours=hours)


@router.get("/solar-wind", response_model=list[SolarWindRow])
async def solar_wind(
    hours: int = Query(24, ge=1, le=168),
    session: AsyncSession = Depends(get_session),
) -> list[SolarWindLive]:
    stmt = (
        select(SolarWindLive)
        .where(SolarWindLive.t >= _window_start(hours))
        .order_by(SolarWindLive.t)
    )
    return list((await session.execute(stmt)).scalars().all())


@router.get("/geomag", response_model=list[GeomagRow])
async def geomag(
    hours: int = Query(24, ge=1, le=168),
    session: AsyncSession = Depends(get_session),
) -> list[GeomagLive]:
    stmt = (
        select(GeomagLive)
        .where(GeomagLive.t >= _window_start(hours))
        .order_by(GeomagLive.t)
    )
    return list((await session.execute(stmt)).scalars().all())


@router.get("/proton-flux", response_model=list[ProtonFluxRow])
async def proton_flux(
    hours: int = Query(24, ge=1, le=168),
    satellite: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
) -> list[ProtonFluxLive]:
    stmt = (
        select(ProtonFluxLive)
        .where(ProtonFluxLive.t >= _window_start(hours))
        .order_by(ProtonFluxLive.t, ProtonFluxLive.satellite)
    )
    if satellite:
        stmt = stmt.where(ProtonFluxLive.satellite == satellite)
    return list((await session.execute(stmt)).scalars().all())


@router.get("/now", response_model=SummaryResponse)
async def now(
    session: AsyncSession = Depends(get_session),
) -> SummaryResponse:
    sw_stmt = select(SolarWindLive).order_by(desc(SolarWindLive.t)).limit(1)
    gm_stmt = select(GeomagLive).order_by(desc(GeomagLive.t)).limit(1)
    pf_stmt = select(ProtonFluxLive).order_by(desc(ProtonFluxLive.t)).limit(1)

    sw = (await session.execute(sw_stmt)).scalar_one_or_none()
    gm = (await session.execute(gm_stmt)).scalar_one_or_none()
    pf = (await session.execute(pf_stmt)).scalar_one_or_none()

    return SummaryResponse(
        solar_wind=SolarWindRow.model_validate(sw) if sw else None,
        geomag=GeomagRow.model_validate(gm) if gm else None,
        proton_flux=ProtonFluxRow.model_validate(pf) if pf else None,
    )