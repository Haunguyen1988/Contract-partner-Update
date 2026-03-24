from fastapi import APIRouter, Query

from app.schemas.options import SelectOptionResponse
from app.schemas.partners import (
    PartnerDetailResponse,
    PartnerMutationPayload,
    PartnerMutationResponse,
    PartnersListResponse,
)
from app.schemas.resource import ResourceListResponse
from app.services.options_service import get_partner_options
from app.services.partners_service import (
    create_partner,
    get_partner_detail,
    get_partners,
    update_partner,
)
from app.services.repository import get_table_snapshot

router = APIRouter(prefix="/partners", tags=["Partners"])
public_router = APIRouter(prefix="/partners", tags=["Partners"])


@router.get("", response_model=ResourceListResponse)
def list_partners(limit: int | None = Query(default=None, ge=1, le=100)):
    return get_table_snapshot("partners", limit=limit)


@public_router.get("", response_model=PartnersListResponse)
def list_partners_public(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
):
    return get_partners(search=search, status=status)


@public_router.get("/options", response_model=SelectOptionResponse)
def list_partner_options_public():
    return get_partner_options()


@public_router.get("/{partner_id}", response_model=PartnerDetailResponse)
def get_partner_detail_public(partner_id: str):
    return get_partner_detail(partner_id)


@public_router.post("", response_model=PartnerMutationResponse)
def create_partner_public(payload: PartnerMutationPayload):
    return create_partner(payload)


@public_router.patch("/{partner_id}", response_model=PartnerMutationResponse)
def update_partner_public(partner_id: str, payload: PartnerMutationPayload):
    return update_partner(partner_id, payload)
