# Role: Docker image build for the FastAPI backend.
# Author: Dennies Bor
# Description:
#   Multi-stage build using ghcr.io/prefix-dev/pixi:0.34.0 as the build stage
#   to install the locked pixi environment, then copies the resolved env and
#   source into a slim runtime stage. The runtime stage runs uvicorn against
#   cswim_api.main:app. The image bakes only the source tree; the data
#   directory at /app/data is expected to be mounted at runtime via
#   compose so we don't ship parquets in the image layer.

FROM ghcr.io/prefix-dev/pixi:0.68.1 AS build

WORKDIR /app

# Copy only the manifests first so dep install is cached across code changes
COPY pyproject.toml pixi.lock ./

# Materialise the environment. The --frozen flag refuses to update the lockfile
# at build time, so production behaviour is reproducible from pixi.lock alone.
RUN pixi install --frozen

# Copy the rest of the project
COPY . .

# ---------- Runtime stage ----------

FROM ubuntu:24.04 AS runtime

WORKDIR /app

# Bring across the resolved pixi env and the source tree
COPY --from=build /app/.pixi /app/.pixi
COPY --from=build /app/src /app/src
COPY --from=build /app/migrations /app/migrations
COPY --from=build /app/alembic.ini /app/alembic.ini
COPY --from=build /app/seeds /app/seeds
COPY --from=build /app/pyproject.toml /app/pyproject.toml

# Put the pixi-installed binaries on PATH so alembic, python, uvicorn etc
# are available to every shell, including docker compose exec which bypasses
# ENTRYPOINT. PYTHONPATH ensures the src-layout package is importable.
ENV PATH=/app/.pixi/envs/default/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/src

EXPOSE 8000

CMD ["uvicorn", "cswim_api.main:app", "--host", "0.0.0.0", "--port", "8000"]