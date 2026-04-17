# Task 147 — Python pipelines Docker image.
# Runs as a Prefect worker (or standalone cron).

FROM python:3.12-slim AS base

WORKDIR /app

# System deps for sentence-transformers (torch needs libgomp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgomp1 && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

COPY pipelines/ ./pipelines/

# Non-root user
RUN useradd -m worker
USER worker

# Default: run the daily flow. Override in docker-compose/Coolify.
CMD ["python", "-m", "pipelines.flows.daily"]
