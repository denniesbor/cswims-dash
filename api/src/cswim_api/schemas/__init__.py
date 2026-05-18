"""
Role: Pydantic schemas package marker.
Author: Dennies Bor
Description:
    Request and response models that define the API contract. Kept separate
    from ORM models so the public-facing shape can evolve without forcing
    a database migration, and vice versa.
"""