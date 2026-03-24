from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import HTTPException

from app.core.config import get_settings
from app.core.supabase import get_supabase_client
from app.schemas.contracts import ContractListItem
from app.schemas.partners import (
    PartnerDetail,
    PartnerDetailResponse,
    PartnerHistoryItem,
    PartnerListItem,
    PartnerMutationPayload,
    PartnerMutationResponse,
    PartnersListResponse,
)
from app.services.contracts_service import demo_contracts_response, to_contract_summary
from app.services.dashboard_service import (
    DISPLAY_NAME_FIELDS,
    build_lookup,
    fetch_rows,
    first_value,
    normalize_contracts,
    normalize_text,
    parse_date,
    utc_now,
)

PARTNER_NAME_FIELDS = ["partner_name", "name", "title", "display_name", "company_name"]
PARTNER_TYPE_FIELDS = ["partner_type", "type", "category", "partner_category"]
PARTNER_TAX_FIELDS = ["tax_code", "mst", "tax_id", "company_tax_code"]
PARTNER_STATUS_FIELDS = ["status", "partner_status", "state", "active_status"]
PRIMARY_OWNER_ID_FIELDS = ["owner_id", "primary_owner_id", "ownerId", "profile_id"]
BACKUP_OWNER_ID_FIELDS = ["backup_owner_id", "secondary_owner_id", "backupOwnerId"]
CONTACT_NAME_FIELDS = ["contact_name", "contact_person", "pic_name", "contact_full_name"]
CONTACT_EMAIL_FIELDS = ["contact_email", "email", "contact_mail"]
CONTACT_PHONE_FIELDS = ["contact_phone", "phone", "contact_number", "mobile"]
NOTES_FIELDS = ["notes", "note", "description", "remarks"]
CREATED_AT_FIELDS = ["created_at", "inserted_at"]
UPDATED_AT_FIELDS = ["updated_at", "modified_at"]

PARTNER_FIELD_CANDIDATES = {
    "name": ["partner_name", "name", "title", "display_name", "company_name"],
    "partner_type": ["partner_type", "type", "category", "partner_category"],
    "tax_code": ["tax_code", "mst", "tax_id", "company_tax_code"],
    "primary_owner_id": ["owner_id", "primary_owner_id", "ownerId", "profile_id"],
    "backup_owner_id": ["backup_owner_id", "secondary_owner_id", "backupOwnerId"],
    "contact_name": ["contact_name", "contact_person", "pic_name", "contact_full_name"],
    "contact_email": ["contact_email", "email", "contact_mail"],
    "contact_phone": ["contact_phone", "phone", "contact_number", "mobile"],
    "notes": ["notes", "note", "description", "remarks"],
    "status": ["status", "partner_status", "state", "active_status"],
}


@dataclass
class PartnerSummary:
    id: str
    name: str
    partner_type: str
    tax_code: str | None
    primary_owner_id: str | None
    primary_owner: str
    backup_owner_id: str | None
    backup_owner: str | None
    contact_name: str | None
    contact_email: str | None
    contact_phone: str | None
    notes: str | None
    status: str
    status_label: str
    active_contracts: int
    history: list[PartnerHistoryItem]


def normalize_partner_status(value: Any) -> tuple[str, str]:
    normalized = normalize_text(value or "active")
    if normalized in {"inactive", "disabled", "archived"}:
        return "inactive", "Inactive"
    return "active", "Active"


def to_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc)
    if isinstance(value, str):
        text = value.strip().replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(text).astimezone(timezone.utc)
        except ValueError:
            return None
    return None


def build_partner_history(raw_partner: dict[str, Any], actor_name: str) -> list[PartnerHistoryItem]:
    history: list[PartnerHistoryItem] = []
    created_at = to_datetime(first_value(raw_partner, CREATED_AT_FIELDS))
    updated_at = to_datetime(first_value(raw_partner, UPDATED_AT_FIELDS))

    if created_at:
        history.append(
            PartnerHistoryItem(
                id=f"created-{raw_partner.get('id', 'partner')}",
                action="created",
                actor=actor_name or "System",
                changed_at=created_at,
                description="Tao moi doi tac trong he thong.",
            )
        )

    if updated_at and (not created_at or updated_at != created_at):
        history.append(
            PartnerHistoryItem(
                id=f"updated-{raw_partner.get('id', 'partner')}",
                action="updated",
                actor=actor_name or "System",
                changed_at=updated_at,
                description="Cap nhat thong tin doi tac.",
            )
        )

    if not history:
        history.append(
            PartnerHistoryItem(
                id=f"snapshot-{raw_partner.get('id', 'partner')}",
                action="snapshot",
                actor=actor_name or "System",
                changed_at=utc_now(),
                description="Dong bo thong tin doi tac vao dashboard noi bo.",
            )
        )

    history.sort(key=lambda item: item.changed_at, reverse=True)
    return history


def demo_partners() -> list[PartnerSummary]:
    contracts = demo_contracts_response(page=1, limit=20, status=None, owner_id=None, search=None).items
    contract_groups: dict[str, list[ContractListItem]] = defaultdict(list)
    for contract in contracts:
        contract_groups[contract.partner].append(contract)

    base = [
        {
            "id": "partner-vne",
            "name": "VnExpress",
            "partner_type": "Bao dien tu",
            "tax_code": "0312345678",
            "primary_owner_id": "owner-linh",
            "primary_owner": "Linh Tran",
            "backup_owner_id": "owner-hoang",
            "backup_owner": "Hoang Nguyen",
            "contact_name": "Le Anh",
            "contact_email": "le.anh@vnexpress.vn",
            "contact_phone": "0901234567",
            "notes": "Doi tac uu tien cho cac chien dich premium.",
            "status": "active",
            "status_label": "Active",
        },
        {
            "id": "partner-tt",
            "name": "Tuoi Tre",
            "partner_type": "Bao in + online",
            "tax_code": "0308765432",
            "primary_owner_id": "owner-hoang",
            "primary_owner": "Hoang Nguyen",
            "backup_owner_id": "owner-minh",
            "backup_owner": "Minh Do",
            "contact_name": "Pham Mai",
            "contact_email": "pham.mai@tuoitre.vn",
            "contact_phone": "0912000001",
            "notes": "Can follow-up som khi gia han quy II.",
            "status": "active",
            "status_label": "Active",
        },
        {
            "id": "partner-tn",
            "name": "Thanh Nien",
            "partner_type": "Bao online",
            "tax_code": "0319988776",
            "primary_owner_id": "owner-minh",
            "primary_owner": "Minh Do",
            "backup_owner_id": "owner-linh",
            "backup_owner": "Linh Tran",
            "contact_name": "Tran Khoa",
            "contact_email": "tran.khoa@thanhnien.vn",
            "contact_phone": "0933000002",
            "notes": "On dinh, it thay doi policy.",
            "status": "active",
            "status_label": "Active",
        },
        {
            "id": "partner-cafef",
            "name": "CafeF",
            "partner_type": "Financial media",
            "tax_code": "0101122334",
            "primary_owner_id": "owner-linh",
            "primary_owner": "Linh Tran",
            "backup_owner_id": "owner-minh",
            "backup_owner": "Minh Do",
            "contact_name": "Nguyen Thu",
            "contact_email": "nguyen.thu@cafef.vn",
            "contact_phone": "0944000003",
            "notes": "Dang tam dung hop tac moi.",
            "status": "inactive",
            "status_label": "Inactive",
        },
    ]

    return [
        PartnerSummary(
            id=item["id"],
            name=item["name"],
            partner_type=item["partner_type"],
            tax_code=item["tax_code"],
            primary_owner_id=item["primary_owner_id"],
            primary_owner=item["primary_owner"],
            backup_owner_id=item["backup_owner_id"],
            backup_owner=item["backup_owner"],
            contact_name=item["contact_name"],
            contact_email=item["contact_email"],
            contact_phone=item["contact_phone"],
            notes=item["notes"],
            status=item["status"],
            status_label=item["status_label"],
            active_contracts=len(
                [contract for contract in contract_groups.get(item["name"], []) if contract.status == "active"]
            ),
            history=[
                PartnerHistoryItem(
                    id=f"{item['id']}-1",
                    action="created",
                    actor=item["primary_owner"],
                    changed_at=utc_now(),
                    description="Khoi tao doi tac trong danh sach noi bo.",
                )
            ],
        )
        for item in base
    ]


def normalize_partner_rows(
    raw_partners: list[dict[str, Any]],
    owner_lookup: dict[str, str],
    contract_groups: dict[str, list[ContractListItem]],
) -> list[PartnerSummary]:
    summaries: list[PartnerSummary] = []

    for row in raw_partners:
        partner_id = str(row.get("id") or row.get("uuid") or row.get("partner_id") or uuid4().hex[:8])
        name = str(first_value(row, PARTNER_NAME_FIELDS) or "Chua ro doi tac")
        partner_type = str(first_value(row, PARTNER_TYPE_FIELDS) or "Chua phan loai")
        tax_code = first_value(row, PARTNER_TAX_FIELDS)
        primary_owner_id = first_value(row, PRIMARY_OWNER_ID_FIELDS)
        backup_owner_id = first_value(row, BACKUP_OWNER_ID_FIELDS)
        primary_owner = owner_lookup.get(str(primary_owner_id), "Chua gan owner") if primary_owner_id else "Chua gan owner"
        backup_owner = owner_lookup.get(str(backup_owner_id), "") if backup_owner_id else None
        status, status_label = normalize_partner_status(first_value(row, PARTNER_STATUS_FIELDS))

        summaries.append(
            PartnerSummary(
                id=partner_id,
                name=name,
                partner_type=partner_type,
                tax_code=str(tax_code) if tax_code else None,
                primary_owner_id=str(primary_owner_id) if primary_owner_id else None,
                primary_owner=primary_owner,
                backup_owner_id=str(backup_owner_id) if backup_owner_id else None,
                backup_owner=backup_owner or None,
                contact_name=str(first_value(row, CONTACT_NAME_FIELDS) or "") or None,
                contact_email=str(first_value(row, CONTACT_EMAIL_FIELDS) or "") or None,
                contact_phone=str(first_value(row, CONTACT_PHONE_FIELDS) or "") or None,
                notes=str(first_value(row, NOTES_FIELDS) or "") or None,
                status=status,
                status_label=status_label,
                active_contracts=len(
                    [
                        contract
                        for contract in contract_groups.get(name, [])
                        if contract.status == "active"
                    ]
                ),
                history=build_partner_history(row, primary_owner),
            )
        )

    summaries.sort(key=lambda item: item.name)
    return summaries


def group_contracts_by_partner_name() -> dict[str, list[ContractListItem]]:
    contracts_response = demo_contracts_response(
        page=1, limit=100, status=None, owner_id=None, search=None
    )
    groups: dict[str, list[ContractListItem]] = defaultdict(list)
    for item in contracts_response.items:
        groups[item.partner].append(item)
    return groups


def build_live_contract_groups(
    raw_partners: list[dict[str, Any]], raw_profiles: list[dict[str, Any]], raw_contracts: list[dict[str, Any]]
) -> dict[str, list[ContractListItem]]:
    partner_lookup = build_lookup(raw_partners, PARTNER_NAME_FIELDS)
    owner_lookup = build_lookup(raw_profiles, DISPLAY_NAME_FIELDS)
    normalized_contracts = normalize_contracts(raw_contracts, partner_lookup, owner_lookup)
    summaries = to_contract_summary(normalized_contracts, raw_contracts)
    groups: dict[str, list[ContractListItem]] = defaultdict(list)
    for item in summaries:
        groups[item.partner].append(
            ContractListItem(
                id=item.id,
                contract_number=item.contract_number,
                partner=item.partner,
                owner_id=item.owner_id,
                owner=item.owner,
                value_vnd=item.value_vnd,
                expiry_date=item.expiry_date,
                expires_in_days=item.expires_in_days,
                status=item.status,  # type: ignore[arg-type]
                status_label=item.status_label,
            )
        )
    return groups


def get_partner_summaries() -> tuple[bool, str | None, list[PartnerSummary]]:
    settings = get_settings()
    if not settings.has_supabase:
        return False, "Dang hien thi du lieu mau vi backend chua ket noi Supabase thuc te.", demo_partners()

    try:
        get_supabase_client()
        raw_partners = fetch_rows("partners")
        raw_profiles = fetch_rows("profiles")
        raw_contracts = fetch_rows("contracts")
        owner_lookup = build_lookup(raw_profiles, DISPLAY_NAME_FIELDS)
        contract_groups = build_live_contract_groups(raw_partners, raw_profiles, raw_contracts)
        return True, None, normalize_partner_rows(raw_partners, owner_lookup, contract_groups)
    except Exception as exc:
        return False, str(exc), demo_partners()


def get_partners(search: str | None, status: str | None) -> PartnersListResponse:
    connected, message, items = get_partner_summaries()
    normalized_search = normalize_text(search or "")
    normalized_status = normalize_text(status or "")

    filtered = []
    for item in items:
        if normalized_status and normalized_status not in {"all", ""} and item.status != normalized_status:
            continue
        if normalized_search:
            haystack = normalize_text(f"{item.name} {item.tax_code or ''}")
            if normalized_search not in haystack:
                continue
        filtered.append(item)

    return PartnersListResponse(
        connected=connected,
        fetched_at=utc_now(),
        message=message,
        total=len(filtered),
        items=[
            PartnerListItem(
                id=item.id,
                name=item.name,
                partner_type=item.partner_type,
                tax_code=item.tax_code,
                primary_owner_id=item.primary_owner_id,
                primary_owner=item.primary_owner,
                active_contracts=item.active_contracts,
                status=item.status,  # type: ignore[arg-type]
                status_label=item.status_label,
            )
            for item in filtered
        ],
    )


def get_partner_detail(partner_id: str) -> PartnerDetailResponse:
    connected, message, items = get_partner_summaries()
    match = next((item for item in items if item.id == partner_id), None)

    if not match:
        raise HTTPException(status_code=404, detail="Khong tim thay doi tac.")

    related_contracts = group_contracts_by_partner_name().get(match.name, [])
    if connected:
        _, _, live_items = get_partner_summaries()
        live_match = next((item for item in live_items if item.id == partner_id), None)
        if live_match:
            match = live_match
            related_contracts = build_live_contract_groups(
                fetch_rows("partners"), fetch_rows("profiles"), fetch_rows("contracts")
            ).get(match.name, [])

    return PartnerDetailResponse(
        connected=connected,
        fetched_at=utc_now(),
        message=message,
        item=PartnerDetail(
            id=match.id,
            name=match.name,
            partner_type=match.partner_type,
            tax_code=match.tax_code,
            contact_name=match.contact_name,
            contact_email=match.contact_email,
            contact_phone=match.contact_phone,
            primary_owner_id=match.primary_owner_id,
            primary_owner=match.primary_owner,
            backup_owner_id=match.backup_owner_id,
            backup_owner=match.backup_owner,
            notes=match.notes,
            status=match.status,  # type: ignore[arg-type]
            status_label=match.status_label,
            active_contracts=match.active_contracts,
            contracts=related_contracts,
            history=match.history,
        ),
    )


def resolve_partner_column_name(sample_row: dict | None, field_name: str) -> str:
    candidates = PARTNER_FIELD_CANDIDATES[field_name]
    if sample_row:
        for candidate in candidates:
            if candidate in sample_row:
                return candidate
    return candidates[0]


def validate_partner_payload(payload: PartnerMutationPayload):
    missing = []
    if not (payload.name or "").strip():
        missing.append("Ten doi tac")
    if not (payload.partner_type or "").strip():
        missing.append("Loai")
    if not (payload.primary_owner_id or "").strip():
        missing.append("Owner chinh")

    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Thieu thong tin bat buoc: {', '.join(missing)}.",
        )


def build_partner_insert_payload(payload: PartnerMutationPayload) -> dict:
    sample_rows = fetch_rows("partners", limit=1)
    sample_row = sample_rows[0] if sample_rows else None
    values = {
        "name": payload.name,
        "partner_type": payload.partner_type,
        "tax_code": payload.tax_code,
        "primary_owner_id": payload.primary_owner_id,
        "backup_owner_id": payload.backup_owner_id,
        "contact_name": payload.contact_name,
        "contact_email": payload.contact_email,
        "contact_phone": payload.contact_phone,
        "notes": payload.notes,
        "status": payload.status or "active",
    }
    mapped: dict[str, Any] = {}
    for field_name, value in values.items():
        if value in (None, ""):
            continue
        mapped[resolve_partner_column_name(sample_row, field_name)] = value
    return mapped


def create_partner(payload: PartnerMutationPayload) -> PartnerMutationResponse:
    validate_partner_payload(payload)
    settings = get_settings()
    if not settings.has_supabase:
        return PartnerMutationResponse(
            success=True,
            connected=False,
            message="Da gia lap tao moi doi tac.",
            partner_id=f"demo-{uuid4().hex[:8]}",
        )

    try:
        client = get_supabase_client()
        insert_row = build_partner_insert_payload(payload)
        response = client.table("partners").insert(insert_row).execute()
        inserted = response.data[0] if response.data else {}
        partner_id = str(first_value(inserted, ["id", "uuid", "partner_id"]) or uuid4().hex[:8])
        return PartnerMutationResponse(
            success=True,
            connected=True,
            message="Da tao moi doi tac thanh cong.",
            partner_id=partner_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def update_partner(partner_id: str, payload: PartnerMutationPayload) -> PartnerMutationResponse:
    validate_partner_payload(payload)
    settings = get_settings()
    if not settings.has_supabase:
        return PartnerMutationResponse(
            success=True,
            connected=False,
            message="Da gia lap cap nhat doi tac.",
            partner_id=partner_id,
        )

    try:
        client = get_supabase_client()
        update_row = build_partner_insert_payload(payload)
        response = client.table("partners").update(update_row).eq("id", partner_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Khong tim thay doi tac.")
        return PartnerMutationResponse(
            success=True,
            connected=True,
            message="Da cap nhat doi tac thanh cong.",
            partner_id=partner_id,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
