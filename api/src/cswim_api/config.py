"""
Role: Application configuration loaded from environment variables.
Author: Dennies Bor
Description:
    Centralises every tunable setting in one Settings object backed by
    pydantic-settings. Values come from a .env file at the repo root or
    from real environment variables in production. Code elsewhere imports
    `settings` rather than reading os.environ directly so config errors
    surface at startup instead of mid-request.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application identity
    app_name: str = "cswim-api"
    app_version: str = "0.1.0"
    environment: str = "development"

    # Database connection (used in Phase 1+, ignored in Phase 0)
    database_url: str = "postgresql+asyncpg://cswim:cswim@localhost:5432/cswim"

    # Server bind (matters when running outside a container)
    api_host: str = "0.0.0.0"
    api_port: int = 8000


settings = Settings()