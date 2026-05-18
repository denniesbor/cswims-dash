"""
Role: Bulk-load the active satellite catalog into the satellites table.
Author: Dennies Bor
Description:
    Reads classified_satellites.parquet and maps C-SWIM column names to the
    normalised dashboard schema. The input has 13k+ rows and many derived
    fields the dashboard does not need; only columns relevant to the UI are
    loaded. Idempotent: truncates the satellites table before insert.

    Mapping notes:
      Satcat              -> norad_id
      Name                -> name (square brackets stripped)
      Manufacturer        -> operator (best available proxy in this dataset)
      UNState             -> un_state (square brackets stripped)
      LDate               -> launch_date (parsed from "1988 Sep" style)
      Mass                -> mass_kg
      regime              -> regime (filtered to LEO/MEO/GEO/HEO)
      classification_primary -> classification
      perigee_km / apogee_km -> as-is
      inclination_deg     -> as-is
      mean(peri, apo)     -> altitude_km
      now() - LDate       -> elapsed_yrs (clipped to [1, 40])
"""

import re
from datetime import date

import pandas as pd
from sqlalchemy import text

from cswim_api.db import session_scope
from seeds._paths import SATELLITES_PARQUET


def _parse_ldate(s: str | None) -> date | None:
    if not s or not isinstance(s, str):
        return None
    s = s.strip()
    for fmt in ("%Y %b %d", "%Y %b", "%Y"):
        try:
            return pd.to_datetime(s, format=fmt).date()
        except (ValueError, TypeError):
            continue
    return None


def _strip_brackets(s: str | None) -> str | None:
    if not isinstance(s, str):
        return None
    cleaned = re.sub(r"[\[\]]", "", s).strip()
    return cleaned or None


def _clean_name(name: str | None) -> str:
    cleaned = _strip_brackets(name)
    return cleaned or "unknown"


def _compute_elapsed_yrs(launch_date: date | None, today: date) -> float | None:
    if launch_date is None:
        return None
    yrs = (today - launch_date).days / 365.25
    return max(1.0, min(40.0, yrs))


async def load_satellites() -> int:
    df = pd.read_parquet(SATELLITES_PARQUET)
    today = date.today()

    rows = []
    for _, r in df.iterrows():
        norad = r.get("Satcat")
        if pd.isna(norad):
            continue
        regime = r.get("regime")
        if pd.isna(regime) or str(regime) not in ("LEO", "MEO", "GEO", "HEO"):
            continue

        launch = _parse_ldate(r.get("LDate"))
        rows.append(
            {
                "norad_id": int(norad),
                "name": _clean_name(r.get("Name")),
                "operator": _strip_brackets(r.get("Manufacturer")),
                "un_state": _strip_brackets(r.get("UNState")),
                "launch_date": launch,
                "mass_kg": float(r["Mass"]) if pd.notna(r.get("Mass")) else None,
                "regime": str(regime),
                "classification": _strip_brackets(r.get("classification_primary")),
                "constellation": None,
                "perigee_km": float(r["perigee_km"]) if pd.notna(r.get("perigee_km")) else None,
                "apogee_km": float(r["apogee_km"]) if pd.notna(r.get("apogee_km")) else None,
                "inclination_deg": float(r["inclination_deg"]) if pd.notna(r.get("inclination_deg")) else None,
                "altitude_km": (
                    (float(r["perigee_km"]) + float(r["apogee_km"])) / 2.0
                    if pd.notna(r.get("perigee_km")) and pd.notna(r.get("apogee_km"))
                    else None
                ),
                "elapsed_yrs": _compute_elapsed_yrs(launch, today),
            }
        )

    async with session_scope() as session:
        await session.execute(text("TRUNCATE satellites RESTART IDENTITY CASCADE"))
        await session.execute(
            text("""
                INSERT INTO satellites (
                    norad_id, name, operator, un_state, launch_date, mass_kg,
                    regime, classification, constellation,
                    perigee_km, apogee_km, inclination_deg, altitude_km, elapsed_yrs
                ) VALUES (
                    :norad_id, :name, :operator, :un_state, :launch_date, :mass_kg,
                    :regime, :classification, :constellation,
                    :perigee_km, :apogee_km, :inclination_deg, :altitude_km, :elapsed_yrs
                )
            """),
            rows,
        )
    return len(rows)


if __name__ == "__main__":
    import asyncio

    n = asyncio.run(load_satellites())
    print(f"loaded {n} satellites")