"""
Role: HTTP routes for storm scenario metadata.
Author: Dennies Bor
Description:
    Exposes the 30 GPD-derived storm scenarios (10 bootstrap realisations
    times 3 return periods). GET /api/scenarios returns all of them sorted
    by return period then bootstrap index, which is the natural display
    order for a scenario picker. GET /api/scenarios/{scenario_id} returns a
    single scenario or 404. No pagination; the result set is bounded at 30.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from cswim_api.db import get_session
from cswim_api.models import Scenario
from cswim_api.schemas.scenario import ScenarioRead


router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("", response_model=list[ScenarioRead])
async def list_scenarios(session: AsyncSession = Depends(get_session)) -> list[Scenario]:
    stmt = select(Scenario).order_by(
        Scenario.return_period_years,
        Scenario.bootstrap_index,
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.get("/{scenario_id}", response_model=ScenarioRead)
async def get_scenario(
    scenario_id: str,
    session: AsyncSession = Depends(get_session),
) -> Scenario:
    result = await session.execute(
        select(Scenario).where(Scenario.scenario_id == scenario_id)
    )
    scenario = result.scalar_one_or_none()
    if scenario is None:
        raise HTTPException(status_code=404, detail=f"scenario '{scenario_id}' not found")
    return scenario