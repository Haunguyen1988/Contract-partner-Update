from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ResourceListResponse(BaseModel):
    table: str
    connected: bool
    count: int | None = None
    fetched_at: datetime
    message: str | None = None
    items: list[dict[str, Any]]
