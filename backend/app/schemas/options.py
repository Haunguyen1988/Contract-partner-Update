from datetime import datetime

from pydantic import BaseModel


class SelectOptionItem(BaseModel):
    id: str
    label: str


class SelectOptionResponse(BaseModel):
    connected: bool
    fetched_at: datetime
    message: str | None = None
    items: list[SelectOptionItem]
