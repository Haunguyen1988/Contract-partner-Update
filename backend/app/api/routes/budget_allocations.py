from fastapi import APIRouter, Query

from app.schemas.resource import ResourceListResponse
from app.services.repository import get_table_snapshot

router = APIRouter(prefix="/budget_allocations", tags=["Budget Allocations"])


@router.get("", response_model=ResourceListResponse)
def list_budget_allocations(limit: int | None = Query(default=None, ge=1, le=100)):
    return get_table_snapshot("budget_allocations", limit=limit)
