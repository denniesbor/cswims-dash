# Save as: api/seeds/__init__.py
"""
Role: Seeds package marker.
Author: Dennies Bor
Description:
    One-shot data loaders that read the C-SWIM pipeline outputs in data/
    and populate the postgres tables. Run via `pixi run python -m seeds.load_all`
    after the schema migration is applied. Loaders are idempotent: re-running
    them truncates and reloads.
"""