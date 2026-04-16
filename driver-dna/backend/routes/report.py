"""Scouting report API routes."""

from fastapi import APIRouter

from schemas import ReportRequest, ReportResponse
from services.report_service import build_placeholder_report

router = APIRouter()


@router.post("/report", response_model=ReportResponse)
def generate_report(payload: ReportRequest) -> ReportResponse:
    return ReportResponse(
        report=build_placeholder_report(payload.metrics),
        model="placeholder-phase2",
    )
