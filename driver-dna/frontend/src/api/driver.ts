import { apiGet } from "./client";
import type { DriverMetricsResponse, DriversResponse } from "../types/api";

const DRIVER_PAGE_QUERY_PROFILE = {
  max_rounds: 4,
  max_telemetry_laps: 3
} as const;

export const getDriversByYear = (
  year: number,
  signal?: AbortSignal
): Promise<DriversResponse> => {
  return apiGet<DriversResponse>("/api/drivers", { year }, signal);
};

export const getDriverMetrics = (
  year: number,
  code: string,
  signal?: AbortSignal
): Promise<DriverMetricsResponse> => {
  return apiGet<DriverMetricsResponse>(
    `/api/driver/${code.toUpperCase()}`,
    { year, ...DRIVER_PAGE_QUERY_PROFILE },
    signal
  );
};
