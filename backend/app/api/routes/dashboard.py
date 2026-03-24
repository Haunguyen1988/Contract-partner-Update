from fastapi import APIRouter

from app.schemas.dashboard import (
    DashboardAlertsResponse,
    DashboardOwnerMatrixResponse,
    DashboardStatsResponse,
    DashboardSummary,
)
from app.services.dashboard_service import (
    get_dashboard_alerts,
    get_dashboard_owner_matrix,
    get_dashboard_stats,
)
from app.services.repository import get_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
public_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary():
    return get_dashboard_summary()


@router.get("/stats", response_model=DashboardStatsResponse)
def dashboard_stats():
    return get_dashboard_stats()


@router.get("/alerts", response_model=DashboardAlertsResponse)
def dashboard_alerts():
    return get_dashboard_alerts()


@router.get("/owner-matrix", response_model=DashboardOwnerMatrixResponse)
def dashboard_owner_matrix():
    return get_dashboard_owner_matrix()


@public_router.get("/stats", response_model=DashboardStatsResponse)
def dashboard_stats_public():
    return get_dashboard_stats()


@public_router.get("/alerts", response_model=DashboardAlertsResponse)
def dashboard_alerts_public():
    return get_dashboard_alerts()


@public_router.get("/owner-matrix", response_model=DashboardOwnerMatrixResponse)
def dashboard_owner_matrix_public():
    return get_dashboard_owner_matrix()
