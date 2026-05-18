"""
Role: Resolved filesystem paths to the C-SWIM data exports.
Author: Dennies Bor
Description:
    Centralises the on-disk locations of C-SWIM parquet and CSV files
    consumed by the seed loaders. Resolution order:
    1. CSWIM_DATA_ROOT env var (explicit override; used by tests)
    2. /app/data if it exists (set by docker compose mount)
    3. ../data relative to the api package (native uvicorn run)
"""

import os
from pathlib import Path


def _resolve_data_root() -> Path:
    explicit = os.environ.get("CSWIM_DATA_ROOT")
    if explicit:
        return Path(explicit)
    container_path = Path("/app/data")
    if container_path.is_dir():
        return container_path
    return Path(__file__).resolve().parents[2] / "data"


DATA_ROOT = _resolve_data_root()

SATELLITES_PARQUET = DATA_ROOT / "catalog" / "classified_satellites.parquet"
VULNERABILITY_PARQUET = DATA_ROOT / "vulnerability" / "vulnerability_results.parquet"
SCENARIOS_CSV = DATA_ROOT / "scenarios" / "sep_scenarios_joint.csv"