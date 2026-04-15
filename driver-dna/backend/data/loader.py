"""
FastF1 session loading for a single driver across a season.

Phase 1: loads race sessions (telemetry + laps) per round. Qualifying is not
required for the MVP metrics grid (grid comes from race results).
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Iterator, Optional

import fastf1
from fastf1.ergast import Ergast

logger = logging.getLogger(__name__)

MIN_SEASON = 2018
MAX_SEASON = 2024


def _norm_team(name: Optional[str]) -> str:
    if not name:
        return ""
    return re.sub(r"[^a-z0-9]", "", name.lower())


def enable_cache(cache_dir: str | Path | None) -> Path:
    """Enable FastF1 on-disk cache; returns resolved cache path."""
    root = Path(__file__).resolve().parent
    path = Path(cache_dir) if cache_dir else root / "cache"
    path.mkdir(parents=True, exist_ok=True)
    fastf1.Cache.enable_cache(str(path))
    return path


def get_teammate_code(session: Any, driver_code: str) -> Optional[str]:
    """Return the other driver's TLA on the same team, if any."""
    res = session.results
    if res is None or res.empty:
        return None
    row = res[res["Abbreviation"] == driver_code]
    if row.empty or "TeamName" not in res.columns:
        return None
    team = row.iloc[0]["TeamName"]
    mates = res[res["TeamName"] == team]
    codes = [c for c in mates["Abbreviation"].tolist() if c != driver_code]
    return codes[0] if codes else None


def fetch_constructor_wcc_ranks(year: int) -> dict[str, int]:
    """Normalized constructor name -> championship rank (1 = best)."""
    erg = Ergast()
    resp = erg.get_constructor_standings(season=year, result_type="pandas")
    if not resp.content:
        return {}
    df = resp.content[0]
    out: dict[str, int] = {}
    for _, r in df.iterrows():
        key = _norm_team(str(r.get("constructorName", "")))
        if key:
            out[key] = int(r["position"])
    return out


@dataclass
class RoundLoad:
    year: int
    round_number: int
    event_name: str
    session: Any
    driver_code: str
    teammate_code: Optional[str]
    team_name: Optional[str]


@dataclass
class SeasonLoad:
    driver: str
    year: int
    rounds: list[RoundLoad] = field(default_factory=list)
    constructor_wcc_rank: dict[str, int] = field(default_factory=dict)


def load_driver_season(
    driver_code: str,
    year: int,
    *,
    cache_dir: str | Path | None = None,
    on_round_loaded: Optional[Callable[[RoundLoad], None]] = None,
    max_rounds: Optional[int] = None,
) -> SeasonLoad:
    """
    Load all race sessions for ``driver_code`` in ``year`` where data exists.

    Skips test events and rounds where the driver has no race laps.
    """
    if year < MIN_SEASON or year > MAX_SEASON:
        raise ValueError(f"Year {year} outside supported MVP range {MIN_SEASON}-{MAX_SEASON}")

    enable_cache(cache_dir)
    driver_code = driver_code.upper()
    schedule = fastf1.get_event_schedule(year, include_testing=False)

    season = SeasonLoad(driver=driver_code, year=year)
    try:
        season.constructor_wcc_rank = fetch_constructor_wcc_ranks(year)
    except Exception as exc:
        logger.warning("Constructor standings unavailable: %s", exc)

    for _, ev in schedule.iterrows():
        round_number = int(ev["RoundNumber"])
        event_name = str(ev["EventName"])
        try:
            session = fastf1.get_session(year, round_number, "R")
            session.load(laps=True, telemetry=True, weather=False, messages=False)
        except Exception as exc:
            logger.debug("Skip round %s (%s): %s", round_number, event_name, exc)
            continue

        laps = session.laps.pick_drivers(driver_code)
        if laps is None or laps.empty:
            logger.debug("No laps for %s at %s", driver_code, event_name)
            continue

        team_row = session.results[session.results["Abbreviation"] == driver_code]
        team_name = str(team_row.iloc[0]["TeamName"]) if not team_row.empty else None
        teammate = get_teammate_code(session, driver_code)

        rnd = RoundLoad(
            year=year,
            round_number=round_number,
            event_name=event_name,
            session=session,
            driver_code=driver_code,
            teammate_code=teammate,
            team_name=team_name,
        )
        season.rounds.append(rnd)
        if on_round_loaded:
            on_round_loaded(rnd)
        if max_rounds is not None and len(season.rounds) >= max_rounds:
            break

    return season


def iter_rounds(season: SeasonLoad) -> Iterator[RoundLoad]:
    yield from season.rounds
