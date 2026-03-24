from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.contracts import ContractListItem


PartnerStatus = Literal["active", "inactive"]


class PartnerListItem(BaseModel):
    id: str
    name: str
    partner_type: str
    tax_code: str | None = None
    primary_owner_id: str | None = None
    primary_owner: str
    active_contracts: int
    status: PartnerStatus
    status_label: str


class PartnersListResponse(BaseModel):
    connected: bool
    fetched_at: datetime
    message: str | None = None
    total: int
    items: list[PartnerListItem]


class PartnerHistoryItem(BaseModel):
    id: str
    action: str
    actor: str
    changed_at: datetime
    description: str


class PartnerDetail(BaseModel):
    id: str
    name: str
    partner_type: str
    tax_code: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    primary_owner_id: str | None = None
    primary_owner: str
    backup_owner_id: str | None = None
    backup_owner: str | None = None
    notes: str | None = None
    status: PartnerStatus
    status_label: str
    active_contracts: int
    contracts: list[ContractListItem]
    history: list[PartnerHistoryItem]


class PartnerDetailResponse(BaseModel):
    connected: bool
    fetched_at: datetime
    message: str | None = None
    item: PartnerDetail


class PartnerMutationPayload(BaseModel):
    name: str | None = None
    partner_type: str | None = None
    tax_code: str | None = None
    primary_owner_id: str | None = None
    backup_owner_id: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    notes: str | None = None
    status: PartnerStatus | None = None


class PartnerMutationResponse(BaseModel):
    success: bool
    connected: bool
    message: str
    partner_id: str
