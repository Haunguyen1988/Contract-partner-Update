from fastapi import APIRouter, Query

from app.schemas.resource import ResourceListResponse
from app.services.repository import get_table_snapshot

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("", response_model=ResourceListResponse)
def list_payments(limit: int | None = Query(default=None, ge=1, le=100)):
    return get_table_snapshot("payments", limit=limit)
