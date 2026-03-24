from __future__ import annotations

from typing import Any

from app.core.config import get_settings
from app.schemas.options import SelectOptionItem, SelectOptionResponse
from app.services.dashboard_service import fetch_rows, first_value, normalize_text, utc_now

PARTNER_LABEL_FIELDS = ["partner_name", "name", "title", "display_name"]
PROFILE_LABEL_FIELDS = ["full_name", "display_name", "name", "email", "username"]
PROFILE_ROLE_FIELDS = ["role", "user_role", "access_role", "position"]


def build_options(rows: list[dict[str, Any]], label_fields: list[str]) -> list[SelectOptionItem]:
    items: list[SelectOptionItem] = []

    for row in rows:
        row_id = row.get("id")
        label = first_value(row, label_fields)

        if row_id is None or not label:
            continue

        items.append(SelectOptionItem(id=str(row_id), label=str(label)))

    items.sort(key=lambda item: item.label)
    return items


def demo_partners_response() -> SelectOptionResponse:
    return SelectOptionResponse(
        connected=False,
        fetched_at=utc_now(),
        message="Đang hiển thị danh sách đối tác mẫu vì backend chưa kết nối Supabase thực tế.",
        items=[
            SelectOptionItem(id="partner-vne", label="VnExpress"),
            SelectOptionItem(id="partner-tt", label="Tuoi Tre"),
            SelectOptionItem(id="partner-tn", label="Thanh Nien"),
            SelectOptionItem(id="partner-zn", label="Zing News"),
        ],
    )


def demo_staff_response() -> SelectOptionResponse:
    return SelectOptionResponse(
        connected=False,
        fetched_at=utc_now(),
        message="Đang hiển thị danh sách staff mẫu vì backend chưa kết nối Supabase thực tế.",
        items=[
            SelectOptionItem(id="owner-linh", label="Linh Tran"),
            SelectOptionItem(id="owner-hoang", label="Hoang Nguyen"),
            SelectOptionItem(id="owner-minh", label="Minh Do"),
        ],
    )


def get_partner_options() -> SelectOptionResponse:
    settings = get_settings()
    if not settings.has_supabase:
        return demo_partners_response()

    try:
        rows = fetch_rows("partners")
        return SelectOptionResponse(
            connected=True,
            fetched_at=utc_now(),
            items=build_options(rows, PARTNER_LABEL_FIELDS),
        )
    except Exception as exc:
        response = demo_partners_response()
        response.message = str(exc)
        return response


def get_staff_options(role: str | None = None) -> SelectOptionResponse:
    normalized_role = normalize_text(role or "staff")
    settings = get_settings()
    if not settings.has_supabase:
        return demo_staff_response()

    try:
        rows = fetch_rows("profiles")
        filtered_rows = [
            row
            for row in rows
            if not normalized_role
            or normalize_text(first_value(row, PROFILE_ROLE_FIELDS) or "") == normalized_role
        ]

        return SelectOptionResponse(
            connected=True,
            fetched_at=utc_now(),
            items=build_options(filtered_rows, PROFILE_LABEL_FIELDS),
        )
    except Exception as exc:
        response = demo_staff_response()
        response.message = str(exc)
        return response
