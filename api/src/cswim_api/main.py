"""
Role: FastAPI application entry point. Defines the app object and root routes.
Author: Dennies Bor
Description:
    Builds the FastAPI app, registers CORS middleware, and mounts the /api
    router along with one sub-router per resource. The /api/health endpoint
    reports liveness for both the service and the database; resource routers
    are mounted under /api/<resource>.
"""

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from cswim_api.config import settings
from cswim_api.db import get_session
from cswim_api.routes import live, positions, satellites, scenarios, vulnerability


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.environment == "development" else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


api = APIRouter(prefix="/api")


@api.get("/health")
async def health(session: AsyncSession = Depends(get_session)) -> dict:
    try:
        result = await session.execute(text("SELECT 1"))
        db_ok = result.scalar_one() == 1
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "error",
                "service": settings.app_name,
                "db": "unreachable",
                "error": str(exc),
            },
        )

    if not db_ok:
        raise HTTPException(status_code=503, detail="db query returned unexpected result")

    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "db": "ok",
    }


api.include_router(scenarios.router)
api.include_router(satellites.router)
api.include_router(vulnerability.router)
api.include_router(live.router)
api.include_router(positions.router)
app.include_router(api)