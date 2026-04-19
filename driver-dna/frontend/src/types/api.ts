export type ApiErrorCode =
  | "invalid_year"
  | "invalid_driver_code"
  | "network_error"
  | "upstream_error"
  | "unknown_error";

export interface ApiErrorResponse {
  detail: string;
  code: ApiErrorCode | string;
}

export interface DriverListItem {
  code: string;
  name: string | null;
  team: string | null;
}

export interface DriversResponse {
  year: number;
  cached: boolean;
  drivers: DriverListItem[];
}

export interface BrakingCircuitPoint {
  round: number;
  event?: string;
  circuit?: string;
  brake_onset_delta_m: number | null;
}

export interface BrakingProfileMetric {
  by_circuit?: BrakingCircuitPoint[];
  season_avg_brake_onset_delta_m: number | null;
}

export interface ThrottleAggressionMetric {
  avg_throttle_pct_corner_exit: number | null;
  teammate_avg_throttle_pct_corner_exit: number | null;
  delta_pct_vs_teammate: number | null;
}

export interface TyreDegradationMetric {
  avg_laptime_slope_s_per_lap_within_stint: number | null;
  stint_segments_used: number | null;
}

export interface ConsistencyMetric {
  laptime_std_seconds: number | null;
  lap_count: number | null;
}

export interface QualiRaceRoundMetric {
  round: number;
  event: string;
  grid_minus_finish: number | null;
}

export interface QualiRaceMetric {
  rounds?: QualiRaceRoundMetric[];
  mean_grid_minus_finish: number | null;
}

export interface CircuitPerformanceRoundMetric {
  round: number;
  event: string;
  expected_minus_actual: number | null;
}

export interface CircuitPerformanceMetric {
  rounds?: CircuitPerformanceRoundMetric[];
  mean_expected_minus_actual: number | null;
}

export interface DriverMetricsResponse {
  driver: string;
  year: number;
  rounds_analyzed: number;
  cached: boolean;
  team?: string | null;
  braking_profile?: BrakingProfileMetric;
  throttle_aggression?: ThrottleAggressionMetric;
  tyre_degradation?: TyreDegradationMetric;
  consistency?: ConsistencyMetric;
  quali_vs_race?: QualiRaceMetric;
  circuit_performance_index?: CircuitPerformanceMetric;
}
