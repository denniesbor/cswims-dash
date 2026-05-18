"""
Role: HTTP routes for satellite positions and trajectories.
Author: Dennies Bor
Description:
    Two endpoints over satellite_trajectories. /fleet returns every
    satellite's trajectory sampled over a short-tail-mostly-forward window
    (now-15min to now+2h), joined with vulnerability so each satellite
    arrives coloured. The samples are strided in SQL so the payload is a
    few hundred thousand points, not millions; Cesium interpolates between
    them for smooth motion. /trail/{norad_id} returns one satellite's
    full-resolution path over a caller-chosen window, fetched on click.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from cswim_api.db import get_session
from cswim_api.schemas.position import (
    FleetResponse,
    FleetSatellite,
    TrailResponse,
    TrajectoryPoint,
)


router = APIRouter(prefix="/positions", tags=["positions"])

VALID_REGIMES = {"LEO", "MEO", "GEO", "HEO"}

TAIL_MINUTES = 15
FORWARD_HOURS = 2.0
FLEET_SAMPLE_MINUTES = 10


@router.get("/fleet", response_model=FleetResponse)
async def fleet(
    scenario_id: str = Query("scen_00_100y"),
    regime: str | None = Query(None),
    sample_minutes: int = Query(
        FLEET_SAMPLE_MINUTES, ge=2, le=60,
        description="Spacing between returned samples; Cesium interpolates",
    ),
    limit: int = Query(
        1000, ge=1, le=20000,
        description="Maximum satellites returned. The default curated sample "
                    "shows all HEO, MEO and GEO satellites, all Critical and "
                    "Elevated LEO satellites, then a representative scatter of "
                    "the remaining LEO background up to this count.",
    ),
    offset: int = Query(
        0, ge=0,
        description="Number of satellites to skip in priority order. Used to "
                    "page in the full fleet when the user requests it.",
    ),
    session: AsyncSession = Depends(get_session),
) -> FleetResponse:
    """
    Return satellite trajectories over a short-tail-mostly-forward window,
    sampled in time and joined with vulnerability class.

    Satellites are returned in a fixed priority order. HEO, MEO and GEO
    satellites come first, since those regimes are small and entirely worth
    showing. Critical and Elevated LEO satellites come next, since those are
    the high-risk satellites in the regime that would otherwise dominate by
    count. The remaining LEO satellites follow in a stable scattered order.
    The limit and offset parameters select a slice of that ordering, so the
    default call returns a fast curated view and the caller can page in the
    rest.
    """
    if regime:
        regime = regime.upper()
        if regime not in VALID_REGIMES:
            raise HTTPException(400, detail=f"regime must be one of {sorted(VALID_REGIMES)}")

    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=TAIL_MINUTES)
    window_end = now + timedelta(hours=FORWARD_HOURS)

    # Step one. Decide which satellites to return, in priority order, before
    # touching the large trajectory table. This is a small query over the
    # satellites and vulnerability tables only.
    select_sql = """
    WITH ranked AS (
        SELECT
            s.norad_id,
            CASE
                WHEN s.regime IN ('HEO', 'MEO', 'GEO') THEN 0
                WHEN s.regime = 'LEO'
                     AND v.classification_pfail IN ('CRITICAL', 'ELEVATED') THEN 1
                ELSE 2
            END AS priority
        FROM satellites s
        LEFT JOIN vulnerability v
            ON v.norad_id = s.norad_id AND v.scenario_id = :scenario_id
        {regime_filter}
    )
    SELECT norad_id
    FROM ranked
    ORDER BY priority, md5(norad_id::text)
    LIMIT :limit OFFSET :offset
    """.format(regime_filter="WHERE s.regime = :regime" if regime else "")

    select_params: dict = {
        "scenario_id": scenario_id,
        "limit": limit,
        "offset": offset,
    }
    if regime:
        select_params["regime"] = regime

    selected_ids = [
        r["norad_id"]
        for r in (await session.execute(text(select_sql), select_params)).mappings().all()
    ]

    if not selected_ids:
        return FleetResponse(
            scenario_id=scenario_id,
            window_start=window_start,
            window_end=window_end,
            satellite_count=0,
            total_samples=0,
            satellites=[],
        )

    # Step two. Fetch trajectory samples for only the selected satellites.
    # Bucketing each satellite's rows into sample_minutes-wide time buckets
    # and taking the first row of each gives even time spacing regardless of
    # the underlying storage cadence, which varies by regime.
    track_sql = """
    WITH bucketed AS (
        SELECT
            sp.norad_id, sp.t, sp.lat, sp.lon, sp.alt_km,
            row_number() OVER (
                PARTITION BY sp.norad_id,
                    floor(extract(epoch FROM sp.t) / (:sample_sec))
                ORDER BY sp.t
            ) AS rn_in_bucket
        FROM satellite_trajectories sp
        WHERE sp.norad_id = ANY(:ids)
          AND sp.t >= :window_start AND sp.t <= :window_end
    )
    SELECT
        b.norad_id, b.t, b.lat, b.lon, b.alt_km,
        s.name, s.regime,
        v.p_fail, v.classification_pfail
    FROM bucketed b
    JOIN satellites s ON s.norad_id = b.norad_id
    LEFT JOIN vulnerability v
        ON v.norad_id = b.norad_id AND v.scenario_id = :scenario_id
    WHERE b.rn_in_bucket = 1
    ORDER BY b.norad_id, b.t
    """

    track_params = {
        "ids": selected_ids,
        "scenario_id": scenario_id,
        "window_start": window_start,
        "window_end": window_end,
        "sample_sec": sample_minutes * 60,
    }

    rows = (await session.execute(text(track_sql), track_params)).mappings().all()

    by_sat: dict[int, dict] = {}
    for r in rows:
        sat = by_sat.get(r["norad_id"])
        if sat is None:
            sat = {
                "norad_id": r["norad_id"],
                "name": r["name"],
                "regime": r["regime"],
                "p_fail": r["p_fail"],
                "classification_pfail": r["classification_pfail"],
                "t": [], "lat": [], "lon": [], "alt_km": [],
            }
            by_sat[r["norad_id"]] = sat
        sat["t"].append(r["t"])
        sat["lat"].append(r["lat"])
        sat["lon"].append(r["lon"])
        sat["alt_km"].append(r["alt_km"])

    satellites = [FleetSatellite(**s) for s in by_sat.values()]

    return FleetResponse(
        scenario_id=scenario_id,
        window_start=window_start,
        window_end=window_end,
        satellite_count=len(satellites),
        total_samples=len(rows),
        satellites=satellites,
    )


@router.get("/trail/{norad_id}", response_model=TrailResponse)
async def trail(
    norad_id: int,
    hours_back: float = Query(2.0, ge=0.0, le=24.0),
    hours_forward: float = Query(2.0, ge=0.0, le=14.0),
    scenario_id: str = Query("scen_00_100y"),
    session: AsyncSession = Depends(get_session),
) -> TrailResponse:
    """
    One satellite's full-resolution trajectory over a window around now.
    Fetched when the user clicks a satellite, to draw its trail (past) and
    forward path. Full storage cadence, no striding.
    """
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=hours_back)
    window_end = now + timedelta(hours=hours_forward)

    meta = (await session.execute(
        text("""
        SELECT s.name, s.regime, v.p_fail, v.classification_pfail
        FROM satellites s
        LEFT JOIN vulnerability v
            ON v.norad_id = s.norad_id AND v.scenario_id = :scenario_id
        WHERE s.norad_id = :nid
        """),
        {"nid": norad_id, "scenario_id": scenario_id},
    )).mappings().first()
    if meta is None:
        raise HTTPException(404, detail=f"satellite {norad_id} not found")

    rows = (await session.execute(
        text("""
        SELECT t, lat, lon, alt_km, method
        FROM satellite_trajectories
        WHERE norad_id = :nid AND t >= :ws AND t <= :we
        ORDER BY t
        """),
        {"nid": norad_id, "ws": window_start, "we": window_end},
    )).mappings().all()

    points = [
        TrajectoryPoint(t=r["t"], lat=r["lat"], lon=r["lon"], alt_km=r["alt_km"])
        for r in rows
    ]
    method = rows[0]["method"] if rows else None

    return TrailResponse(
        norad_id=norad_id,
        name=meta["name"],
        regime=meta["regime"],
        method=method,
        p_fail=meta["p_fail"],
        classification_pfail=meta["classification_pfail"],
        window_start=window_start,
        window_end=window_end,
        count=len(points),
        points=points,
    )