# Driver DNA (F1 DNA)

## Backend setup

From `driver-dna/backend`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## API endpoints

- `GET /health`
- `GET /api/drivers?year=2024[&force_refresh=true]`
- `GET /api/driver/NOR?year=2024[&force_refresh=true]`
- `POST /api/report`

## Example curl

```bash
curl "http://127.0.0.1:8000/api/drivers?year=2024"
curl "http://127.0.0.1:8000/api/driver/NOR?year=2024"
curl -X POST "http://127.0.0.1:8000/api/report" \
  -H "Content-Type: application/json" \
  -d '{"metrics":{"driver":"NOR","year":2024,"consistency":{"laptime_std_seconds":0.25}}}'
```

## Notes

- FastF1 cache is local at `backend/data/cache/`.
- Year range is restricted to `2018-2024` for MVP data quality.
