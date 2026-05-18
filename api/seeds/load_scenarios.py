"""
Role: Bulk-load the SEP storm scenarios into the scenarios table.
Author: Dennies Bor
Description:
    Reads sep_scenarios_joint.csv, which is in wide format (one row per
    bootstrap realisation, columns for each variable at each return period).
    Melts into the normalised schema with one row per (scenario_id,
    return_period). Sets has_pfail=True only for scen_00 at 100yr since
    that is the only scenario with full vulnerability outputs in v1.
"""

import pandas as pd
from sqlalchemy import text

from cswim_api.db import session_scope
from seeds._paths import SCENARIOS_CSV


VARIABLE_SUFFIXES = {
    "By_max": "by_max",
    "Bz_min": "bz_min",
    "V_max": "v_max",
    "Density_max": "n_p_max",
    "Pdyn_max": "pdyn_max",
    "Dst_min": "dst_min",
    "J_max_gt10": "j_gt10_peak",
    "J_max_gt30": "j_gt30_peak",
    "J_max_gt100": "j_gt100_peak",
    "J_fluence_gt10": "fluence_gt10",
    "J_fluence_gt30": "fluence_gt30",
    "J_fluence_gt100": "fluence_gt100",
}


async def load_scenarios() -> int:
    df = pd.read_csv(SCENARIOS_CSV)
    rows = []

    for _, r in df.iterrows():
        boot_id = int(r["scenario_id"].split("_")[1])
        for rp in (50, 100, 150):
            scenario_key = f"{r['scenario_id']}_{rp}y"
            row = {
                "scenario_id": scenario_key,
                "bootstrap_index": boot_id,
                "return_period_years": rp,
                "has_pfail": (boot_id == 0 and rp == 100),
                "kp_max": 9.0,  # Kp saturates at 9 in all scenarios; not in CSV
            }
            for src, dst in VARIABLE_SUFFIXES.items():
                col = f"{src}_RL_{rp}y"
                row[dst] = float(r[col]) if col in r and pd.notna(r[col]) else None
            rows.append(row)

    async with session_scope() as session:
        await session.execute(text("TRUNCATE scenarios RESTART IDENTITY CASCADE"))
        await session.execute(
            text("""
                INSERT INTO scenarios (
                    scenario_id, bootstrap_index, return_period_years, has_pfail,
                    dst_min, bz_min, by_max, v_max, pdyn_max, n_p_max, kp_max,
                    j_gt10_peak, j_gt30_peak, j_gt100_peak,
                    fluence_gt10, fluence_gt30, fluence_gt100
                ) VALUES (
                    :scenario_id, :bootstrap_index, :return_period_years, :has_pfail,
                    :dst_min, :bz_min, :by_max, :v_max, :pdyn_max, :n_p_max, :kp_max,
                    :j_gt10_peak, :j_gt30_peak, :j_gt100_peak,
                    :fluence_gt10, :fluence_gt30, :fluence_gt100
                )
            """),
            rows,
        )
    return len(rows)


if __name__ == "__main__":
    import asyncio

    n = asyncio.run(load_scenarios())
    print(f"loaded {n} scenarios")