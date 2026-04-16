"""Pydantic schemas for API requests/responses."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ErrorResponse(BaseModel):
    detail: str
    code: str


class DriverItem(BaseModel):
    code: str = Field(..., description="Three-letter driver abbreviation")
    name: str | None = None
    team: str | None = None


class DriversResponse(BaseModel):
    year: int
    cached: bool
    drivers: list[DriverItem]


class DriverMetricsResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    driver: str
    year: int
    rounds_analyzed: int
    cached: bool


class ReportRequest(BaseModel):
    metrics: dict[str, Any]


class ReportResponse(BaseModel):
    report: str
    model: str
