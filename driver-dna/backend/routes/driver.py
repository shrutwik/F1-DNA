"""Driver-related API routes."""

from fastapi import APIRouter, Query

from schemas import DriverMetricsResponse, DriversResponse
from services.driver_service import get_driver_metrics, list_drivers

router = APIRouter()


@router.get("/drivers", response_model=DriversResponse)
def get_drivers(
    year: int = Query(..., description="Season year"),
    force_refresh: bool = Query(False, description="Bypass memory cache"),
) -> DriversResponse:
    drivers, cached = list_drivers(year=year, force_refresh=force_refresh)
    return DriversResponse(year=year, drivers=drivers, cached=cached)


@router.get("/driver/{code}", response_model=DriverMetricsResponse)
def get_driver(
    code: str,
    year: int = Query(..., description="Season year"),
    force_refresh: bool = Query(False, description="Bypass memory cache"),
) -> DriverMetricsResponse:
    payload, cached = get_driver_metrics(code=code, year=year, force_refresh=force_refresh)
    payload = {**payload, "cached": cached}
    return DriverMetricsResponse(**payload)
