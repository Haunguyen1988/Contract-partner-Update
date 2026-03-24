from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel


ContractStatus = Literal["draft", "pending", "active", "expired"]


class ContractOwnerOption(BaseModel):
    id: str
    label: str


class ContractListItem(BaseModel):
    id: str
    contract_number: str
    partner: str
    owner_id: str | None = None
    owner: str
    value_vnd: float
    expiry_date: date | None = None
    expires_in_days: int | None = None
    status: ContractStatus
    status_label: str


class ContractsListResponse(BaseModel):
    connected: bool
    fetched_at: datetime
    message: str | None = None
    page: int
    limit: int
    total: int
    total_pages: int
    owners: list[ContractOwnerOption]
    items: list[ContractListItem]


class ContractMutationPayload(BaseModel):
    contract_number: str | None = None
    partner_id: str | None = None
    owner_id: str | None = None
    title: str | None = None
    value_vnd: float | None = None
    start_date: date | None = None
    expiry_date: date | None = None
    budget_period: str | None = None
    notes: str | None = None
    file_path: str | None = None
    file_url: str | None = None
    status: Literal["draft", "pending"] | None = None


class ContractMutationResponse(BaseModel):
    success: bool
    connected: bool
    message: str
    contract_id: str
    status: Literal["draft", "pending"]
