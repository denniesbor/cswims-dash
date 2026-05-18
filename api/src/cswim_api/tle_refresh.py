"""
Role: Fetch latest TLEs from Space-Track for satellites in our catalog.
Author: Dennies Bor
Description:
    Pulls the active GP element set in chunks via the spacetrack library,
    parses each TLE, filters to NORAD IDs present in the satellites table,
    and upserts into the tles table. Uses the chunked-with-binary-split
    pattern from the C-SWIM pipeline's dl_tles.py for resilience to
    Space-Track choking on specific IDs. One latest TLE per satellite;
    re-running overwrites by primary key.
"""

import asyncio
import os
import time
from datetime import datetime, timedelta, timezone

from spacetrack import SpaceTrackClient
from sqlalchemy import select, text

from cswim_api.db import session_scope
from cswim_api.models import Satellite


CHUNK_SIZE = 200
DELAY_SEC = 1.0
MAX_RETRIES = 2
RETRY_DELAY = 30.0


def _credentials() -> tuple[str, str]:
    user = os.environ.get("SPACETRACK_USERNAME", "").strip()
    pw = os.environ.get("SPACETRACK_PASSWORD", "").strip()
    if not user or not pw:
        raise RuntimeError("Set SPACETRACK_USERNAME and SPACETRACK_PASSWORD")
    return user, pw


def _fetch_chunk(ids: list[int], st: SpaceTrackClient) -> str:
    try:
        return (
            st.gp(
                norad_cat_id=",".join(str(i) for i in ids),
                decay_date="null-val",
                orderby="norad_cat_id",
                format="tle",
            )
            or ""
        )
    except Exception as e:
        print(f"fetch error: {e}")
        return ""


def _process_chunk(ids: list[int], st: SpaceTrackClient) -> str:
    if not ids:
        return ""
    if len(ids) == 1:
        for _ in range(MAX_RETRIES + 1):
            result = _fetch_chunk(ids, st)
            if result.strip():
                return result
            time.sleep(RETRY_DELAY)
        print(f"failed id: {ids[0]}")
        return ""

    result = _fetch_chunk(ids, st)
    if result.strip():
        return result
    time.sleep(RETRY_DELAY)
    result = _fetch_chunk(ids, st)
    if result.strip():
        return result

    mid = len(ids) // 2
    time.sleep(DELAY_SEC)
    left = _process_chunk(ids[:mid], st)
    time.sleep(DELAY_SEC)
    right = _process_chunk(ids[mid:], st)
    return (left or "") + "\n" + (right or "")


def _parse_tle_block(text_block: str) -> list[dict]:
    lines = [ln.rstrip() for ln in text_block.splitlines() if ln.strip()]
    rows = []
    for i in range(0, len(lines) - 1, 2):
        l1 = lines[i]
        l2 = lines[i + 1]
        if not l1.startswith("1 ") or not l2.startswith("2 "):
            continue
        try:
            norad_id = int(l1[2:7].strip())
            yy = int(l1[18:20])
            year = 2000 + yy if yy < 57 else 1900 + yy
            doy = float(l1[20:32])
            epoch = datetime(year, 1, 1, tzinfo=timezone.utc) + timedelta(days=doy - 1)
        except (ValueError, IndexError):
            continue
        rows.append({"norad_id": norad_id, "epoch": epoch, "line1": l1, "line2": l2})
    # latest per satellite
    latest: dict[int, dict] = {}
    for row in rows:
        prev = latest.get(row["norad_id"])
        if prev is None or row["epoch"] > prev["epoch"]:
            latest[row["norad_id"]] = row
    return list(latest.values())


async def _known_norad_ids() -> set[int]:
    async with session_scope() as session:
        result = await session.execute(select(Satellite.norad_id))
        return set(result.scalars().all())


async def run() -> dict:
    known = await _known_norad_ids()
    user, pw = _credentials()
    st = SpaceTrackClient(identity=user, password=pw)

    ids_sorted = sorted(known)
    chunks = [ids_sorted[i : i + CHUNK_SIZE] for i in range(0, len(ids_sorted), CHUNK_SIZE)]

    all_text = []
    for idx, chunk in enumerate(chunks, 1):
        print(f"chunk {idx}/{len(chunks)} ({len(chunk)} ids)")
        all_text.append(_process_chunk(chunk, st))
        time.sleep(DELAY_SEC)

    tles = _parse_tle_block("\n".join(all_text))
    in_catalog = [t for t in tles if t["norad_id"] in known]
    unknown = len(tles) - len(in_catalog)

    rows = [
        {**t, "object_name": None, "source": "SPACETRACK"}
        for t in in_catalog
    ]

    async with session_scope() as session:
        if rows:
            await session.execute(
                text("""
                INSERT INTO tles (norad_id, epoch, line1, line2, object_name, source)
                VALUES (:norad_id, :epoch, :line1, :line2, :object_name, :source)
                ON CONFLICT (norad_id) DO UPDATE SET
                    epoch = EXCLUDED.epoch,
                    line1 = EXCLUDED.line1,
                    line2 = EXCLUDED.line2,
                    object_name = EXCLUDED.object_name,
                    source = EXCLUDED.source,
                    fetched_at = now()
                """),
                rows,
            )

    return {"fetched": len(tles), "stored": len(rows), "unknown_skipped": unknown}


if __name__ == "__main__":
    print(asyncio.run(run()))