"""Task 142 — Web of Science sync (stub — requires institutional WoS API access)."""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def run() -> None:
    logger.info(
        "WoS sync: requires WOS_API_KEY. "
        "Same pattern as scopus_sync.py — tenacity retry, merge_publications RPC, "
        "sync_state tracking. Implement when WoS Expanded API access is provisioned."
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
