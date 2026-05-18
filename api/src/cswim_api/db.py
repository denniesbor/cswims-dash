"""
Role: Async database engine and session factory for the FastAPI app.
Author: Dennies Bor
Description:
    Builds a single SQLAlchemy AsyncEngine at import time using the URL from
    settings, and exposes a get_session() dependency for FastAPI routes to
    consume via dependency injection. The session is a context manager that
    commits on success and rolls back on exception, so route handlers do not
    need explicit transaction management for simple queries.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from cswim_api.config import settings


engine = create_async_engine(
    settings.database_url,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    echo=False,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency. Yields an AsyncSession, commits on success."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@asynccontextmanager
async def session_scope() -> AsyncGenerator[AsyncSession, None]:
    """Context-manager form for use outside FastAPI (seeds, scripts)."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise