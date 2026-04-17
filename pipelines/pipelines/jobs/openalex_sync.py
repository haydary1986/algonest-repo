"""Task 143 — OpenAlex sync. Free API, no key required (polite pool: 10 req/s)."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from pipelines.lib.db import get_supabase

logger = logging.getLogger(__name__)

OPENALEX_WORKS = "https://api.openalex.org/works"
BATCH_SIZE = 200
STALE_HOURS = 48


def get_researchers_for_sync() -> list[dict]:
    sb = get_supabase()
    res = sb.table("researcher_social_profiles").select(
        "researcher_id, username"
    ).eq("platform", "openalex").execute()
    # Filter to those not recently synced
    if not res.data:
        return []
    ids = [r["researcher_id"] for r in res.data]
    researchers = sb.table("researchers").select(
        "id, openalex_last_synced_at"
    ).in_("id", ids).execute()
    stale = [
        {"id": r["id"], "openalex_id": next(
            (p["username"] for p in res.data if p["researcher_id"] == r["id"]), None
        )}
        for r in (researchers.data or [])
        if r.get("openalex_last_synced_at") is None
    ]
    return stale[:BATCH_SIZE]


def fetch_works(openalex_id: str) -> list[dict]:
    url = f"{OPENALEX_WORKS}?filter=author.id:{openalex_id}&per_page=100&mailto=ris@uomosul.edu.iq"
    r = httpx.get(url, timeout=30)
    r.raise_for_status()
    results = r.json().get("results", [])
    pubs = []
    for w in results:
        pubs.append({
            "title": w.get("title"),
            "doi": (w.get("doi") or "").replace("https://doi.org/", "") or None,
            "publication_year": w.get("publication_year"),
            "journal_name": (w.get("primary_location") or {}).get("source", {}).get("display_name"),
            "is_open_access": (w.get("open_access") or {}).get("is_oa", False),
            "scopus_citations": w.get("cited_by_count", 0),
            "url": (w.get("primary_location") or {}).get("landing_page_url"),
            "authors": [a.get("author", {}).get("display_name", "") for a in w.get("authorships", [])],
        })
    return pubs


def run() -> None:
    sb = get_supabase()
    researchers = get_researchers_for_sync()
    logger.info("OpenAlex sync: %d researchers", len(researchers))

    for r in researchers:
        if not r.get("openalex_id"):
            continue
        try:
            pubs = fetch_works(r["openalex_id"])
            if pubs:
                sb.rpc("merge_publications", {
                    "p_researcher_id": r["id"],
                    "p_publications": pubs,
                    "p_source_name": "openalex",
                }).execute()
            sb.table("researchers").update({
                "openalex_last_synced_at": datetime.now(timezone.utc).isoformat(),
                "openalex_publications_count": len(pubs),
            }).eq("id", r["id"]).execute()
            logger.info("OpenAlex: synced %d pubs for %s", len(pubs), r["id"])
        except Exception as e:
            logger.error("OpenAlex error for %s: %s", r["id"], e)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
