"""
Role: Idempotent deployment registration script.
Author: Dennies Bor
Description:
    Run by the prefect-init container on each `docker compose up`. Creates
    or updates the work pool and registers all deployments with their
    cron schedules. Schedules are staggered: TLE refresh at minute 0 of
    every 12th hour, trajectory generation at minute 5, cleanup hourly
    at minute 30, live refresh every 5 minutes.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from prefect import serve
from prefect.client.schemas.schedules import CronSchedule

from tasks.live import refresh_live_flow
from tasks.tles import refresh_tles_flow
from tasks.trajectories import (
    cleanup_trajectories_flow,
    propagate_trajectories_flow,
)


def main() -> None:
    live = refresh_live_flow.to_deployment(
        name="every-5-min",
        schedule=CronSchedule(cron="*/5 * * * *", timezone="UTC"),
    )

    tles = refresh_tles_flow.to_deployment(
        name="every-12-hours",
        schedule=CronSchedule(cron="0 0,12 * * *", timezone="UTC"),
    )

    trajectories = propagate_trajectories_flow.to_deployment(
        name="every-12-hours-offset",
        schedule=CronSchedule(cron="5 0,12 * * *", timezone="UTC"),
    )

    cleanup = cleanup_trajectories_flow.to_deployment(
        name="hourly",
        schedule=CronSchedule(cron="30 * * * *", timezone="UTC"),
    )

    serve(live, tles, trajectories, cleanup, limit=2)


if __name__ == "__main__":
    main()