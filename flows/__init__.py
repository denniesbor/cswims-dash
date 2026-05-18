"""
Role: Prefect flows package marker.
Author: Dennies Bor
Description:
    Top-level package for orchestration flows. Each module under flows.tasks
    defines one @flow function wrapping a cswim_api ingestion or computation
    coroutine. The deploy.py script in this directory registers all flows
    with Prefect server.
"""