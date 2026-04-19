import { render, screen, waitFor } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { clearMetricsCache } from "../lib/cache";
import { DriverPage } from "./DriverPage";

type FetchResponseOptions = {
  ok: boolean;
  status?: number;
  body?: unknown;
};

function createJsonResponse({
  ok,
  status = ok ? 200 : 500,
  body
}: FetchResponseOptions): Response {
  return {
    ok,
    status,
    json: async () => body
  } as Response;
}

function DriverPageWithNavHarness() {
  return (
    <>
      <Routes>
        <Route path="/driver/:year/:code" element={<DriverPage />} />
        <Route path="*" element={<div>fallback</div>} />
      </Routes>
      <RouteNavButtons />
    </>
  );
}

function RouteNavButtons() {
  return (
    <div>
      <LinkButton to="/driver/2017/NO" label="Go invalid route" />
    </div>
  );
}

function LinkButton({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} aria-label={label}>
      {label}
    </Link>
  );
}

const metricsFixture = {
  driver: "NOR",
  year: 2024,
  rounds_analyzed: 4,
  cached: false,
  team: "McLaren",
  braking_profile: {
    by_circuit: [
      {
        round: 1,
        circuit: "Bahrain",
        brake_onset_delta_m: 1.2
      },
      {
        round: 2,
        circuit: "Jeddah",
        brake_onset_delta_m: -0.4
      }
    ],
    season_avg_brake_onset_delta_m: 0.3
  },
  throttle_aggression: {
    avg_throttle_pct_corner_exit: 82.4,
    teammate_avg_throttle_pct_corner_exit: 80.3,
    delta_pct_vs_teammate: 2.1
  },
  tyre_degradation: {
    avg_laptime_slope_s_per_lap_within_stint: 0.07,
    stint_segments_used: 6
  },
  consistency: {
    laptime_std_seconds: 0.24,
    lap_count: 218
  },
  quali_vs_race: {
    mean_grid_minus_finish: 1.4,
    rounds: [
      { round: 1, event: "Bahrain", grid_minus_finish: 2 },
      { round: 2, event: "Jeddah", grid_minus_finish: 1 }
    ]
  },
  circuit_performance_index: {
    mean_expected_minus_actual: 1.1,
    rounds: [
      { round: 1, event: "Bahrain", expected_minus_actual: 1.6 },
      { round: 2, event: "Jeddah", expected_minus_actual: 0.8 }
    ]
  }
};

describe("DriverPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearMetricsCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("shows guard UI for invalid params", async () => {
    render(
      <MemoryRouter initialEntries={["/driver/2017/12"]}>
        <Routes>
          <Route path="/driver/:year/:code" element={<DriverPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByText(/invalid driver route parameters/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to explore/i })
    ).toBeInTheDocument();
  });

  test("shows loading then renders all dashboard sections", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        body: metricsFixture
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/driver/2024/NOR"]}>
        <Routes>
          <Route path="/driver/:year/:code" element={<DriverPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/loading driver metrics/i)).toBeInTheDocument();
    await screen.findByRole("heading", { name: /NOR in 2024/i });

    expect(screen.getByRole("link", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /braking/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /throttle/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /tyres/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /consistency/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /quali vs race/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /circuit index/i })
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("max_rounds=4"),
      expect.anything()
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("max_telemetry_laps=3"),
      expect.anything()
    );
  });

  test("shows retryable error and succeeds after retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: false,
          status: 500,
          body: { detail: "Upstream failed", code: "upstream_error" }
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          ok: true,
          body: metricsFixture
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/driver/2024/NOR"]}>
        <Routes>
          <Route path="/driver/:year/:code" element={<DriverPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText(/upstream failed/i);
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    await screen.findByRole("heading", { name: /NOR in 2024/i });
  });

  test("renders graceful fallback when metric sections are empty", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        body: {
          ...metricsFixture,
          braking_profile: { by_circuit: [], season_avg_brake_onset_delta_m: null },
          throttle_aggression: {
            avg_throttle_pct_corner_exit: null,
            teammate_avg_throttle_pct_corner_exit: null,
            delta_pct_vs_teammate: null
          },
          tyre_degradation: {
            avg_laptime_slope_s_per_lap_within_stint: null,
            stint_segments_used: 0
          },
          consistency: { laptime_std_seconds: null, lap_count: 0 },
          quali_vs_race: { mean_grid_minus_finish: null, rounds: [] },
          circuit_performance_index: {
            mean_expected_minus_actual: null,
            rounds: []
          }
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/driver/2024/NOR"]}>
        <Routes>
          <Route path="/driver/:year/:code" element={<DriverPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: /NOR in 2024/i });
    expect(
      screen.getAllByText(/not enough data for this metric yet/i).length
    ).toBeGreaterThan(0);
  });

  test("reuses client metrics cache for repeat navigation key", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        createJsonResponse({
          ok: true,
          body: metricsFixture
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = render(
      <MemoryRouter initialEntries={["/driver/2024/NOR"]}>
        <Routes>
          <Route path="/driver/:year/:code" element={<DriverPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: /NOR in 2024/i });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    rerender(
      <MemoryRouter initialEntries={["/driver/2024/NOR"]}>
        <Routes>
          <Route path="/driver/:year/:code" element={<DriverPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  test("handles valid to invalid route transition without hook-order crash", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        body: metricsFixture
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter initialEntries={["/driver/2024/NOR"]}>
        <DriverPageWithNavHarness />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: /NOR in 2024/i });
    await userEvent.click(screen.getByRole("link", { name: /go invalid route/i }));

    expect(
      await screen.findByText(/invalid driver route parameters/i)
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
