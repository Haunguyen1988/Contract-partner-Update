from fastapi import APIRouter, Query

from app.schemas.options import SelectOptionResponse
from app.schemas.resource import ResourceListResponse
from app.services.options_service import get_staff_options
from app.services.repository import get_table_snapshot

router = APIRouter(prefix="/profiles", tags=["Profiles"])
public_router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get("", response_model=ResourceListResponse)
def list_profiles(limit: int | None = Query(default=None, ge=1, le=100)):
    return get_table_snapshot("profiles", limit=limit)


@public_router.get("", response_model=SelectOptionResponse)
def list_profiles_public(role: str | None = Query(default=None)):
    return get_staff_options(role=role)
