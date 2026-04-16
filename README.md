# Driver DNA

Driver DNA is a web project focused on analyzing Formula 1 drivers using FastF1 telemetry and presenting the results through an API and web interface, with AI-generated scouting-style summaries.

## What this project includes

- Data loading from FastF1 race sessions
- Metric computation for driver style/performance signals
- FastAPI backend endpoints for driver data and report generation
- Supporting project docs and local agent/tooling configuration

## Repository structure

- `driver-dna/` — application code
  - `backend/` — FastAPI backend, FastF1 data pipeline, tests
- `docs/` — project and workflow documentation
- `.cursor/`, `.claude/` — local development/agent configuration

## Run locally

From `driver-dna/backend`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Helpful URLs after startup:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs`

## Basic API examples

```bash
curl "http://127.0.0.1:8000/api/drivers?year=2024"
curl "http://127.0.0.1:8000/api/driver/NOR?year=2024"
curl -X POST "http://127.0.0.1:8000/api/report" \
  -H "Content-Type: application/json" \
  -d '{"metrics":{"driver":"NOR","year":2024}}'
```
