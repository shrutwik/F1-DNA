# Phase 3 Frontend Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark-mode React frontend for Driver DNA with an explore page and a scroll-section driver dashboard that consumes existing backend APIs.

**Architecture:** Use a Vite React SPA with React Router for two routes (`/` and `/driver/:year/:code`). Keep data access in small API helper modules, keep theming in a dedicated team-color map, and render each metric area as a focused section component with fallback UI for missing data.

**Tech Stack:** Vite, React, React Router, TailwindCSS, Recharts, TypeScript

---

## File Structure

- Create: `driver-dna/frontend/package.json`
- Create: `driver-dna/frontend/index.html`
- Create: `driver-dna/frontend/tailwind.config.js`
- Create: `driver-dna/frontend/postcss.config.js`
- Create: `driver-dna/frontend/tsconfig.json`
- Create: `driver-dna/frontend/vite.config.ts`
- Create: `driver-dna/frontend/src/main.tsx`
- Create: `driver-dna/frontend/src/App.tsx`
- Create: `driver-dna/frontend/src/styles.css`
- Create: `driver-dna/frontend/src/types/api.ts`
- Create: `driver-dna/frontend/src/api/client.ts`
- Create: `driver-dna/frontend/src/api/driver.ts`
- Create: `driver-dna/frontend/src/theme/teamColors.ts`
- Create: `driver-dna/frontend/src/components/StickySectionNav.tsx`
- Create: `driver-dna/frontend/src/components/TrackLayout.tsx`
- Create: `driver-dna/frontend/src/components/SectionCard.tsx`
- Create: `driver-dna/frontend/src/components/charts/*.tsx` (metric charts)
- Create: `driver-dna/frontend/src/pages/ExplorePage.tsx`
- Create: `driver-dna/frontend/src/pages/DriverPage.tsx`
- Create: `driver-dna/frontend/src/lib/format.ts`
- Create: `driver-dna/frontend/src/lib/cache.ts`
- Modify: `driver-dna/README.md`
- Test: `driver-dna/frontend` build + lint/typecheck commands

### Task 1: Scaffold Frontend Project

**Files:**
- Create: `driver-dna/frontend/package.json`
- Create: `driver-dna/frontend/index.html`
- Create: `driver-dna/frontend/tsconfig.json`
- Create: `driver-dna/frontend/vite.config.ts`
- Create: `driver-dna/frontend/src/main.tsx`
- Create: `driver-dna/frontend/src/App.tsx`

- [ ] **Step 1: Write the failing boot command**

Run: `cd driver-dna/frontend && npm run dev`  
Expected: FAIL (`package.json` missing)

- [ ] **Step 2: Add minimal Vite React TypeScript scaffold**

Add package scripts and deps:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 3: Add basic app mount**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 4: Verify app starts**

Run: `cd driver-dna/frontend && npm install && npm run dev`  
Expected: PASS (Vite dev server starts)

### Task 2: Add Tailwind + Base Dark Theme

**Files:**
- Create: `driver-dna/frontend/tailwind.config.js`
- Create: `driver-dna/frontend/postcss.config.js`
- Modify: `driver-dna/frontend/src/styles.css`

- [ ] **Step 1: Write failing style expectation**

Run: `cd driver-dna/frontend && npm run build`  
Expected: FAIL before Tailwind/PostCSS config is present.

- [ ] **Step 2: Add Tailwind config with content globs**

```js
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

- [ ] **Step 3: Add base dark styles**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-zinc-950 text-zinc-100;
}
```

- [ ] **Step 4: Verify production build**

Run: `cd driver-dna/frontend && npm run build`  
Expected: PASS

### Task 3: Routing + Explore Page

**Files:**
- Modify: `driver-dna/frontend/src/App.tsx`
- Create: `driver-dna/frontend/src/pages/ExplorePage.tsx`
- Create: `driver-dna/frontend/src/types/api.ts`

- [ ] **Step 1: Add route test-by-behavior**

Run: app and navigate to `/` and `/driver/2024/NOR`  
Expected: `/driver/...` route missing initially.

- [ ] **Step 2: Implement router skeleton**

```tsx
<Routes>
  <Route path="/" element={<ExplorePage />} />
  <Route path="/driver/:year/:code" element={<DriverPage />} />
</Routes>
```

- [ ] **Step 3: Build Explore page structure**

Include:
- Hero title/subtitle
- Year select
- Driver select
- Generate button (disabled until selection complete)

- [ ] **Step 4: Verify route navigation**

Run: `cd driver-dna/frontend && npm run dev`  
Expected: both routes render without runtime errors.

### Task 4: API Client + Drivers Fetch

**Files:**
- Create: `driver-dna/frontend/src/api/client.ts`
- Create: `driver-dna/frontend/src/api/driver.ts`
- Modify: `driver-dna/frontend/src/pages/ExplorePage.tsx`

- [ ] **Step 1: Write failing data fetch check**

Run app with backend running and select year.  
Expected: driver list not yet loaded.

- [ ] **Step 2: Implement reusable API client**

```ts
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}
```

- [ ] **Step 3: Add list/get driver API wrappers**

```ts
export function listDrivers(year: number) {
  return apiGet<DriversResponse>(`/api/drivers?year=${year}`);
}
```

- [ ] **Step 4: Wire Explore page to fetch drivers by year**

Behavior:
- loading indicator in dropdown
- inline retry message on error

- [ ] **Step 5: Verify API integration**

Run: backend + frontend; select 2024  
Expected: driver dropdown populated from API.

### Task 5: Driver Dashboard + Metric Fetch + Client Cache

**Files:**
- Create: `driver-dna/frontend/src/pages/DriverPage.tsx`
- Create: `driver-dna/frontend/src/lib/cache.ts`
- Modify: `driver-dna/frontend/src/api/driver.ts`

- [ ] **Step 1: Write failing dashboard fetch check**

Navigate directly to `/driver/2024/NOR`  
Expected: missing fetch/loading/error handling.

- [ ] **Step 2: Add metrics API + cache Map**

```ts
const metricsCache = new Map<string, DriverMetricsResponse>();
const key = `${year}:${code.toUpperCase()}`;
```

- [ ] **Step 3: Implement Driver page states**

UI states:
- loading skeleton
- retryable error
- success with sections

- [ ] **Step 4: Verify repeated navigation reuses cache**

Navigate Explore -> Driver -> Explore -> same Driver  
Expected: second load avoids network delay.

### Task 6: Team Color Theming + Shared Section Components

**Files:**
- Create: `driver-dna/frontend/src/theme/teamColors.ts`
- Create: `driver-dna/frontend/src/components/SectionCard.tsx`
- Modify: `driver-dna/frontend/src/pages/ExplorePage.tsx`
- Modify: `driver-dna/frontend/src/pages/DriverPage.tsx`

- [ ] **Step 1: Add team color map + fallback**

```ts
export function getTeamColor(team?: string): string {
  return TEAM_COLORS[team ?? ""] ?? "#a1a1aa";
}
```

- [ ] **Step 2: Apply accent color to CTA, headers, highlights**

Use CSS variables or inline style:

```tsx
style={{ "--accent": teamColor } as React.CSSProperties}
```

- [ ] **Step 3: Verify team accent changes by selected driver**

Expected: Ferrari driver appears red-accented, McLaren papaya-accented, etc.

### Task 7: Charts + Scroll Sections + Sticky Nav

**Files:**
- Create: `driver-dna/frontend/src/components/StickySectionNav.tsx`
- Create: `driver-dna/frontend/src/components/charts/BrakingChart.tsx`
- Create: `driver-dna/frontend/src/components/charts/ThrottleChart.tsx`
- Create: `driver-dna/frontend/src/components/charts/TyreChart.tsx`
- Create: `driver-dna/frontend/src/components/charts/ConsistencyCard.tsx`
- Create: `driver-dna/frontend/src/components/charts/QualiRaceChart.tsx`
- Create: `driver-dna/frontend/src/components/charts/CircuitPerformanceChart.tsx`
- Modify: `driver-dna/frontend/src/pages/DriverPage.tsx`

- [ ] **Step 1: Add section anchors and sticky nav**

Sections:
- `#overview`
- `#braking`
- `#throttle`
- `#tyres`
- `#consistency`
- `#quali-race`
- `#circuit-index`

- [ ] **Step 2: Implement each chart with null-safe data transforms**

Example transform:

```ts
const rows = (metrics.quali_vs_race?.rounds ?? []).map((r) => ({
  round: r.round,
  delta: r.grid_minus_finish ?? 0,
}));
```

- [ ] **Step 3: Add per-section empty-state fallback**

Message: `Not enough data for this metric yet.`

- [ ] **Step 4: Verify chart rendering for one known payload**

Expected: all section containers render; populated sections show charts without crashes.

### Task 8: White Track Layout Component

**Files:**
- Create: `driver-dna/frontend/src/components/TrackLayout.tsx`
- Modify: `driver-dna/frontend/src/pages/DriverPage.tsx`

- [ ] **Step 1: Add simple white SVG track component**

```tsx
<svg viewBox="0 0 300 160">
  <path d="..." stroke="#ffffff" fill="none" strokeWidth={4} />
</svg>
```

- [ ] **Step 2: Place it in Overview/hero region**

Expected: white track line visible on dark background.

- [ ] **Step 3: Verify accessibility contrast**

Expected: track remains clearly visible in default dark theme.

### Task 9: Final QA + Docs Update

**Files:**
- Modify: `driver-dna/README.md`

- [ ] **Step 1: Add frontend run instructions**

Document:
- backend run command
- frontend run command
- expected local URLs

- [ ] **Step 2: Run full verification**

Run:
- `cd driver-dna/frontend && npm run build`
- `cd driver-dna/backend && pytest -q`

Expected:
- frontend build PASS
- backend tests PASS

- [ ] **Step 3: Manual smoke test checklist**

- Landing loads
- Year changes driver list
- Generate navigates correctly
- Driver page scroll sections + sticky nav work
- Accent colors change by team
- Track layout is white

