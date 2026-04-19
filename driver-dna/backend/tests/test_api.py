from fastapi.testclient import TestClient

from data.loader import MAX_SEASON, MIN_SEASON
from main import app
from routes import driver as driver_routes
from schemas import DriverItem
from services.cache import cache
from services import driver_service

client = TestClient(app)


def setup_function() -> None:
    cache.clear()


def test_get_drivers_uses_cache(monkeypatch) -> None:
    calls = {"count": 0}

    def fake_collect(year: int):
        calls["count"] += 1
        return [DriverItem(code="NOR", name="L NORRIS", team="McLaren")]

    monkeypatch.setattr(driver_service, "_collect_drivers_for_year", fake_collect)

    r1 = client.get("/api/drivers", params={"year": 2024})
    assert r1.status_code == 200
    assert r1.json()["cached"] is False
    assert calls["count"] == 1

    r2 = client.get("/api/drivers", params={"year": 2024})
    assert r2.status_code == 200
    assert r2.json()["cached"] is True
    assert calls["count"] == 1


def test_get_drivers_force_refresh_bypasses_cache(monkeypatch) -> None:
    calls = {"count": 0}

    def fake_collect(year: int):
        calls["count"] += 1
        return [DriverItem(code="NOR", name="L NORRIS", team="McLaren")]

    monkeypatch.setattr(driver_service, "_collect_drivers_for_year", fake_collect)

    client.get("/api/drivers", params={"year": 2024})
    client.get("/api/drivers", params={"year": 2024, "force_refresh": "true"})
    assert calls["count"] == 2


def test_get_driver_metrics_uses_cache(monkeypatch) -> None:
    calls = {"count": 0}

    def fake_metrics(
        code: str,
        year: int,
        max_rounds: int = 8,
        max_telemetry_laps: int = 6,
    ):
        calls["count"] += 1
        return {
            "driver": code,
            "year": year,
            "rounds_analyzed": 5,
            "consistency": {"laptime_std_seconds": 0.21},
        }

    monkeypatch.setattr(driver_service, "_compute_driver_metrics", fake_metrics)

    r1 = client.get("/api/driver/NOR", params={"year": 2024})
    assert r1.status_code == 200
    assert r1.json()["cached"] is False
    assert calls["count"] == 1

    r2 = client.get("/api/driver/NOR", params={"year": 2024})
    assert r2.status_code == 200
    assert r2.json()["cached"] is True
    assert calls["count"] == 1


def test_get_driver_metrics_accepts_performance_overrides(monkeypatch) -> None:
    captured: dict[str, object] = {}

    def fake_metrics(
        code: str,
        year: int,
        force_refresh: bool = False,
        max_rounds: int | None = None,
        max_telemetry_laps: int | None = None,
    ):
        captured["code"] = code
        captured["year"] = year
        captured["force_refresh"] = force_refresh
        captured["max_rounds"] = max_rounds
        captured["max_telemetry_laps"] = max_telemetry_laps
        return {
            "driver": code,
            "year": year,
            "rounds_analyzed": 4,
            "consistency": {"laptime_std_seconds": 0.21},
        }, False

    monkeypatch.setattr(driver_routes, "get_driver_metrics", fake_metrics)

    r = client.get(
        "/api/driver/NOR",
        params={
            "year": 2024,
            "max_rounds": 4,
            "max_telemetry_laps": 3,
            "force_refresh": "true",
        },
    )
    assert r.status_code == 200
    assert captured == {
        "code": "NOR",
        "year": 2024,
        "force_refresh": True,
        "max_rounds": 4,
        "max_telemetry_laps": 3,
    }


def test_invalid_year_returns_400() -> None:
    r = client.get("/api/drivers", params={"year": MIN_SEASON - 1})
    assert r.status_code == 400
    body = r.json()
    assert body["code"] == "invalid_year"


def test_invalid_driver_code_returns_400() -> None:
    r = client.get("/api/driver/N", params={"year": MAX_SEASON})
    assert r.status_code == 400
    body = r.json()
    assert body["code"] == "invalid_driver_code"


def test_report_endpoint_returns_text() -> None:
    payload = {
        "metrics": {
            "driver": "NOR",
            "year": 2024,
            "consistency": {"laptime_std_seconds": 0.22},
        }
    }
    r = client.post("/api/report", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert isinstance(body["report"], str)
    assert body["report"]
