"""
Role: HTTP routes for the satellite catalog.
Author: Dennies Bor
Description:
    GET /api/satellites lists satellites with filtering (regime, classification,
    un_state, search by name) and pagination (limit + offset). The endpoint
    returns both the page of items and the total matched count in one response
    so the frontend can render pagination controls without a second request.
    GET /api/satellites/{norad_id} returns one satellite or 404. Filter
    parameters are optional and combine with AND semantics.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from cswim_api.db import get_session
from cswim_api.models import Satellite
from cswim_api.schemas.satellite import SatelliteList, SatelliteRead


router = APIRouter(prefix="/satellites", tags=["satellites"])


@router.get("", response_model=SatelliteList)
async def list_satellites(
    regime: str | None = Query(None, description="Filter to LEO, MEO, GEO, or HEO"),
    classification: str | None = Query(None, description="Substring match on mission class"),
    un_state: str | None = Query(None, description="Filter by UN-registered launch state"),
    q: str | None = Query(None, description="Case-insensitive substring match on name"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
) -> SatelliteList:
    base = select(Satellite)

    if regime:
        regime = regime.upper()
        if regime not in {"LEO", "MEO", "GEO", "HEO"}:
            raise HTTPException(400, detail=f"regime must be LEO|MEO|GEO|HEO, got {regime!r}")
        base = base.where(Satellite.regime == regime)

    if classification:
        base = base.where(Satellite.classification.ilike(f"%{classification}%"))

    if un_state:
        base = base.where(Satellite.un_state == un_state.upper())

    if q:
        base = base.where(Satellite.name.ilike(f"%{q}%"))

    total = (await session.execute(
        select(func.count()).select_from(base.subquery())
    )).scalar_one()

    page_stmt = base.order_by(Satellite.norad_id).limit(limit).offset(offset)
    result = await session.execute(page_stmt)
    items = list(result.scalars().all())

    return SatelliteList(total=total, limit=limit, offset=offset, items=items)


@router.get("/{norad_id}", response_model=SatelliteRead)
async def get_satellite(
    norad_id: int,
    session: AsyncSession = Depends(get_session),
) -> Satellite:
    result = await session.execute(
        select(Satellite).where(Satellite.norad_id == norad_id)
    )
    sat = result.scalar_one_or_none()
    if sat is None:
        raise HTTPException(404, detail=f"satellite {norad_id} not found")
    return sat