from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel


class TableSummary(BaseModel):
    name: str
    label: str
    count: int | None = None


class DashboardSummary(BaseModel):
    app_name: str
    connected: bool
    frontend_origin: str
    fetched_at: datetime
    message: str | None = None
    tables: list[TableSummary]


class DashboardStats(BaseModel):
    active_contracts: int
    expiring_in_30_days: int
    pending_approval: int
    budget_used_percent: float


class DashboardStatsResponse(BaseModel):
    connected: bool
    fetched_at: datetime
    message: str | None = None
    stats: DashboardStats


class DashboardAlertItem(BaseModel):
    contract_number: str
    partner: str
    owner: str
    expiry_date: date | None = None
    status: str
    urgency: Literal["red", "yellow", "orange", "neutral"] = "neutral"
    days_remaining: int | None = None


class DashboardAlertsResponse(BaseModel):
    connected: bool
    fetched_at: datetime
    message: str | None = None
    items: list[DashboardAlertItem]


class OwnerMatrixItem(BaseModel):
    owner: str
    partner: str
    active_contracts: int
    nearest_expiry: date | None = None
    budget_used_percent: float


class DashboardOwnerMatrixResponse(BaseModel):
    connected: bool
    fetched_at: datetime
    message: str | None = None
    items: list[OwnerMatrixItem]
