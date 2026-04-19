"""Service functions for driver endpoints."""

from __future__ import annotations

import os
from typing import Any

import fastf1

from data.loader import MAX_SEASON, MIN_SEASON, load_driver_season
from data.processor import compute_all_metrics, metrics_to_json_dict
from errors import BadRequestError, NotFoundError, UpstreamError
from schemas import DriverItem
from services.cache import cache

DRIVERS_TTL_SECONDS = 12 * 60 * 60
METRICS_TTL_SECONDS = 6 * 60 * 60


def _env_int(name: str, default: int, minimum: int) -> int:
    try:
        return max(minimum, int(os.getenv(name, str(default))))
    except (TypeError, ValueError):
        return default


# Fast-path defaults for interactive UI. Can be overridden by env.
DEFAULT_MAX_ROUNDS = _env_int("DRIVER_DNA_MAX_ROUNDS", 8, 1)
DEFAULT_MAX_TELEMETRY_LAPS = _env_int("DRIVER_DNA_MAX_TELEMETRY_LAPS", 6, 1)


def _validate_year(year: int) -> None:
    if year < MIN_SEASON or year > MAX_SEASON:
        raise BadRequestError(
            detail=f"Year must be between {MIN_SEASON} and {MAX_SEASON}",
            code="invalid_year",
        )


def _collect_drivers_for_year(year: int) -> list[DriverItem]:
    schedule = fastf1.get_event_schedule(year, include_testing=False)
    by_code: dict[str, DriverItem] = {}

    for _, ev in schedule.iterrows():
        round_number = int(ev["RoundNumber"])
        session = fastf1.get_session(year, round_number, "R")
        session.load(laps=False, telemetry=False, weather=False, messages=False)
        res = session.results
        if res is None or res.empty:
            continue

        for _, row in res.iterrows():
            code = str(row.get("Abbreviation", "")).upper()
            if not code:
                continue
            if code in by_code:
                continue
            name = row.get("BroadcastName") or row.get("FullName")
            team = row.get("TeamName")
            by_code[code] = DriverItem(
                code=code,
                name=str(name) if name else None,
                team=str(team) if team else None,
            )

    return [by_code[k] for k in sorted(by_code.keys())]


def list_drivers(year: int, force_refresh: bool = False) -> tuple[list[DriverItem], bool]:
    _validate_year(year)
    cache_key = f"drivers:{year}"

    if not force_refresh:
        hit, payload = cache.get(cache_key)
        if hit:
            return payload, True

    try:
        payload = _collect_drivers_for_year(year)
    except BadRequestError:
        raise
    except Exception as exc:
        raise UpstreamError(detail=f"Failed to load drivers for {year}: {exc}") from exc

    if not payload:
        raise NotFoundError(detail=f"No drivers found for season {year}", code="drivers_not_found")

    cache.set(cache_key, payload, DRIVERS_TTL_SECONDS)
    return payload, False


def _compute_driver_metrics(
    code: str,
    year: int,
    max_rounds: int = DEFAULT_MAX_ROUNDS,
    max_telemetry_laps: int = DEFAULT_MAX_TELEMETRY_LAPS,
) -> dict[str, Any]:
    season = load_driver_season(code, year, max_rounds=max_rounds)
    if not season.rounds:
        raise NotFoundError(
            detail=f"No race data found for driver {code} in {year}",
            code="driver_not_found",
        )
    metrics = compute_all_metrics(
        season,
        max_laps_per_round_telemetry=max_telemetry_laps,
    )
    return metrics_to_json_dict(metrics)


def get_driver_metrics(
    code: str,
    year: int,
    force_refresh: bool = False,
    max_rounds: int | None = None,
    max_telemetry_laps: int | None = None,
) -> tuple[dict[str, Any], bool]:
    _validate_year(year)
    code = (code or "").strip().upper()
    if len(code) != 3:
        raise BadRequestError(detail="Driver code must be a 3-letter abbreviation", code="invalid_driver_code")

    rounds_limit = max_rounds if max_rounds is not None else DEFAULT_MAX_ROUNDS
    telemetry_laps_limit = (
        max_telemetry_laps if max_telemetry_laps is not None else DEFAULT_MAX_TELEMETRY_LAPS
    )
    cache_key = f"metrics:{year}:{code}:r{rounds_limit}:l{telemetry_laps_limit}"
    if not force_refresh:
        hit, payload = cache.get(cache_key)
        if hit:
            return payload, True

    try:
        payload = _compute_driver_metrics(
            code=code,
            year=year,
            max_rounds=rounds_limit,
            max_telemetry_laps=telemetry_laps_limit,
        )
    except (BadRequestError, NotFoundError):
        raise
    except Exception as exc:
        raise UpstreamError(detail=f"Failed to compute metrics for {code} {year}: {exc}") from exc

    cache.set(cache_key, payload, METRICS_TTL_SECONDS)
    return payload, False
