import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDriverMetrics } from "../api/driver";
import { ApiError } from "../api/client";
import { SectionCard } from "../components/SectionCard";
import { StickySectionNav } from "../components/StickySectionNav";
import { TrackLayout } from "../components/TrackLayout";
import { BrakingChart } from "../components/charts/BrakingChart";
import { CircuitPerformanceChart } from "../components/charts/CircuitPerformanceChart";
import { ConsistencyCard } from "../components/charts/ConsistencyCard";
import { QualiRaceChart } from "../components/charts/QualiRaceChart";
import { ThrottleChart } from "../components/charts/ThrottleChart";
import { TyreChart } from "../components/charts/TyreChart";
import { getMetricsFromCache, setMetricsInCache } from "../lib/cache";
import { getTeamAccentColor, inferDriverTeam } from "../theme/teamColors";
import type { DriverMetricsResponse } from "../types/api";

const MIN_YEAR = 2018;
const MAX_YEAR = 2024;
const DRIVER_CODE_PATTERN = /^[A-Z]{3}$/;

export function DriverPage() {
  const { year, code } = useParams<{ year: string; code: string }>();
  const parsedYear = Number(year);
  const normalizedCode = code?.toUpperCase() ?? "";
  const hasValidParams =
    Number.isInteger(parsedYear) &&
    parsedYear >= MIN_YEAR &&
    parsedYear <= MAX_YEAR &&
    DRIVER_CODE_PATTERN.test(normalizedCode);
  const isRouteInvalid = !hasValidParams;

  const [metrics, setMetrics] = useState<DriverMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeRequestController = useRef<AbortController | null>(null);

  const sectionItems = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "braking", label: "Braking" },
      { id: "throttle", label: "Throttle" },
      { id: "tyres", label: "Tyres" },
      { id: "consistency", label: "Consistency" },
      { id: "quali-race", label: "Quali vs Race" },
      { id: "circuit-index", label: "Circuit Index" }
    ],
    []
  );

  const loadMetrics = useCallback(
    async (signal?: AbortSignal) => {
      if (isRouteInvalid) {
        setMetrics(null);
        setErrorMessage(null);
        setIsLoading(false);
        return;
      }

      const cached = getMetricsFromCache(parsedYear, normalizedCode);
      if (cached) {
        setMetrics(cached);
        setErrorMessage(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getDriverMetrics(parsedYear, normalizedCode, signal);
        setMetrics(response);
        setMetricsInCache(parsedYear, normalizedCode, response);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Unable to load metrics. Please try again.");
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [isRouteInvalid, parsedYear, normalizedCode]
  );

  const startLoad = useCallback(() => {
    activeRequestController.current?.abort();
    const controller = new AbortController();
    activeRequestController.current = controller;
    void loadMetrics(controller.signal);
  }, [loadMetrics]);

  useEffect(() => {
    startLoad();
  }, [startLoad]);

  useEffect(() => () => activeRequestController.current?.abort(), []);

  const team = inferDriverTeam(normalizedCode, metrics?.team);
  const accentColor = getTeamAccentColor(team);

  if (isRouteInvalid) {
    return (
    <main className="min-h-screen bg-black text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
        <section className="w-full rounded-3xl border border-rose-900/60 bg-slate-900/60 p-8 shadow-2xl shadow-black/30 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-300">
              Driver DNA
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              Invalid driver route parameters
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Use a valid URL in the format <code>/driver/2024/NOR</code>.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              Back to Explore
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/25">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl" style={{ backgroundColor: accentColor }} />
          <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: accentColor }}>
            Driver DNA
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
            {normalizedCode} in {parsedYear}
          </h1>
          <p className="mt-2 text-sm text-slate-300 md:text-base">
            Telemetry-driven season story with sectioned insights and team-tinted visuals.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex rounded-xl border border-white/10 bg-zinc-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-zinc-800"
          >
            Back to Explore
          </Link>
        </header>

        {isLoading ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-zinc-950 p-6">
            <p className="text-sm font-medium text-slate-200">Loading driver metrics...</p>
            <p className="mt-1 text-xs text-slate-400">
              First load may take longer while data warms up.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-800/80" />
              ))}
            </div>
          </section>
        ) : null}

        {!isLoading && errorMessage ? (
          <section className="mt-6 rounded-2xl border border-rose-500/50 bg-rose-950/40 p-6">
            <p className="text-sm text-rose-100">{errorMessage}</p>
            <button
              type="button"
              onClick={startLoad}
              className="mt-3 rounded-md border border-rose-400/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-100 transition hover:bg-rose-900/60"
            >
              Retry
            </button>
          </section>
        ) : null}

        {!isLoading && !errorMessage && metrics ? (
          <div className="mt-6">
            <StickySectionNav items={sectionItems} accentColor={accentColor} />
            <div className="grid gap-5">
              <SectionCard
                id="overview"
                title="Overview"
                subtitle={`${metrics.rounds_analyzed} rounds analyzed`}
                accentColor={accentColor}
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-3 text-sm text-slate-300 md:col-span-2">
                    <p>
                      Team: <span className="font-semibold text-slate-100">{team ?? "Unknown"}</span>
                    </p>
                    <p>
                      Cache:{" "}
                      <span className="font-semibold text-slate-100">
                        {metrics.cached ? "Backend cache hit" : "Fresh payload"}
                      </span>
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Rounds</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{metrics.rounds_analyzed}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Consistency</p>
                        <p className="mt-1 text-2xl font-semibold text-white">
                          {metrics.consistency?.laptime_std_seconds?.toFixed(3) ?? "--"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">QvR Delta</p>
                        <p className="mt-1 text-2xl font-semibold text-white">
                          {metrics.quali_vs_race?.mean_grid_minus_finish?.toFixed(2) ?? "--"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <TrackLayout />
                </div>
              </SectionCard>

              <SectionCard id="braking" title="Braking" accentColor={accentColor}>
                <BrakingChart metric={metrics.braking_profile} accentColor={accentColor} />
              </SectionCard>

              <SectionCard id="throttle" title="Throttle" accentColor={accentColor}>
                <ThrottleChart metric={metrics.throttle_aggression} accentColor={accentColor} />
              </SectionCard>

              <SectionCard id="tyres" title="Tyres" accentColor={accentColor}>
                <TyreChart metric={metrics.tyre_degradation} accentColor={accentColor} />
              </SectionCard>

              <SectionCard id="consistency" title="Consistency" accentColor={accentColor}>
                <ConsistencyCard metric={metrics.consistency} accentColor={accentColor} />
              </SectionCard>

              <SectionCard id="quali-race" title="Quali vs Race" accentColor={accentColor}>
                <QualiRaceChart metric={metrics.quali_vs_race} accentColor={accentColor} />
              </SectionCard>

              <SectionCard id="circuit-index" title="Circuit Index" accentColor={accentColor}>
                <CircuitPerformanceChart
                  metric={metrics.circuit_performance_index}
                  accentColor={accentColor}
                />
              </SectionCard>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
