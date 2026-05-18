"""
Role: Prefect flow for Space-Track TLE refresh.
Author: Dennies Bor
Description:
    Wraps cswim_api.tle_refresh.run as a Prefect flow. Scheduled every
    12 hours. Fetches latest TLEs for all satellites in our catalog and
    upserts into the tles table. Retries twice on failure with 5-minute
    delay to ride out transient Space-Track issues.
"""

import asyncio

from prefect import flow, get_run_logger

from cswim_api import tle_refresh


@flow(
    name="refresh-tles",
    retries=2,
    retry_delay_seconds=300,
    log_prints=True,
)
def refresh_tles_flow() -> dict:
    logger = get_run_logger()
    result = asyncio.run(tle_refresh.run())
    logger.info(f"tle refresh: {result}")
    return result