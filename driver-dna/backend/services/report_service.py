"""Phase 2 placeholder scouting report generation."""

from __future__ import annotations

from typing import Any


def _fmt(value: Any, digits: int = 2) -> str:
    if value is None:
        return "n/a"
    if isinstance(value, (int, float)):
        return f"{value:.{digits}f}"
    return str(value)


def build_placeholder_report(metrics: dict[str, Any]) -> str:
    consistency = metrics.get("consistency", {})
    tyre = metrics.get("tyre_degradation", {})
    throttle = metrics.get("throttle_aggression", {})
    quali_race = metrics.get("quali_vs_race", {})
    braking = metrics.get("braking_profile", {})
    cpi = metrics.get("circuit_performance_index", {})

    return (
        "Telemetry-backed phase-2 scouting summary: "
        f"consistency std {_fmt(consistency.get('laptime_std_seconds'))}s, "
        f"tyre deg slope {_fmt(tyre.get('avg_laptime_slope_s_per_lap_within_stint'))}s/lap, "
        f"corner-exit throttle {_fmt(throttle.get('avg_throttle_pct_corner_exit'))}%, "
        f"grid-minus-finish {_fmt(quali_race.get('mean_grid_minus_finish'))}, "
        f"brake onset delta {_fmt(braking.get('season_avg_brake_onset_delta_m'))}m, "
        f"and expected-minus-actual {_fmt(cpi.get('mean_expected_minus_actual'))}. "
        "Final Claude-generated scouting prose will be enabled in Phase 4."
    )
