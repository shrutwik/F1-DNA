from datetime import timedelta

import pandas as pd

from data.processor import pick_clean_laps_df


def test_pick_clean_laps_df_converts_timedelta_laptime_to_seconds() -> None:
    df = pd.DataFrame(
        {
            "LapNumber": [2, 3],
            "Deleted": [False, False],
            "TrackStatus": ["1", "1"],
            "PitInTime": [pd.NaT, pd.NaT],
            "PitOutTime": [pd.NaT, pd.NaT],
            "IsAccurate": [True, True],
            "LapTime": [timedelta(minutes=1, seconds=32), timedelta(minutes=1, seconds=33)],
        }
    )

    out = pick_clean_laps_df(df)

    assert not out.empty
    assert out["_lt"].dtype.kind == "f"
    assert out["_lt"].min() > 30.0
    assert out["_lt"].max() < 300.0
