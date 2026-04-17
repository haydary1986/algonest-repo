# RIS Pipelines

Data sync + embedding generation for the RIS platform.

## Jobs

| Job           | File                        | Provider             | Schedule        |
| ------------- | --------------------------- | -------------------- | --------------- |
| Scopus sync   | `jobs/scopus_sync.py`       | Scopus API           | Daily 02:00 UTC |
| OpenAlex sync | `jobs/openalex_sync.py`     | OpenAlex (free)      | Daily 02:00 UTC |
| WoS sync      | `jobs/wos_sync.py`          | WoS API (stub)       | —               |
| Deduplication | `jobs/deduplicate.py`       | —                    | Daily           |
| Embeddings    | `jobs/embed_researchers.py` | multilingual-e5-base | Daily           |

## Setup

```bash
cd pipelines
python -m venv .venv && source .venv/bin/activate
pip install -e .

# Required env vars:
export SUPABASE_URL=https://...
export SUPABASE_SERVICE_KEY=eyJ...

# Optional:
export SCOPUS_API_KEY=...
```

## Run manually

```bash
python -m pipelines.jobs.openalex_sync
python -m pipelines.jobs.embed_researchers
python -m pipelines.jobs.deduplicate
```

## Run with Prefect

```bash
prefect server start  # or connect to Prefect Cloud
python -m pipelines.flows.daily
```

## Docker

```bash
docker build -t ris-pipelines .
docker run --env-file .env ris-pipelines
```

## Deploy on Coolify

New Resource → Docker Compose → paste:

```yaml
services:
  prefect-worker:
    image: ghcr.io/yourusername/ris-pipelines:latest
    restart: unless-stopped
    environment:
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY}
      SCOPUS_API_KEY: ${SCOPUS_API_KEY}
```
