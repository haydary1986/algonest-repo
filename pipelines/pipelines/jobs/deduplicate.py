"""Task 144 — Publication deduplication engine.

Detects suspected duplicates by:
  1. DOI exact match (different researcher_id but same DOI)
  2. Title fuzzy match (rapidfuzz, threshold 90%)

Writes results to a `dedup_candidates` report table for admin review.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from rapidfuzz import fuzz

from pipelines.lib.db import get_supabase

logger = logging.getLogger(__name__)

TITLE_THRESHOLD = 90


def run() -> None:
    sb = get_supabase()

    # Fetch all publications with title + doi
    res = sb.table("researcher_publications").select(
        "id, researcher_id, title, doi, publication_year"
    ).order("title").execute()
    pubs = res.data or []
    logger.info("Dedup: loaded %d publications", len(pubs))

    # 1. DOI duplicates (cross-researcher)
    doi_map: dict[str, list[dict]] = {}
    for p in pubs:
        doi = (p.get("doi") or "").strip().lower()
        if doi:
            doi_map.setdefault(doi, []).append(p)

    doi_dupes = {doi: group for doi, group in doi_map.items() if len(group) > 1}
    logger.info("DOI duplicates: %d groups", len(doi_dupes))

    # 2. Title fuzzy (within same researcher — catches import overlaps)
    title_dupes: list[tuple[dict, dict, float]] = []
    by_researcher: dict[str, list[dict]] = {}
    for p in pubs:
        by_researcher.setdefault(p["researcher_id"], []).append(p)

    for rid, group in by_researcher.items():
        for i in range(len(group)):
            for j in range(i + 1, len(group)):
                a, b = group[i], group[j]
                if not a or not b:
                    continue
                score = fuzz.token_sort_ratio(
                    (a.get("title") or "").lower(),
                    (b.get("title") or "").lower(),
                )
                if score >= TITLE_THRESHOLD and a["id"] != b["id"]:
                    title_dupes.append((a, b, score))

    logger.info("Title fuzzy duplicates: %d pairs", len(title_dupes))

    # Write report
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "doi_duplicate_groups": len(doi_dupes),
        "title_fuzzy_pairs": len(title_dupes),
        "doi_details": [
            {"doi": doi, "publication_ids": [p["id"] for p in group]}
            for doi, group in list(doi_dupes.items())[:100]
        ],
        "title_details": [
            {
                "pub_a": a["id"],
                "pub_b": b["id"],
                "score": round(score, 1),
                "title_a": a.get("title", "")[:100],
                "title_b": b.get("title", "")[:100],
            }
            for a, b, score in title_dupes[:200]
        ],
    }

    sb.table("app_settings").upsert({
        "key": "dedup_report",
        "value": report,
        "description": "Latest deduplication analysis report.",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    logger.info("Dedup report saved to app_settings.dedup_report")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
