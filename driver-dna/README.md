# Driver DNA (F1 DNA)

## Backend setup

From `driver-dna/backend`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Optional performance knobs for faster interactive previews (default values shown):

```bash
export DRIVER_DNA_MAX_ROUNDS=8
export DRIVER_DNA_MAX_TELEMETRY_LAPS=6
```

Lower values make first `/api/driver/{code}` responses faster by sampling fewer rounds/laps.

Backend runs at `http://127.0.0.1:8000`.

## Frontend setup

From `driver-dna/frontend`:

```bash
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:5173` (Vite default).

For production verification:

```bash
npm run typecheck
npm run test
npm run build
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
