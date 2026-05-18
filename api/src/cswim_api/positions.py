"""
Role: Generate satellite trajectories by propagating forward from latest TLEs.
Author: Dennies Bor
Description:
    For each satellite with a current TLE, runs SGP4 forward from now() for
    HORIZON_HOURS at regime-appropriate cadence (LEO/HEO 60s, MEO 120s, GEO
    300s). For satellites without a TLE but with catalog elements, runs a
    closed-form two-body propagation. Frame conversion TEME -> ITRS ->
    geodetic via astropy. Writes (norad_id, t, lat, lon, alt_km) rows in
    bulk to satellite_trajectories with ON CONFLICT update so overlapping
    propagation runs from successive cycles seamlessly replace older values.
    Per-satellite failures are caught and counted; one bad TLE does not
    halt the run.
"""

import asyncio
from datetime import datetime, timedelta, timezone

import numpy as np
from astropy import units as u
from astropy.coordinates import ITRS, TEME, EarthLocation
from astropy.time import Time
from sgp4.api import Satrec, jday
from sqlalchemy import select, text

from cswim_api.db import session_scope
from cswim_api.models import Satellite, Tle


HORIZON_HOURS = 14

CADENCE_SEC = {
    "LEO": 60,
    "HEO": 60,
    "MEO": 120,
    "GEO": 300,
}
DEFAULT_CADENCE_SEC = 120

R_EARTH = 6378.137
MU_EARTH = 398600.4418
MIN_ALT_KM = 100
MAX_ALT_KM = 500_000

BULK_INSERT_BATCH = 5000


def _step_times(t_start: datetime, horizon_hours: int, dt_sec: int) -> list[datetime]:
    n_steps = int(horizon_hours * 3600 / dt_sec) + 1
    return [t_start + timedelta(seconds=i * dt_sec) for i in range(n_steps)]


def _sgp4_track(
    line1: str,
    line2: str,
    times: list[datetime],
) -> list[tuple[float, float, float]] | None:
    """Return list of TEME (x, y, z) km at each time, or None on parse fail."""
    try:
        sat = Satrec.twoline2rv(line1, line2)
    except Exception:
        return None

    out = []
    for t in times:
        jd, fr = jday(
            t.year, t.month, t.day,
            t.hour, t.minute, t.second + t.microsecond / 1e6,
        )
        err, r, _ = sat.sgp4(jd, fr)
        if err != 0 or not all(np.isfinite(r)):
            out.append(None)
            continue
        out.append(r)
    return out


def _kepler_track(
    perigee_km: float,
    apogee_km: float,
    inclination_deg: float,
    times: list[datetime],
) -> list[tuple[float, float, float]]:
    """
    Closed-form two-body propagation for satellites without TLEs.
    Advances mean anomaly forward by elapsed seconds since first time
    in the list. Position computed in perifocal frame, rotated to ECI
    by inclination only (no RAAN or argument of perigee — we don't have
    them from catalog elements).
    """
    rp = perigee_km + R_EARTH
    ra = apogee_km + R_EARTH
    a = (rp + ra) / 2.0
    e = (ra - rp) / (ra + rp)
    n = np.sqrt(MU_EARTH / a**3)  # mean motion rad/s
    inc = np.radians(inclination_deg)

    rot = np.array([
        [1, 0, 0],
        [0, np.cos(inc), -np.sin(inc)],
        [0, np.sin(inc), np.cos(inc)],
    ])

    t0 = times[0]
    positions = []
    for t in times:
        dt = (t - t0).total_seconds()
        M = n * dt  # mean anomaly from perigee
        # solve Kepler's equation: M = E - e sin E
        E = M
        for _ in range(8):
            E = E - (E - e * np.sin(E) - M) / (1 - e * np.cos(E))
        true_anom = 2 * np.arctan2(
            np.sqrt(1 + e) * np.sin(E / 2),
            np.sqrt(1 - e) * np.cos(E / 2),
        )
        r_mag = a * (1 - e * np.cos(E))
        r_pf = np.array([r_mag * np.cos(true_anom), r_mag * np.sin(true_anom), 0.0])
        r_eci = rot @ r_pf
        positions.append(tuple(r_eci))
    return positions


def _teme_to_geodetic_batch(
    positions: list[tuple[float, float, float] | None],
    times: list[datetime],
) -> list[tuple[float, float, float] | None]:
    """Convert a list of TEME positions to geodetic in one astropy call."""
    valid_indices = [i for i, p in enumerate(positions) if p is not None]
    if not valid_indices:
        return [None] * len(positions)

    xs = np.array([positions[i][0] for i in valid_indices])
    ys = np.array([positions[i][1] for i in valid_indices])
    zs = np.array([positions[i][2] for i in valid_indices])
    ts = Time([times[i] for i in valid_indices])

    teme = TEME(
        x=xs * u.km, y=ys * u.km, z=zs * u.km,
        representation_type="cartesian", obstime=ts,
    )
    itrs = teme.transform_to(ITRS(obstime=ts))
    loc = EarthLocation.from_geocentric(itrs.x, itrs.y, itrs.z)
    lats = loc.lat.deg
    lons = loc.lon.deg
    alts = loc.height.to(u.km).value

    out: list[tuple[float, float, float] | None] = [None] * len(positions)
    for idx, valid_idx in enumerate(valid_indices):
        lat = float(lats[idx])
        lon = float(lons[idx])
        alt = float(alts[idx])
        if not (np.isfinite(lat) and np.isfinite(lon) and np.isfinite(alt)):
            continue
        if alt < MIN_ALT_KM or alt > MAX_ALT_KM:
            continue
        out[valid_idx] = (lat, lon, alt)
    return out


async def _load_inputs() -> list[dict]:
    async with session_scope() as session:
        result = await session.execute(
            select(
                Satellite.norad_id,
                Satellite.regime,
                Satellite.perigee_km,
                Satellite.apogee_km,
                Satellite.inclination_deg,
                Tle.line1,
                Tle.line2,
                Tle.epoch,
            ).join(Tle, Tle.norad_id == Satellite.norad_id, isouter=True)
        )
        return [dict(r._mapping) for r in result.all()]


def _propagate_one(
    sat: dict,
    t_start: datetime,
    horizon_hours: int,
) -> tuple[list[dict], str]:
    """
    Returns (rows, method). rows is empty on failure.
    Method is one of 'SGP4', 'KEPLER', 'FAILED'.
    """
    dt_sec = CADENCE_SEC.get(sat["regime"], DEFAULT_CADENCE_SEC)
    times = _step_times(t_start, horizon_hours, dt_sec)

    method = None
    positions = None
    tle_epoch = None

    if sat["line1"] and sat["line2"]:
        positions = _sgp4_track(sat["line1"], sat["line2"], times)
        if positions is not None and any(p is not None for p in positions):
            method = "SGP4"
            tle_epoch = sat["epoch"]

    if positions is None or all(p is None for p in positions):
        if all(sat[k] is not None for k in ("perigee_km", "apogee_km", "inclination_deg")):
            positions = _kepler_track(
                sat["perigee_km"], sat["apogee_km"], sat["inclination_deg"], times,
            )
            method = "KEPLER"
        else:
            return [], "FAILED"

    geodetic = _teme_to_geodetic_batch(positions, times)

    rows = []
    for t, geo in zip(times, geodetic):
        if geo is None:
            continue
        rows.append({
            "norad_id": sat["norad_id"],
            "t": t,
            "lat": geo[0],
            "lon": geo[1],
            "alt_km": geo[2],
            "method": method,
            "tle_epoch": tle_epoch,
        })

    if not rows:
        return [], "FAILED"
    return rows, method


async def _bulk_upsert(rows: list[dict]) -> None:
    if not rows:
        return
    sql = """
    INSERT INTO satellite_trajectories
      (norad_id, t, lat, lon, alt_km, method, tle_epoch)
    VALUES
      (:norad_id, :t, :lat, :lon, :alt_km, :method, :tle_epoch)
    ON CONFLICT (norad_id, t) DO UPDATE SET
      lat = EXCLUDED.lat,
      lon = EXCLUDED.lon,
      alt_km = EXCLUDED.alt_km,
      method = EXCLUDED.method,
      tle_epoch = EXCLUDED.tle_epoch
    """
    async with session_scope() as session:
        for i in range(0, len(rows), BULK_INSERT_BATCH):
            batch = rows[i : i + BULK_INSERT_BATCH]
            await session.execute(text(sql), batch)


async def cleanup_old_trajectories(max_age_hours: int = 72) -> int:
    """Delete trajectory rows older than max_age_hours. Returns count deleted."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    async with session_scope() as session:
        result = await session.execute(
            text("DELETE FROM satellite_trajectories WHERE t < :cutoff"),
            {"cutoff": cutoff},
        )
        return result.rowcount or 0


async def run(horizon_hours: int = HORIZON_HOURS) -> dict:
    t_start = datetime.now(timezone.utc)
    sats = await _load_inputs()

    all_rows: list[dict] = []
    counts = {"sgp4": 0, "kepler": 0, "failed": 0}
    errors: list[tuple[int, str]] = []

    for sat in sats:
        try:
            rows, method = _propagate_one(sat, t_start, horizon_hours)
            if method == "SGP4":
                counts["sgp4"] += 1
            elif method == "KEPLER":
                counts["kepler"] += 1
            else:
                counts["failed"] += 1
            all_rows.extend(rows)
        except Exception as exc:
            counts["failed"] += 1
            errors.append((sat["norad_id"], str(exc)))

    await _bulk_upsert(all_rows)

    return {
        "horizon_hours": horizon_hours,
        "satellites_propagated": counts["sgp4"] + counts["kepler"],
        "by_method": counts,
        "rows_written": len(all_rows),
        "errors_sample": errors[:5],
    }


if __name__ == "__main__":
    print(asyncio.run(run()))