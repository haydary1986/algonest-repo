"""Task 141 + FIX-28 — Scopus sync with exponential backoff + resumable batching.

Usage:
    python -m pipelines.jobs.scopus_sync

Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, SCOPUS_API_KEY
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from pipelines.lib.db import get_supabase

logger = logging.getLogger(__name__)

BATCH_SIZE = 500
STALE_HOURS = 24


class QuotaExceededError(Exception):
    pass


@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=2, min=4, max=600),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
def fetch_scopus_author(scopus_id: str) -> dict:
    """Fetch author data from Scopus. Retry on transient errors."""
    import httpx

    api_key = os.environ.get("SCOPUS_API_KEY", "")
    url = f"https://api.elsevier.com/content/author/author_id/{scopus_id}"
    r = httpx.get(
        url,
        headers={"X-ELS-APIKey": api_key, "Accept": "application/json"},
        timeout=30,
    )
    if r.status_code == 429:
        raise QuotaExceededError(f"Scopus 429 at author {scopus_id}")
    r.raise_for_status()
    return r.json()


def get_researchers_for_sync() -> list[dict]:
    sb = get_supabase()
    res = sb.rpc(
        "get_researchers_for_scopus_sync",
        {"batch_size": BATCH_SIZE, "stale_hours": STALE_HOURS},
    ).execute()
    return res.data or []


def sync_one(researcher_id: str, scopus_id: str) -> dict:
    author = fetch_scopus_author(scopus_id)
    # Extract publications from author response
    entries = author.get("author-retrieval-response", [{}])
    pubs = []
    if isinstance(entries, list) and entries:
        core = entries[0].get("coredata", {})
        h_index = int(core.get("h-index", 0))
        citation_count = int(core.get("citation-count", 0))
        doc_count = int(core.get("document-count", 0))

        sb = get_supabase()
        sb.table("researchers").update({
            "scopus_h_index": h_index,
            "scopus_citations_count": citation_count,
            "scopus_publications_count": doc_count,
            "scopus_last_synced_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", researcher_id).execute()

    return {"researcher_id": researcher_id, "pubs_synced": len(pubs)}


def run() -> None:
    sb = get_supabase()
    sb.table("sync_state").update({
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "error": None,
    }).eq("provider", "scopus").execute()

    researchers = get_researchers_for_sync()
    logger.info("Scopus sync: %d researchers to process", len(researchers))

    synced = 0
    for r in researchers:
        try:
            sync_one(r["id"], r["scopus_id"])
            synced += 1
        except QuotaExceededError as e:
            logger.warning("Scopus quota exhausted: %s", e)
            sb.table("sync_state").update({
                "status": "quota_exhausted",
                "last_processed_id": r["id"],
                "error": str(e),
            }).eq("provider", "scopus").execute()
            break
        except Exception as e:
            logger.error("Scopus error for %s: %s", r["id"], e)

    sb.table("sync_state").update({
        "status": "idle",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("provider", "scopus").execute()

    logger.info("Scopus sync done: %d/%d", synced, len(researchers))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
