from fastapi import APIRouter, Query

from app.schemas.contracts import (
    ContractMutationPayload,
    ContractMutationResponse,
    ContractsListResponse,
)
from app.schemas.resource import ResourceListResponse
from app.services.contract_mutation_service import create_contract
from app.services.contracts_service import get_contracts
from app.services.repository import get_table_snapshot

router = APIRouter(prefix="/contracts", tags=["Contracts"])
public_router = APIRouter(prefix="/contracts", tags=["Contracts"])


@router.get("", response_model=ResourceListResponse)
def list_contracts(limit: int | None = Query(default=None, ge=1, le=100)):
    return get_table_snapshot("contracts", limit=limit)


@public_router.get("", response_model=ContractsListResponse)
def list_contracts_public(
    status: str | None = Query(default=None),
    owner_id: str | None = Query(default=None),
    search: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
):
    return get_contracts(
        status=status,
        owner_id=owner_id,
        search=search,
        page=page,
        limit=limit,
    )


@public_router.post("", response_model=ContractMutationResponse)
def create_contract_public(payload: ContractMutationPayload):
    return create_contract(payload, submit=False)


@public_router.post("/submit", response_model=ContractMutationResponse)
def submit_contract_public(payload: ContractMutationPayload):
    return create_contract(payload, submit=True)
