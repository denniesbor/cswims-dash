"""
Role: Prefect flow for live space weather refresh.
Author: Dennies Bor
Description:
    Wraps cswim_api.live_ingest.run as a Prefect flow with retries.
    Scheduled every 5 minutes. Pulls solar wind, geomag, and GOES
    proton flux from SWPC and upserts into the live tables.
"""

import asyncio

from prefect import flow, get_run_logger

from cswim_api import live_ingest


@flow(
    name="refresh-live",
    retries=2,
    retry_delay_seconds=60,
    log_prints=True,
)
def refresh_live_flow() -> dict:
    logger = get_run_logger()
    result = asyncio.run(live_ingest.run())
    logger.info(f"live refresh: {result}")
    return result