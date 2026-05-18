"""
Role: Prefect flow for trajectory generation and cleanup.
Author: Dennies Bor
Description:
    Two flows. propagate_trajectories_flow runs SGP4 forward 14h for all
    satellites, scheduled every 12h offset 5 minutes after tle-refresh.
    cleanup_trajectories_flow deletes rows older than 72h, scheduled hourly.
    Trajectory generation retries once with 10-minute delay; cleanup never
    retries because it's idempotent.
"""

import asyncio

from prefect import flow, get_run_logger

from cswim_api import positions


@flow(
    name="propagate-trajectories",
    retries=1,
    retry_delay_seconds=600,
    log_prints=True,
)
def propagate_trajectories_flow() -> dict:
    logger = get_run_logger()
    result = asyncio.run(positions.run())
    logger.info(f"trajectory generation: {result}")
    return result


@flow(
    name="cleanup-trajectories",
    log_prints=True,
)
def cleanup_trajectories_flow() -> int:
    logger = get_run_logger()
    n_deleted = asyncio.run(positions.cleanup_old_trajectories())
    logger.info(f"deleted {n_deleted} stale trajectory rows")
    return n_deleted