from __future__ import annotations

from uuid import uuid4

from fastapi import HTTPException

from app.core.config import get_settings
from app.core.supabase import get_supabase_client
from app.schemas.contracts import ContractMutationPayload, ContractMutationResponse
from app.services.dashboard_service import fetch_rows, first_value, utc_now

CONTRACT_FIELD_CANDIDATES = {
    "contract_number": ["contract_number", "contract_no", "number", "code"],
    "title": ["title", "name", "contract_title"],
    "partner_id": ["partner_id", "partnerId"],
    "owner_id": ["owner_id", "ownerId", "profile_id", "user_id", "assigned_to"],
    "value_vnd": ["contract_value", "value", "amount", "total_value", "price"],
    "start_date": ["start_date", "effective_from", "valid_from"],
    "expiry_date": ["end_date", "expiry_date", "expires_at", "valid_to"],
    "budget_period": ["budget_period", "budget_cycle", "fiscal_period"],
    "notes": ["notes", "note", "description", "remarks"],
    "status": ["status", "contract_status", "state"],
    "file_path": ["file_path", "document_path", "attachment_path"],
    "file_url": ["file_url", "document_url", "attachment_url"],
}

REQUIRED_SUBMIT_FIELDS = {
    "contract_number": "Số HĐ",
    "partner_id": "Đối tác",
    "owner_id": "Owner phụ trách",
    "title": "Tiêu đề HĐ",
    "value_vnd": "Giá trị HĐ",
    "start_date": "Ngày bắt đầu",
    "expiry_date": "Ngày hết hạn",
}


def normalize_payload_value(value):
    if value in ("", None):
        return None
    return value


def validate_submit_payload(payload: ContractMutationPayload):
    missing_fields = [
        label
        for field, label in REQUIRED_SUBMIT_FIELDS.items()
        if normalize_payload_value(getattr(payload, field)) is None
    ]

    if missing_fields:
        raise HTTPException(
            status_code=422,
            detail=f"Thiếu thông tin bắt buộc: {', '.join(missing_fields)}.",
        )

    if payload.value_vnd is not None and payload.value_vnd <= 0:
        raise HTTPException(
            status_code=422, detail="Giá trị HĐ phải lớn hơn 0."
        )

    if payload.start_date and payload.expiry_date and payload.start_date > payload.expiry_date:
        raise HTTPException(
            status_code=422,
            detail="Ngày hết hạn phải lớn hơn hoặc bằng ngày bắt đầu.",
        )


def resolve_column_name(sample_row: dict | None, field_name: str) -> str:
    candidates = CONTRACT_FIELD_CANDIDATES[field_name]
    if sample_row:
        for candidate in candidates:
            if candidate in sample_row:
                return candidate
    return candidates[0]


def build_insert_payload(payload: ContractMutationPayload, status: str) -> dict:
    sample_rows = fetch_rows("contracts", limit=1)
    sample_row = sample_rows[0] if sample_rows else None

    values = {
        "contract_number": payload.contract_number,
        "title": payload.title,
        "partner_id": payload.partner_id,
        "owner_id": payload.owner_id,
        "value_vnd": payload.value_vnd,
        "start_date": payload.start_date.isoformat() if payload.start_date else None,
        "expiry_date": payload.expiry_date.isoformat() if payload.expiry_date else None,
        "budget_period": payload.budget_period,
        "notes": payload.notes,
        "status": status,
        "file_path": payload.file_path,
        "file_url": payload.file_url,
    }

    insert_row: dict = {}
    for field_name, value in values.items():
        if value is None:
            continue
        insert_row[resolve_column_name(sample_row, field_name)] = value

    return insert_row


def create_contract(
    payload: ContractMutationPayload,
    *,
    submit: bool,
) -> ContractMutationResponse:
    status = "pending" if submit else (payload.status or "draft")

    if submit:
        validate_submit_payload(payload)

    settings = get_settings()
    if not settings.has_supabase:
        return ContractMutationResponse(
            success=True,
            connected=False,
            message=(
                "Đã giả lập lưu hợp đồng vì backend chưa kết nối Supabase thực tế."
                if not submit
                else "Đã giả lập gửi duyệt hợp đồng vì backend chưa kết nối Supabase thực tế."
            ),
            contract_id=f"demo-{uuid4().hex[:8]}",
            status="pending" if submit else "draft",
        )

    try:
        client = get_supabase_client()
        insert_row = build_insert_payload(payload, status)
        response = client.table("contracts").insert(insert_row).execute()
        inserted_row = response.data[0] if response.data else {}
        contract_id = str(
            first_value(inserted_row, ["id", "uuid", "contract_id"]) or uuid4().hex[:8]
        )

        return ContractMutationResponse(
            success=True,
            connected=True,
            message="Đã lưu draft thành công." if not submit else "Đã gửi hợp đồng để duyệt.",
            contract_id=contract_id,
            status="pending" if submit else "draft",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
