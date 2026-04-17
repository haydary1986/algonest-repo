"""Task 146 — Prefect daily flow orchestrating all sync + maintenance jobs.

Schedule: daily at 02:00 UTC (configurable via Prefect UI or CLI).

Usage:
    # Register + run once:
    python -m pipelines.flows.daily

    # Or deploy as a Prefect scheduled flow:
    prefect deployment build pipelines/flows/daily.py:daily_flow \
        --name ris-daily --cron "0 2 * * *" --apply
"""

from __future__ import annotations

import logging

from prefect import flow, task

logger = logging.getLogger(__name__)


@task(name="scopus-sync", retries=0, timeout_seconds=21600)
def scopus_sync_task() -> None:
    from pipelines.jobs.scopus_sync import run
    run()


@task(name="openalex-sync", retries=0, timeout_seconds=7200)
def openalex_sync_task() -> None:
    from pipelines.jobs.openalex_sync import run
    run()


@task(name="wos-sync", retries=0, timeout_seconds=7200)
def wos_sync_task() -> None:
    from pipelines.jobs.wos_sync import run
    run()


@task(name="deduplicate", retries=0, timeout_seconds=3600)
def dedup_task() -> None:
    from pipelines.jobs.deduplicate import run
    run()


@task(name="embed-researchers", retries=0, timeout_seconds=7200)
def embed_task() -> None:
    from pipelines.jobs.embed_researchers import run
    run()


@flow(name="ris-daily", timeout_seconds=43200)
def daily_flow() -> None:
    """Run all sync jobs, then maintenance tasks."""
    logger.info("=== RIS Daily Flow start ===")

    # Sync providers (sequential to respect rate limits)
    scopus_sync_task()
    openalex_sync_task()
    wos_sync_task()

    # Maintenance
    dedup_task()
    embed_task()

    logger.info("=== RIS Daily Flow complete ===")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    daily_flow()
