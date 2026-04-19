"""
Compute the six Driver DNA metrics from :class:`loader.SeasonLoad`.
"""

from __future__ import annotations

import math
from typing import Any, Optional

import numpy as np
import pandas as pd

from .loader import RoundLoad, SeasonLoad, _norm_team

# ---------------------------------------------------------------------------
# Lap filtering
# ---------------------------------------------------------------------------


def _lap_time_seconds(val: Any) -> Optional[float]:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    if hasattr(val, "total_seconds"):
        try:
            return float(val.total_seconds())
        except (TypeError, ValueError):
            return None
    try:
        td = pd.to_timedelta(val)
        return float(td.total_seconds())
    except (TypeError, ValueError):
        return None


def laps_to_dataframe(session: Any, driver_code: str) -> pd.DataFrame:
    """Race laps for one driver as a plain DataFrame (one row per lap)."""
    laps = session.laps.pick_drivers(driver_code)
    if laps is None or laps.empty:
        return pd.DataFrame()
    return pd.DataFrame(laps.copy())


def pick_clean_laps_df(df: pd.DataFrame) -> pd.DataFrame:
    """Green-flag racing laps suitable for consistency / deg (excl. lap 1)."""
    if df.empty:
        return df
    d = df.copy()
    d = d[d["LapNumber"].fillna(0) >= 2]
    d = d[d["Deleted"].ne(True)]
    d = d[d["TrackStatus"].astype(str) == "1"]
    # Drop obvious in/out laps if marked
    if "PitInTime" in d.columns:
        d = d[d["PitInTime"].isna()]
    if "PitOutTime" in d.columns:
        d = d[d["PitOutTime"].isna()]
    if "IsAccurate" in d.columns:
        d = d[d["IsAccurate"].fillna(True).astype(bool)]
    # Convert in vectorized form to avoid timedelta-vs-float comparisons.
    lt = pd.to_timedelta(d["LapTime"], errors="coerce").dt.total_seconds()
    d = d.assign(_lt=lt.astype(float))
    d = d[d["_lt"].notna() & (d["_lt"] > 30.0) & (d["_lt"] < 300.0)]
    return d


def pick_telemetry_laps(session: Any, driver_code: str, max_laps: int = 14) -> list:
    """Subset of :class:`fastf1.core.Lap` objects for heavy telemetry work."""
    laps = session.laps.pick_drivers(driver_code)
    if laps is None or laps.empty:
        return []
    buf = []
    for _, lap in laps.iterlaps():
        if lap.get("LapNumber", 0) < 2:
            continue
        if lap.get("Deleted") is True:
            continue
        if str(lap.get("TrackStatus", "")) != "1":
            continue
        if lap.get("IsAccurate") is False:
            continue
        pit_in = lap.get("PitInTime")
        if pit_in is not None and pd.notna(pit_in):
            continue
        pit_out = lap.get("PitOutTime")
        if pit_out is not None and pd.notna(pit_out):
            continue
        buf.append(lap)
    if len(buf) > max_laps:
        idx = np.linspace(0, len(buf) - 1, max_laps, dtype=int)
        buf = [buf[i] for i in idx]
    return buf


# ---------------------------------------------------------------------------
# Telemetry geometry
# ---------------------------------------------------------------------------


def _brake_onset_distance(tel: pd.DataFrame, d_lo: float, d_hi: float) -> Optional[float]:
    seg = tel[(tel["Distance"] >= d_lo) & (tel["Distance"] <= d_hi)].sort_values("Distance")
    if seg.empty:
        return None
    on = seg[seg["Brake"] == True]  # noqa: E712
    if on.empty:
        return None
    return float(on.iloc[0]["Distance"])


def _throttle_exit_sample(tel: pd.DataFrame, d_corner: float, d_next: float) -> Optional[float]:
    span = (d_next - d_corner) if d_next > d_corner else (d_next + 1000 - d_corner)
    offset = min(120.0, max(40.0, span * 0.35))
    target = d_corner + offset
    if d_next > d_corner and target >= d_next - 15:
        target = d_next - 20
    lo, hi = target - 25, target + 25
    seg = tel[(tel["Distance"] >= lo) & (tel["Distance"] <= hi)]
    if seg.empty:
        return None
    return float(seg["Throttle"].mean())


def _corner_segments(circuit_info: Any, lap_length: float) -> list[tuple[float, float, float]]:
    corners = circuit_info.corners.sort_values("Distance").reset_index(drop=True)
    rows = []
    n = len(corners)
    for i in range(n):
        d_corner = float(corners.iloc[i]["Distance"])
        d_prev = float(corners.iloc[i - 1]["Distance"]) if i > 0 else 0.0
        if i + 1 < n:
            d_next = float(corners.iloc[i + 1]["Distance"])
        else:
            d_next = float(corners.iloc[0]["Distance"]) + lap_length
        rows.append((d_prev, d_corner, d_next))
    return rows


def _telemetry_braking_throttle_round(
    rnd: RoundLoad,
    driver_code: str,
    max_laps: int,
) -> tuple[list[float], list[float], int]:
    """Returns (brake_onset_distances, throttle_exit_pcts, sample_corner_count)."""
    session = rnd.session
    try:
        ci = session.get_circuit_info()
    except Exception:
        return [], [], 0

    brake_dists: list[float] = []
    throttles: list[float] = []
    laps = pick_telemetry_laps(session, driver_code, max_laps=max_laps)
    if not laps:
        return [], [], 0

    segs = None
    for lap in laps:
        try:
            tel = lap.get_telemetry()
        except Exception:
            continue
        if tel is None or tel.empty:
            continue
        lap_len = float(tel["Distance"].max()) or 0.0
        if lap_len < 1000:
            continue
        if segs is None:
            segs = _corner_segments(ci, lap_len)
        window = 420.0
        for d_prev, d_corner, d_next in segs:
            d_lo = max(d_prev, d_corner - window)
            d_hi = d_corner
            b = _brake_onset_distance(tel, d_lo, d_hi)
            if b is not None:
                brake_dists.append(b)
            t = _throttle_exit_sample(tel, d_corner, d_next)
            if t is not None:
                throttles.append(t)

    return brake_dists, throttles, len(segs or [])


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------


def compute_braking_and_throttle(
    season: SeasonLoad,
    *,
    max_laps_per_round: int = 14,
) -> tuple[dict[str, Any], dict[str, Any]]:
    by_circuit = []
    drv_br_all: list[float] = []
    mate_br_all: list[float] = []
    drv_th_all: list[float] = []
    mate_th_all: list[float] = []

    for rnd in season.rounds:
        b1, t1, _ = _telemetry_braking_throttle_round(
            rnd, rnd.driver_code, max_laps_per_round
        )
        b2, t2, _ = ([], [], 0)
        if rnd.teammate_code:
            b2, t2, _ = _telemetry_braking_throttle_round(
                rnd, rnd.teammate_code, max_laps_per_round
            )

        def _mean(xs: list[float]) -> Optional[float]:
            return float(np.mean(xs)) if xs else None

        m_drv_b = _mean(b1)
        m_mate_b = _mean(b2)
        m_drv_t = _mean(t1)
        m_mate_t = _mean(t2)

        delta_b = None
        if m_drv_b is not None and m_mate_b is not None:
            delta_b = m_drv_b - m_mate_b
            drv_br_all.append(m_drv_b)
            mate_br_all.append(m_mate_b)

        delta_t = None
        if m_drv_t is not None and m_mate_t is not None:
            delta_t = m_drv_t - m_mate_t
        if t1:
            drv_th_all.extend(t1)
        if t2:
            mate_th_all.extend(t2)

        by_circuit.append(
            {
                "round": rnd.round_number,
                "circuit": rnd.event_name,
                "driver_mean_brake_onset_m": m_drv_b,
                "teammate_mean_brake_onset_m": m_mate_b,
                "brake_onset_delta_m": delta_b,
                "driver_mean_throttle_exit_pct": m_drv_t,
                "teammate_mean_throttle_exit_pct": m_mate_t,
                "throttle_exit_delta_pct": delta_t,
                "telemetry_samples_brake": len(b1),
                "telemetry_samples_throttle": len(t1),
            }
        )

    def _pair_mean_delta(a: list[float], b: list[float]) -> Optional[float]:
        n = min(len(a), len(b))
        if n == 0:
            return None
        return float(np.mean([a[i] - b[i] for i in range(n)]))

    braking = {
        "by_circuit": by_circuit,
        "season_avg_brake_onset_delta_m": _pair_mean_delta(drv_br_all, mate_br_all),
        "interpretation": "Positive delta_m means later average brake application vs teammate "
        "(higher onset distance = closer to corner before braking).",
    }
    throttle = {
        "avg_throttle_pct_corner_exit": float(np.mean(drv_th_all)) if drv_th_all else None,
        "teammate_avg_throttle_pct_corner_exit": float(np.mean(mate_th_all)) if mate_th_all else None,
        "delta_pct_vs_teammate": (
            float(np.mean(drv_th_all) - np.mean(mate_th_all))
            if drv_th_all and mate_th_all
            else None
        ),
        "interpretation": "Higher throttle at corner exit => more aggressive power application.",
    }
    return braking, throttle


def compute_tyre_degradation(season: SeasonLoad) -> dict[str, Any]:
    slopes: list[float] = []
    for rnd in season.rounds:
        df = laps_to_dataframe(rnd.session, rnd.driver_code)
        df = pick_clean_laps_df(df)
        if df.empty or "Stint" not in df.columns:
            continue
        for _, g in df.groupby("Stint", sort=False):
            g = g.sort_values("LapNumber")
            if len(g) < 4:
                continue
            y = g["_lt"].to_numpy() if "_lt" in g.columns else g["LapTime"].map(_lap_time_seconds).to_numpy()
            x = np.arange(len(y), dtype=float)
            slope = float(np.polyfit(x, y, 1)[0])
            slopes.append(slope)

    return {
        "avg_laptime_slope_s_per_lap_within_stint": float(np.mean(slopes)) if slopes else None,
        "stint_segments_used": len(slopes),
        "unit": "seconds of lap time added per lap within a stint (larger = steeper deg)",
    }


def compute_quali_vs_race(season: SeasonLoad) -> dict[str, Any]:
    rounds_out = []
    deltas = []
    for rnd in season.rounds:
        session = rnd.session
        res = session.results
        if res is None or res.empty:
            continue
        row = res[res["Abbreviation"] == rnd.driver_code]
        if row.empty:
            continue
        grid = row.iloc[0].get("GridPosition")
        fin = row.iloc[0].get("Position")
        try:
            g = float(grid) if grid is not None and not pd.isna(grid) else None
            f = float(fin) if fin is not None and not pd.isna(fin) else None
        except (TypeError, ValueError):
            g, f = None, None
        if g is None or f is None:
            continue
        delta = g - f
        deltas.append(delta)
        rounds_out.append(
            {
                "round": rnd.round_number,
                "event": rnd.event_name,
                "grid_position": g,
                "finish_position": f,
                "grid_minus_finish": delta,
            }
        )

    return {
        "rounds": rounds_out,
        "mean_grid_minus_finish": float(np.mean(deltas)) if deltas else None,
        "interpretation": "Positive mean => gains places on Sunday vs grid (race-day performer).",
    }


def compute_consistency(season: SeasonLoad) -> dict[str, Any]:
    times: list[float] = []
    for rnd in season.rounds:
        df = laps_to_dataframe(rnd.session, rnd.driver_code)
        df = pick_clean_laps_df(df)
        if df.empty:
            continue
        col = "_lt" if "_lt" in df.columns else None
        if col:
            times.extend(df[col].dropna().tolist())
        else:
            for v in df["LapTime"]:
                s = _lap_time_seconds(v)
                if s is not None:
                    times.append(s)

    if len(times) < 3:
        return {"laptime_std_seconds": None, "lap_count": len(times)}

    arr = np.array(times, dtype=float)
    med = float(np.median(arr))
    mask = (arr >= med * 0.97) & (arr <= med * 1.03)
    trimmed = arr[mask] if mask.sum() >= 10 else arr

    return {
        "laptime_std_seconds": float(np.std(trimmed)),
        "lap_count": int(len(times)),
        "interpretation": "Lower std => more repeatable lap times on clean laps.",
    }


def compute_circuit_performance(season: SeasonLoad) -> dict[str, Any]:
    wcc = season.constructor_wcc_rank
    team_key = _norm_team(season.rounds[0].team_name) if season.rounds else ""
    wcc_rank = wcc.get(team_key) if team_key else None

    scores = []
    details = []
    for rnd in season.rounds:
        tkey = _norm_team(rnd.team_name)
        rank = wcc.get(tkey) if tkey else None
        if rank is None:
            rank = 6
        expected = min(20.0, max(1.0, 0.75 + rank * 1.85))

        res = rnd.session.results
        if res is None or res.empty:
            continue
        row = res[res["Abbreviation"] == rnd.driver_code]
        if row.empty:
            continue
        fin = row.iloc[0].get("Position")
        try:
            f = float(fin) if fin is not None and not pd.isna(fin) else None
        except (TypeError, ValueError):
            f = None
        if f is None:
            continue
        score = expected - f
        scores.append(score)
        details.append(
            {
                "round": rnd.round_number,
                "event": rnd.event_name,
                "constructor_wcc_rank": rank,
                "expected_finish_baseline": expected,
                "actual_finish": f,
                "expected_minus_actual": score,
            }
        )

    return {
        "team_wcc_rank_end_of_season": wcc_rank,
        "mean_expected_minus_actual": float(np.mean(scores)) if scores else None,
        "rounds": details,
        "interpretation": "Positive => finishing better than a coarse baseline from constructor "
        "championship standing.",
    }


def compute_all_metrics(
    season: SeasonLoad,
    *,
    max_laps_per_round_telemetry: int = 14,
) -> dict[str, Any]:
    """Full metric bundle as JSON-serializable dict."""
    notes: list[str] = []
    if not season.rounds:
        notes.append("No rounds loaded; check driver code, year, and connectivity/cache.")

    braking, throttle = compute_braking_and_throttle(
        season, max_laps_per_round=max_laps_per_round_telemetry
    )

    out = {
        "driver": season.driver,
        "year": season.year,
        "rounds_analyzed": len(season.rounds),
        "braking_profile": braking,
        "throttle_aggression": throttle,
        "tyre_degradation": compute_tyre_degradation(season),
        "quali_vs_race": compute_quali_vs_race(season),
        "consistency": compute_consistency(season),
        "circuit_performance_index": compute_circuit_performance(season),
        "meta": {"notes": notes},
    }
    return out


def metrics_to_json_dict(metrics: dict[str, Any]) -> dict[str, Any]:
    """Replace non-finite floats with None for strict JSON encoders."""
    import copy

    def _fix(o: Any) -> Any:
        if isinstance(o, dict):
            return {k: _fix(v) for k, v in o.items()}
        if isinstance(o, list):
            return [_fix(v) for v in o]
        if isinstance(o, float) and (math.isnan(o) or math.isinf(o)):
            return None
        if isinstance(o, (np.floating,)):
            x = float(o)
            return None if math.isnan(x) or math.isinf(x) else x
        if isinstance(o, (np.integer,)):
            return int(o)
        return o

    return _fix(copy.deepcopy(metrics))
