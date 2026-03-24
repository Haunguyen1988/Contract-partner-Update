from __future__ import annotations

from dataclasses import dataclass
from math import ceil
from typing import Any

from app.schemas.contracts import (
    ContractListItem,
    ContractOwnerOption,
    ContractsListResponse,
)
from app.services.dashboard_service import (
    ACTIVE_STATUSES,
    DISPLAY_NAME_FIELDS,
    OWNER_ID_FIELDS,
    OWNER_NAME_FIELDS,
    PARTNER_ID_FIELDS,
    PARTNER_NAME_FIELDS,
    STATUS_FIELDS,
    build_lookup,
    fetch_rows,
    first_value,
    get_settings,
    get_supabase_client,
    normalize_contracts,
    normalize_text,
    parse_date,
    to_float,
    utc_now,
)

VALUE_FIELDS = [
    "contract_value",
    "value",
    "amount",
    "total_value",
    "gross_value",
    "net_value",
    "price",
    "budget_amount",
]


@dataclass
class ContractSummary:
    id: str
    contract_number: str
    partner: str
    owner_id: str | None
    owner: str
    value_vnd: float
    expiry_date: Any
    expires_in_days: int | None
    status: str
    status_label: str


def clamp_page(page: int) -> int:
    return max(1, page)


def clamp_limit(limit: int) -> int:
    settings = get_settings()
    return max(1, min(limit, settings.MAX_PAGE_SIZE))


def map_contract_status(status_key: str, days_remaining: int | None) -> tuple[str, str]:
    if days_remaining is not None and days_remaining < 0:
        return "expired", "Hết hạn"

    if status_key == "draft":
        return "draft", "Draft"

    if status_key in {"pending", "pending_approval", "waiting_approval", "review", "submitted"}:
        return "pending", "Chờ duyệt"

    if status_key in ACTIVE_STATUSES or not status_key:
        return "active", "Active"

    return "active", "Active"


def to_contract_summary(
    normalized_contracts: list[Any],
    raw_contracts: list[dict[str, Any]],
) -> list[ContractSummary]:
    raw_by_id = {
        str(row.get("id") or row.get("uuid") or row.get("contract_id") or ""): row
        for row in raw_contracts
    }
    summaries: list[ContractSummary] = []

    for contract in normalized_contracts:
        raw = raw_by_id.get(contract.contract_id, {})
        value_vnd = to_float(first_value(raw, VALUE_FIELDS)) or 0.0
        status, status_label = map_contract_status(contract.status_key, contract.days_remaining)

        summaries.append(
            ContractSummary(
                id=contract.contract_id or contract.contract_number,
                contract_number=contract.contract_number,
                partner=contract.partner_name,
                owner_id=contract.owner_id,
                owner=contract.owner_name,
                value_vnd=value_vnd,
                expiry_date=contract.expiry_date,
                expires_in_days=contract.days_remaining,
                status=status,
                status_label=status_label,
            )
        )

    summaries.sort(
        key=lambda item: (
            item.expiry_date is None,
            item.expiry_date or parse_date("2999-12-31"),
            item.contract_number,
        )
    )
    return summaries


def demo_contracts_response(
    page: int,
    limit: int,
    status: str | None,
    owner_id: str | None,
    search: str | None,
) -> ContractsListResponse:
    items = [
        ContractListItem(
            id="ct-001",
            contract_number="HD-PR-001",
            partner="VnExpress",
            owner_id="owner-linh",
            owner="Linh Tran",
            value_vnd=180000000,
            expiry_date=parse_date("2026-04-03"),
            expires_in_days=10,
            status="active",
            status_label="Active",
        ),
        ContractListItem(
            id="ct-002",
            contract_number="HD-PR-002",
            partner="Tuoi Tre",
            owner_id="owner-hoang",
            owner="Hoang Nguyen",
            value_vnd=95000000,
            expiry_date=parse_date("2026-03-28"),
            expires_in_days=4,
            status="active",
            status_label="Active",
        ),
        ContractListItem(
            id="ct-003",
            contract_number="HD-PR-003",
            partner="Thanh Nien",
            owner_id="owner-minh",
            owner="Minh Do",
            value_vnd=120000000,
            expiry_date=parse_date("2026-05-20"),
            expires_in_days=57,
            status="pending",
            status_label="Chờ duyệt",
        ),
        ContractListItem(
            id="ct-004",
            contract_number="HD-PR-004",
            partner="CafeF",
            owner_id="owner-linh",
            owner="Linh Tran",
            value_vnd=75000000,
            expiry_date=parse_date("2026-03-20"),
            expires_in_days=-4,
            status="expired",
            status_label="Hết hạn",
        ),
        ContractListItem(
            id="ct-005",
            contract_number="HD-PR-005",
            partner="Dan Tri",
            owner_id="owner-hoang",
            owner="Hoang Nguyen",
            value_vnd=65000000,
            expiry_date=parse_date("2026-06-15"),
            expires_in_days=83,
            status="draft",
            status_label="Draft",
        ),
        ContractListItem(
            id="ct-006",
            contract_number="HD-PR-006",
            partner="Zing News",
            owner_id="owner-minh",
            owner="Minh Do",
            value_vnd=145000000,
            expiry_date=parse_date("2026-04-18"),
            expires_in_days=25,
            status="active",
            status_label="Active",
        ),
        ContractListItem(
            id="ct-007",
            contract_number="HD-PR-007",
            partner="Kenh14",
            owner_id="owner-linh",
            owner="Linh Tran",
            value_vnd=110000000,
            expiry_date=parse_date("2026-04-11"),
            expires_in_days=18,
            status="active",
            status_label="Active",
        ),
        ContractListItem(
            id="ct-008",
            contract_number="HD-PR-008",
            partner="Soha",
            owner_id="owner-hoang",
            owner="Hoang Nguyen",
            value_vnd=88000000,
            expiry_date=parse_date("2026-07-03"),
            expires_in_days=101,
            status="pending",
            status_label="Chờ duyệt",
        ),
        ContractListItem(
            id="ct-009",
            contract_number="HD-PR-009",
            partner="24h",
            owner_id="owner-minh",
            owner="Minh Do",
            value_vnd=73000000,
            expiry_date=parse_date("2026-04-21"),
            expires_in_days=28,
            status="active",
            status_label="Active",
        ),
        ContractListItem(
            id="ct-010",
            contract_number="HD-PR-010",
            partner="Nguoi Lao Dong",
            owner_id="owner-hoang",
            owner="Hoang Nguyen",
            value_vnd=168000000,
            expiry_date=parse_date("2026-04-01"),
            expires_in_days=8,
            status="active",
            status_label="Active",
        ),
        ContractListItem(
            id="ct-011",
            contract_number="HD-PR-011",
            partner="Tien Phong",
            owner_id="owner-linh",
            owner="Linh Tran",
            value_vnd=102000000,
            expiry_date=parse_date("2026-05-02"),
            expires_in_days=39,
            status="draft",
            status_label="Draft",
        ),
        ContractListItem(
            id="ct-012",
            contract_number="HD-PR-012",
            partner="Lao Dong",
            owner_id="owner-minh",
            owner="Minh Do",
            value_vnd=99000000,
            expiry_date=parse_date("2026-04-27"),
            expires_in_days=34,
            status="active",
            status_label="Active",
        ),
    ]

    filtered = filter_contract_items(items, status=status, owner_id=owner_id, search=search)
    owner_options = build_owner_options(filtered or items)
    total = len(filtered)
    total_pages = max(1, ceil(total / limit)) if total else 1
    start = (page - 1) * limit
    page_items = filtered[start : start + limit]

    return ContractsListResponse(
        connected=False,
        fetched_at=utc_now(),
        message="Đang hiển thị dữ liệu mẫu vì backend chưa kết nối Supabase thực tế.",
        page=page,
        limit=limit,
        total=total,
        total_pages=total_pages,
        owners=owner_options,
        items=page_items,
    )


def filter_contract_items(
    items: list[ContractListItem | ContractSummary],
    status: str | None,
    owner_id: str | None,
    search: str | None,
) -> list[Any]:
    normalized_search = normalize_text(search or "")

    filtered: list[Any] = []
    for item in items:
        if status and item.status != status:
            continue
        if owner_id and getattr(item, "owner_id", None) != owner_id:
            continue
        if normalized_search:
            haystack = normalize_text(
                f"{item.contract_number} {item.partner} {getattr(item, 'owner', '')}"
            )
            if normalized_search not in haystack:
                continue
        filtered.append(item)

    return filtered


def build_owner_options(items: list[ContractListItem | ContractSummary]) -> list[ContractOwnerOption]:
    seen: dict[str, str] = {}
    for item in items:
        owner_id = getattr(item, "owner_id", None)
        owner_name = getattr(item, "owner", "")
        if owner_id and owner_name and owner_id not in seen:
            seen[owner_id] = owner_name

    return [
        ContractOwnerOption(id=owner_id, label=label)
        for owner_id, label in sorted(seen.items(), key=lambda entry: entry[1])
    ]


def get_contracts(
    status: str | None,
    owner_id: str | None,
    search: str | None,
    page: int,
    limit: int,
) -> ContractsListResponse:
    resolved_page = clamp_page(page)
    resolved_limit = clamp_limit(limit)
    settings = get_settings()

    if not settings.has_supabase:
        return demo_contracts_response(
            page=resolved_page,
            limit=resolved_limit,
            status=status,
            owner_id=owner_id,
            search=search,
        )

    try:
        get_supabase_client()
        partners = fetch_rows("partners")
        profiles = fetch_rows("profiles")
        raw_contracts = fetch_rows("contracts")

        partner_lookup = build_lookup(
            partners, ["partner_name", "name", "title", "display_name"]
        )
        owner_lookup = build_lookup(profiles, DISPLAY_NAME_FIELDS)
        normalized_contracts = normalize_contracts(
            raw_contracts, partner_lookup, owner_lookup
        )
        summaries = to_contract_summary(normalized_contracts, raw_contracts)
        filtered = filter_contract_items(
            summaries, status=status, owner_id=owner_id, search=search
        )
        total = len(filtered)
        total_pages = max(1, ceil(total / resolved_limit)) if total else 1
        start = (resolved_page - 1) * resolved_limit
        page_items = filtered[start : start + resolved_limit]

        return ContractsListResponse(
            connected=True,
            fetched_at=utc_now(),
            message=None,
            page=resolved_page,
            limit=resolved_limit,
            total=total,
            total_pages=total_pages,
            owners=build_owner_options(summaries),
            items=[
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
                for item in page_items
            ],
        )
    except Exception as exc:
        response = demo_contracts_response(
            page=resolved_page,
            limit=resolved_limit,
            status=status,
            owner_id=owner_id,
            search=search,
        )
        response.message = str(exc)
        return response
