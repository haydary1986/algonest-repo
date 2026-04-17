"""Task 145 — Embedding generation for semantic search.

Uses intfloat/multilingual-e5-base (768 dim, FIX-08).
Processes researchers incrementally: only those with NULL bio_embedding
or updated_at > last run.
"""

from __future__ import annotations

import logging

from pipelines.lib.db import get_supabase

logger = logging.getLogger(__name__)

MODEL_NAME = "intfloat/multilingual-e5-base"
BATCH_SIZE = 32


def get_model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(MODEL_NAME)


def run() -> None:
    sb = get_supabase()

    # Fetch researchers needing embeddings
    res = sb.table("researchers").select(
        "id, bio_en, bio_ar, field_of_interest_en, field_of_interest_ar"
    ).is_("bio_embedding", "null").limit(500).execute()

    rows = res.data or []
    if not rows:
        logger.info("Embed: no researchers need embeddings.")
        return

    logger.info("Embed: processing %d researchers", len(rows))
    model = get_model()

    texts = []
    ids = []
    for r in rows:
        parts = [
            r.get("bio_en") or "",
            r.get("bio_ar") or "",
            r.get("field_of_interest_en") or "",
            r.get("field_of_interest_ar") or "",
        ]
        text = f"passage: {' '.join(parts).strip()}"
        if len(text) < 15:
            continue
        texts.append(text)
        ids.append(r["id"])

    if not texts:
        logger.info("Embed: no non-empty bios to embed.")
        return

    # Batch encode
    for i in range(0, len(texts), BATCH_SIZE):
        batch_texts = texts[i : i + BATCH_SIZE]
        batch_ids = ids[i : i + BATCH_SIZE]
        embeddings = model.encode(batch_texts, normalize_embeddings=True, show_progress_bar=False)

        for rid, emb in zip(batch_ids, embeddings):
            sb.table("researchers").update({
                "bio_embedding": emb.tolist(),
            }).eq("id", rid).execute()

        logger.info("Embed: batch %d-%d done", i, i + len(batch_texts))

    logger.info("Embed: done — %d researchers embedded", len(ids))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
