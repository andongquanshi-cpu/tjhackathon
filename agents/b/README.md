# Agent B: Rogers Person-Centered Support

Agent B provides empathic reflection, emotional validation, unconditional positive regard, and experience clarification through `POST /respond`.

This agent intentionally has no knowledge base, retrieval pipeline, ingestion endpoint, or knowledge skill. `POST /query` and `POST /ingest` are not exposed. Responses always return an empty `sources` array.

Fatigue and pause requests short-circuit normal generation. When `needs_pause=true`, the agent acknowledges the pause without analysis, questions, breathing instructions, or exercises.

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.api.main:app --host 127.0.0.1 --port 8102
```

## Test

```bash
python -m pytest tests -q
```
