import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDriversByYear } from "../api/driver";
import { ApiError } from "../api/client";
import type { DriverListItem } from "../types/api";
import { getTeamAccentColor } from "../theme/teamColors";

const MIN_YEAR = 2018;
const MAX_YEAR = 2024;

const getYearsDescending = () => {
  const years: number[] = [];
  for (let year = MAX_YEAR; year >= MIN_YEAR; year -= 1) {
    years.push(year);
  }
  return years;
};

export function ExplorePage() {
  const navigate = useNavigate();
  const years = useMemo(getYearsDescending, []);
  const [year, setYear] = useState<number>(years[0]);
  const [drivers, setDrivers] = useState<DriverListItem[]>([]);
  const [driverCode, setDriverCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeRequestController = useRef<AbortController | null>(null);

  const loadDrivers = useCallback(async (targetYear: number, signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMessage(null);
    setDriverCode("");

    try {
      const response = await getDriversByYear(targetYear, signal);
      setDrivers(response.drivers);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setDrivers([]);
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unable to load drivers. Please try again.");
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  const startDriverLoad = useCallback(
    (targetYear: number) => {
      activeRequestController.current?.abort();
      const controller = new AbortController();
      activeRequestController.current = controller;
      void loadDrivers(targetYear, controller.signal);
    },
    [loadDrivers]
  );

  useEffect(() => {
    startDriverLoad(year);
  }, [year, startDriverLoad]);

  useEffect(() => {
    return () => activeRequestController.current?.abort();
  }, []);

  const handleGenerate = () => {
    if (!driverCode) {
      return;
    }
    navigate(`/driver/${year}/${driverCode}`);
  };

  const selectedDriver = drivers.find((driver) => driver.code === driverCode);
  const accentColor = getTeamAccentColor(selectedDriver?.team);

  return (
    <main className="min-h-screen bg-black text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
        <section className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-8 shadow-2xl shadow-black/30">
          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ backgroundColor: accentColor }} />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Formula 1 Telemetry
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-5xl">
            Driver DNA
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            High-fidelity performance analysis and telemetry metrics across modern F1 seasons.
            Select year and driver to initialize analysis.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-300">
                Year
              </span>
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-slate-100 outline-none ring-white/40 transition focus:ring-2"
              >
                {years.map((seasonYear) => (
                  <option key={seasonYear} value={seasonYear}>
                    {seasonYear}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-300">
                Driver
              </span>
              <select
                value={driverCode}
                onChange={(event) => setDriverCode(event.target.value)}
                disabled={isLoading || drivers.length === 0}
                className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-slate-100 outline-none ring-white/40 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {isLoading ? "Loading drivers..." : "Select a driver"}
                </option>
                {drivers.map((driver) => (
                  <option key={driver.code} value={driver.code}>
                    {driver.code} - {driver.name ?? "Unknown"}{" "}
                    {driver.team ? `(${driver.team})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading || !driverCode}
                style={{ backgroundColor: accentColor }}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-black/30 transition hover:-translate-y-px hover:brightness-110 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                Generate DNA
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-lg border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-200">
              <p>{errorMessage}</p>
              <button
                type="button"
                onClick={() => startDriverLoad(year)}
                className="mt-3 rounded-md border border-rose-400/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-100 transition hover:bg-rose-900/60"
              >
                Retry
              </button>
            </div>
          ) : null}

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Data Points</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">1.2B+</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Query Latency</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">~2ms</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Driver Profiles</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">60+</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
