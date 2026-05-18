"""
Role: Command-line entry points for one-off tasks.
Author: Dennies Bor
Description:
    Thin wrappers around long-running functions so they can be invoked
    by name inside the docker container, eg via `docker compose exec api
    python -m cswim_api.cli refresh-live`. Each command is a function
    registered in the dispatch dict. Kept deliberately simple; no argparse,
    no Typer.
"""

import asyncio
import sys

from cswim_api import live_ingest, positions, tle_refresh


COMMANDS = {
    "refresh-live": lambda: asyncio.run(live_ingest.run()),
    "refresh-tles": lambda: asyncio.run(tle_refresh.run()),
    "propagate-positions": lambda: asyncio.run(positions.run()),
    "cleanup-trajectories": lambda: asyncio.run(positions.cleanup_old_trajectories()),
}


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print(f"usage: python -m cswim_api.cli <{'|'.join(COMMANDS)}>")
        sys.exit(2)
    print(COMMANDS[sys.argv[1]]())


if __name__ == "__main__":
    main()