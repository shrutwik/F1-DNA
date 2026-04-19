import type { DriverMetricsResponse } from "../types/api";

const metricsCache = new Map<string, DriverMetricsResponse>();

const toKey = (year: number, code: string) => `${year}:${code.toUpperCase()}`;

export const getMetricsFromCache = (year: number, code: string) =>
  metricsCache.get(toKey(year, code));

export const setMetricsInCache = (
  year: number,
  code: string,
  metrics: DriverMetricsResponse
) => {
  metricsCache.set(toKey(year, code), metrics);
};

export const clearMetricsCache = () => {
  metricsCache.clear();
};
