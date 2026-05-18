"""
Role: Run every seed loader in the right order.
Author: Dennies Bor
Description:
    Satellites first (no FK dependencies), then scenarios (also independent),
    then vulnerability (depends on both). Run via:
        pixi run python -m seeds.load_all
"""

import asyncio

from seeds.load_satellites import load_satellites
from seeds.load_scenarios import load_scenarios
from seeds.load_vulnerability import load_vulnerability


async def main() -> None:
    n_sats = await load_satellites()
    print(f"satellites:    {n_sats:>6}")
    n_scen = await load_scenarios()
    print(f"scenarios:     {n_scen:>6}")
    n_vuln = await load_vulnerability()
    print(f"vulnerability: {n_vuln:>6}")


if __name__ == "__main__":
    asyncio.run(main())