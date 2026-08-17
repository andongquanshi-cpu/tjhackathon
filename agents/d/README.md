# Agent D: Skinner Behavioral Support

Agent D uses the local Skinner skill to describe observable behavior, antecedents, consequences, stimulus control, and reinforcement options through `POST /respond`.

This agent intentionally has no knowledge base, retrieval pipeline, ingestion endpoint, or knowledge skill. `POST /query` and `POST /ingest` are not exposed. Responses always return an empty `sources` array.

Fatigue and pause requests short-circuit normal behavior shaping. When `needs_pause=true`, the agent acknowledges the pause without analysis, questions, breathing instructions, or exercises.

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.api.main:app --host 127.0.0.1 --port 8104
```

## Test

```bash
python -m pytest tests -q
```
