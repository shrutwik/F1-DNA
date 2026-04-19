# Phase 3 — Frontend (Driver DNA) Design

Date: 2026-04-19  
Scope: Phase 3 (frontend core). No backend/AI changes except any CORS/dev URLs if required.

## Goal

Ship an aesthetic, dark-first web UI that lets users explore a driver’s season “DNA”:

- Choose **season year** and **driver**
- Fetch metrics from the existing FastAPI backend
- Render a scrollable, sectioned dashboard with strong visual hierarchy
- Use **team color** as the accent theme and render **track layout in white** on dark UI

Non-goals (Phase 3):

- Claude/AI report UX (Phase 4)
- Auth, accounts, persistence
- Advanced caching/offline support

## Tech choices

- **Vite + React**
- **React Router** for shareable URLs
- **TailwindCSS** for dark theme + rapid UI iteration
- **Recharts** for charts

## Routes & information architecture

### `/` (Explore / Landing)

Purpose: friendly first impression and an obvious “start here”.

- Hero: “Driver DNA”
- Short description (1–2 sentences)
- Controls:
  - Year dropdown (default: 2024)
  - Driver dropdown (populated from backend for selected year)
  - CTA button: “Generate DNA”
- Footer: lightweight attribution / notes (optional)

Behavior:

- On year change: fetch driver list
- On CTA click: navigate to `/driver/:year/:code`

### `/driver/:year/:code` (Driver dashboard)

Purpose: exploration-oriented results page.

Layout:

- Header: driver name/code + year + team badge
- Sticky mini-nav (anchors): Overview, Braking, Throttle, Tyres, Consistency, Quali vs Race, Circuit Index
- Content: scroll sections (each section visually distinct)

## Backend integration (contract)

Base URL: `http://127.0.0.1:8000` (dev)

- **List drivers**: `GET /api/drivers?year=YYYY`
  - Used by landing page driver dropdown.
  - Uses returned `drivers[]` items including `code`, `name?`, `team?`.
- **Driver metrics**: `GET /api/driver/{CODE}?year=YYYY`
  - Used by driver dashboard.
  - Response includes `driver`, `year`, `rounds_analyzed`, plus metric blocks (extra keys allowed).

Frontend caching:

- In-memory Map keyed by `${year}:${code}` for metrics payload.
- Do not persist to localStorage in Phase 3 (keeps scope small).

## Theming system

Dark mode:

- Always dark by default (no light theme toggle in Phase 3).
- Use neutral dark backgrounds + subtle borders.

Team accent color:

- Derive from `team` string returned by `/api/drivers`.
- Maintain a mapping table (e.g. “McLaren” → papaya/orange, “Ferrari” → red, etc.).
- Use accent for:
  - primary button, focus ring
  - chart stroke/fill for “driver” series
  - section header underline/left border

Track layout:

- Render as a white line on dark canvas/SVG.
- If no track geometry exists in metrics yet, Phase 3 will render a placeholder layout component (still white) and we can wire it to real geometry later.

## Components (proposed)

- `App` + global layout shell
- `pages/ExplorePage`
- `pages/DriverPage`
- `components/YearSelect`
- `components/DriverSelect`
- `components/StickySectionNav`
- `components/Section`
- `components/KpiCard`
- `components/charts/*` (per metric family)
- `api/client` (fetch wrapper)
- `api/driver` (typed functions: listDrivers, getDriverMetrics)
- `theme/teamColors` (mapping + helper)
- `components/TrackLayout` (white stroke)

## Section definitions (Phase 3)

Each section includes:

- Title + 1–2 sentence “interpretation” (from metrics payload when available, otherwise static microcopy)
- One chart (or chart + small table if needed)
- “Data unavailable” fallback when metric block is missing/empty

### Overview

- KPI cards:
  - rounds analyzed
  - consistency std-dev
  - mean grid-minus-finish
  - deg slope

### Braking

- Chart: by-circuit brake onset delta vs teammate (line/bar)

### Throttle

- Chart: season average throttle at corner exit vs teammate (simple bar)

### Tyres

- Chart: avg deg slope + stint count (bar + small text)

### Consistency

- Chart: laptime std seconds (single value + distribution placeholder)

### Quali vs Race

- Chart: grid minus finish per round (bar with positive/negative)

### Circuit Performance Index

- Chart: expected minus actual per round (bar)

## UX states & error handling

- Landing:
  - Driver dropdown shows loading state while fetching.
  - If error: show compact retry.
- Driver page:
  - Section skeletons while fetching.
  - If fetch fails: error card + retry button.
  - If a metric field is `null`/empty: show “Not enough data for this metric” in that section.

## Performance constraints (token + UX)

- Keep frontend types and abstractions light.
- Avoid heavyweight state libraries for Phase 3.
- Prefer simple memoization and client cache Map to prevent redundant fetches.

## Acceptance criteria

- `driver-dna/frontend` runs locally and can talk to backend on `:8000`.
- `/` shows year+driver picker populated from `/api/drivers`.
- “Generate DNA” navigates to `/driver/:year/:code`.
- Driver page renders dark UI with team accent color and scroll sections.
- Charts render from real `/api/driver/{code}` payload for at least one driver/year.

