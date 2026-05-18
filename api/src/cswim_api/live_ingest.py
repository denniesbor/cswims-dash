"""
Role: Fetch and parse live space weather feeds from NOAA SWPC.
Author: Dennies Bor
Description:
    Three fetch functions, one per feed, plus a top-level run() that
    refreshes all three into postgres in sequence. SWPC delivers each
    feed as a JSON array-of-arrays where the first row is a column
    header. Parsers convert that to (timestamp, value, value, ...)
    tuples and upsert into the live tables via ON CONFLICT DO UPDATE.
    No retries on fetch errors: the next cron tick will retry. The
    Dst estimate is derived from Kp via the inverse of the heuristic
    in the C-SWIM paper (Kp = clip(-Dst/50 + 1, 0, 9) inverts to
    Dst ≈ (1 - Kp) * 50).
"""

import asyncio
import os
from datetime import datetime

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from cswim_api.db import session_scope


SWPC_BASE = os.environ.get("SWPC_BASE_URL", "https://services.swpc.noaa.gov")

URL_PLASMA = f"{SWPC_BASE}/products/solar-wind/plasma-1-day.json"
URL_MAG = f"{SWPC_BASE}/products/solar-wind/mag-1-day.json"
URL_KP = f"{SWPC_BASE}/json/planetary_k_index_1m.json"
URL_PROTONS = f"{SWPC_BASE}/json/goes/primary/integral-protons-1-day.json"

HTTP_TIMEOUT = 30.0


def _parse_swpc_array(payload: list) -> list[dict]:
    """SWPC list feeds are array-of-arrays with first row as header."""
    if not payload or len(payload) < 2:
        return []
    header = payload[0]
    return [dict(zip(header, row)) for row in payload[1:]]


def _to_float(v) -> float | None:
    if v is None or v == "":
        return None
    try:
        f = float(v)
        return f if not (f != f) else None  # NaN check
    except (ValueError, TypeError):
        return None


def _parse_ts(v: str) -> datetime | None:
    """SWPC timestamps look like '2026-05-13 21:34:00.000'."""
    if not v:
        return None
    try:
        return datetime.fromisoformat(v.replace(" ", "T").replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def _kp_to_dst_estimate(kp: float | None) -> float | None:
    """Inverse of the C-SWIM paper's Dst-to-Kp heuristic."""
    if kp is None:
        return None
    return float((1.0 - kp) * 50.0)


async def fetch_solar_wind() -> list[dict]:
    """Fetch plasma + mag, merge on timestamp, compute Pdyn and Bt."""
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        r_plasma, r_mag = await asyncio.gather(
            client.get(URL_PLASMA),
            client.get(URL_MAG),
        )
        r_plasma.raise_for_status()
        r_mag.raise_for_status()

    plasma = _parse_swpc_array(r_plasma.json())
    mag = _parse_swpc_array(r_mag.json())

    mag_by_t = {row.get("time_tag"): row for row in mag}

    merged = []
    for row in plasma:
        t = _parse_ts(row.get("time_tag"))
        if t is None:
            continue
        density = _to_float(row.get("density"))
        speed = _to_float(row.get("speed"))
        temperature = _to_float(row.get("temperature"))

        m = mag_by_t.get(row.get("time_tag"))
        bx = _to_float(m.get("bx_gsm")) if m else None
        by = _to_float(m.get("by_gsm")) if m else None
        bz = _to_float(m.get("bz_gsm")) if m else None
        bt = _to_float(m.get("bt")) if m else None

        p_dyn = None
        if density is not None and speed is not None:
            p_dyn = 1.67e-6 * density * speed * speed

        merged.append({
            "t": t,
            "bx_gsm": bx,
            "by_gsm": by,
            "bz_gsm": bz,
            "bt": bt,
            "v": speed,
            "n_p": density,
            "temperature": temperature,
            "p_dyn": p_dyn,
        })
    return merged


async def fetch_geomag() -> list[dict]:
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        r = await client.get(URL_KP)
        r.raise_for_status()
    payload = r.json()

    rows = []
    for entry in payload:
        t = _parse_ts(entry.get("time_tag"))
        if t is None:
            continue
        kp = _to_float(entry.get("estimated_kp"))
        if kp is None:
            kp = _to_float(entry.get("kp_index"))
        rows.append({
            "t": t,
            "kp": kp,
            "dst_estimate": _kp_to_dst_estimate(kp),
        })
    return rows


async def fetch_proton_flux() -> list[dict]:
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        r = await client.get(URL_PROTONS)
        r.raise_for_status()
    payload = r.json()

    # Pivot: SWPC delivers one row per (time, satellite, energy). We want
    # one row per (time, satellite) with three columns for the energies.
    pivot: dict[tuple, dict] = {}
    for entry in payload:
        t = _parse_ts(entry.get("time_tag"))
        if t is None:
            continue
        sat = entry.get("satellite") or "GOES-primary"
        sat = f"GOES-{sat}" if str(sat).isdigit() else str(sat)
        energy = entry.get("energy", "")
        flux = _to_float(entry.get("flux"))

        key = (t, sat)
        row = pivot.setdefault(key, {"t": t, "satellite": sat,
                                      "flux_gt10": None,
                                      "flux_gt50": None,
                                      "flux_gt100": None})
        if ">=10" in energy or ">10" in energy:
            row["flux_gt10"] = flux
        elif ">=50" in energy or ">50" in energy:
            row["flux_gt50"] = flux
        elif ">=100" in energy or ">100" in energy:
            row["flux_gt100"] = flux

    return list(pivot.values())


async def _upsert(session: AsyncSession, sql: str, rows: list[dict]) -> int:
    if not rows:
        return 0
    await session.execute(text(sql), rows)
    return len(rows)


async def run() -> dict:
    """Fetch all three feeds in parallel, upsert into postgres."""
    plasma_task = fetch_solar_wind()
    geomag_task = fetch_geomag()
    flux_task = fetch_proton_flux()

    plasma_rows, geomag_rows, flux_rows = await asyncio.gather(
        plasma_task, geomag_task, flux_task,
        return_exceptions=True,
    )

    plasma_rows = plasma_rows if not isinstance(plasma_rows, Exception) else []
    geomag_rows = geomag_rows if not isinstance(geomag_rows, Exception) else []
    flux_rows = flux_rows if not isinstance(flux_rows, Exception) else []

    async with session_scope() as session:
        n_plasma = await _upsert(
            session,
            """
            INSERT INTO solar_wind_live
              (t, bx_gsm, by_gsm, bz_gsm, bt, v, n_p, temperature, p_dyn)
            VALUES
              (:t, :bx_gsm, :by_gsm, :bz_gsm, :bt, :v, :n_p, :temperature, :p_dyn)
            ON CONFLICT (t) DO UPDATE SET
              bx_gsm = EXCLUDED.bx_gsm,
              by_gsm = EXCLUDED.by_gsm,
              bz_gsm = EXCLUDED.bz_gsm,
              bt = EXCLUDED.bt,
              v = EXCLUDED.v,
              n_p = EXCLUDED.n_p,
              temperature = EXCLUDED.temperature,
              p_dyn = EXCLUDED.p_dyn
            """,
            plasma_rows,
        )
        n_geomag = await _upsert(
            session,
            """
            INSERT INTO geomag_live (t, kp, dst_estimate)
            VALUES (:t, :kp, :dst_estimate)
            ON CONFLICT (t) DO UPDATE SET
              kp = EXCLUDED.kp,
              dst_estimate = EXCLUDED.dst_estimate
            """,
            geomag_rows,
        )
        n_flux = await _upsert(
            session,
            """
            INSERT INTO proton_flux_live (t, satellite, flux_gt10, flux_gt50, flux_gt100)
            VALUES (:t, :satellite, :flux_gt10, :flux_gt50, :flux_gt100)
            ON CONFLICT (t, satellite) DO UPDATE SET
              flux_gt10 = EXCLUDED.flux_gt10,
              flux_gt50 = EXCLUDED.flux_gt50,
              flux_gt100 = EXCLUDED.flux_gt100
            """,
            flux_rows,
        )

    return {
        "solar_wind": n_plasma,
        "geomag": n_geomag,
        "proton_flux": n_flux,
    }


if __name__ == "__main__":
    result = asyncio.run(run())
    print(result)