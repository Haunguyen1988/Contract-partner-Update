from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Any

from app.core.config import get_settings
from app.core.supabase import get_supabase_client
from app.schemas.dashboard import (
    DashboardAlertItem,
    DashboardAlertsResponse,
    DashboardOwnerMatrixResponse,
    DashboardStats,
    DashboardStatsResponse,
    OwnerMatrixItem,
)

ACTIVE_STATUSES = {
    "active",
    "approved",
    "running",
    "signed",
    "in_effect",
    "effective",
    "published",
}

PENDING_STATUSES = {
    "pending",
    "pending_approval",
    "waiting_approval",
    "draft",
    "review",
    "submitted",
}

PAID_STATUSES = {"paid", "completed", "approved", "done", "success"}

DATE_FIELDS = [
    "end_date",
    "expiry_date",
    "expires_at",
    "expired_at",
    "contract_end_date",
    "effective_to",
    "valid_to",
]

CONTRACT_NUMBER_FIELDS = [
    "contract_no",
    "contract_number",
    "number",
    "code",
    "reference_no",
    "ma_hop_dong",
    "title",
    "name",
    "id",
]

PARTNER_NAME_FIELDS = ["partner_name", "partner", "partner_title", "partner_label"]
OWNER_NAME_FIELDS = [
    "owner_name",
    "owner",
    "account_manager",
    "manager_name",
    "pic_name",
    "assigned_to_name",
]

STATUS_FIELDS = ["status", "contract_status", "state", "approval_status"]

PARTNER_ID_FIELDS = ["partner_id", "partnerId", "partner_uuid"]
OWNER_ID_FIELDS = ["owner_id", "ownerId", "profile_id", "user_id", "assigned_to"]

DISPLAY_NAME_FIELDS = ["full_name", "name", "display_name", "email", "username"]

BUDGET_PERCENT_FIELDS = [
    "budget_used_percent",
    "used_percent",
    "utilization_percent",
    "usage_percent",
    "percent_used",
]

ALLOCATED_BUDGET_FIELDS = [
    "allocated_amount",
    "budget_amount",
    "total_budget",
    "budget_total",
    "allocated_budget",
]

USED_BUDGET_FIELDS = ["used_amount", "spent_amount", "consumed_amount", "actual_spend"]
PAYMENT_AMOUNT_FIELDS = ["amount", "paid_amount", "payment_amount", "gross_amount"]


@dataclass
class NormalizedContract:
    contract_id: str
    contract_number: str
    partner_id: str | None
    partner_name: str
    owner_id: str | None
    owner_name: str
    status_key: str
    status_label: str
    expiry_date: date | None
    days_remaining: int | None
    active: bool
    pending: bool


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def today() -> date:
    return utc_now().date()


def normalize_text(value: Any) -> str:
    return str(value or "").strip().lower().replace(" ", "_")


def first_value(record: dict[str, Any], fields: list[str]) -> Any:
    for field in fields:
        value = record.get(field)
        if value not in (None, ""):
            return value
    return None


def parse_date(value: Any) -> date | None:
    if value in (None, ""):
        return None

    if isinstance(value, date) and not isinstance(value, datetime):
        return value

    if isinstance(value, datetime):
        return value.date()

    text = str(value).strip()
    if not text:
        return None

    candidates = [text]
    if "T" in text:
        candidates.append(text.split("T", 1)[0])
    if "/" in text:
        candidates.append(text.replace("/", "-"))

    for candidate in candidates:
        try:
            return date.fromisoformat(candidate[:10])
        except ValueError:
            continue

    return None


def to_float(value: Any) -> float | None:
    if value in (None, ""):
        return None

    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip().replace("%", "").replace(",", "")
    try:
        return float(text)
    except ValueError:
        return None


def round_percent(value: float | None) -> float:
    if value is None:
        return 0.0
    return round(max(0.0, min(value, 100.0)), 1)


def status_to_label(status_key: str) -> str:
    mapping = {
        "active": "Active",
        "approved": "Active",
        "running": "Active",
        "signed": "Active",
        "pending": "Chờ duyệt",
        "pending_approval": "Chờ duyệt",
        "waiting_approval": "Chờ duyệt",
        "review": "Đang review",
        "draft": "Draft",
        "expired": "Sắp hết hạn",
    }
    return mapping.get(status_key, status_key.replace("_", " ").title() or "Chưa rõ")


def urgency_for_days(days_remaining: int | None) -> str:
    if days_remaining is None:
        return "neutral"
    if days_remaining <= 7:
        return "red"
    if days_remaining <= 15:
        return "yellow"
    if days_remaining <= 30:
        return "orange"
    return "neutral"


def demo_stats_response(message: str) -> DashboardStatsResponse:
    return DashboardStatsResponse(
        connected=False,
        fetched_at=utc_now(),
        message=message,
        stats=DashboardStats(
            active_contracts=28,
            expiring_in_30_days=6,
            pending_approval=4,
            budget_used_percent=67.5,
        ),
    )


def demo_alerts_response(message: str) -> DashboardAlertsResponse:
    return DashboardAlertsResponse(
        connected=False,
        fetched_at=utc_now(),
        message=message,
        items=[
            DashboardAlertItem(
                contract_number="HD-PR-024",
                partner="VnExpress",
                owner="Linh Tran",
                expiry_date=date(2026, 3, 29),
                status="Cần gia hạn",
                urgency="red",
                days_remaining=5,
            ),
            DashboardAlertItem(
                contract_number="HD-PR-011",
                partner="Tuoi Tre",
                owner="Hoang Nguyen",
                expiry_date=date(2026, 4, 4),
                status="Sắp hết hạn",
                urgency="yellow",
                days_remaining=11,
            ),
            DashboardAlertItem(
                contract_number="HD-PR-032",
                partner="Zing News",
                owner="Minh Do",
                expiry_date=date(2026, 4, 18),
                status="Theo dõi",
                urgency="orange",
                days_remaining=25,
            ),
        ],
    )


def demo_owner_matrix_response(message: str) -> DashboardOwnerMatrixResponse:
    return DashboardOwnerMatrixResponse(
        connected=False,
        fetched_at=utc_now(),
        message=message,
        items=[
            OwnerMatrixItem(
                owner="Linh Tran",
                partner="VnExpress",
                active_contracts=5,
                nearest_expiry=date(2026, 3, 29),
                budget_used_percent=82.0,
            ),
            OwnerMatrixItem(
                owner="Hoang Nguyen",
                partner="Tuoi Tre",
                active_contracts=4,
                nearest_expiry=date(2026, 4, 4),
                budget_used_percent=64.0,
            ),
            OwnerMatrixItem(
                owner="Minh Do",
                partner="Zing News",
                active_contracts=3,
                nearest_expiry=date(2026, 4, 18),
                budget_used_percent=58.5,
            ),
        ],
    )


def fetch_rows(table_name: str, limit: int = 500) -> list[dict[str, Any]]:
    client = get_supabase_client()
    response = client.table(table_name).select("*").limit(limit).execute()
    return response.data or []


def build_lookup(rows: list[dict[str, Any]], name_fields: list[str]) -> dict[str, str]:
    lookup: dict[str, str] = {}
    for row in rows:
        row_id = row.get("id")
        display_name = first_value(row, name_fields)
        if row_id is not None and display_name:
            lookup[str(row_id)] = str(display_name)
    return lookup


def normalize_contracts(
    contracts: list[dict[str, Any]],
    partner_lookup: dict[str, str],
    owner_lookup: dict[str, str],
) -> list[NormalizedContract]:
    normalized: list[NormalizedContract] = []
    reference_day = today()

    for row in contracts:
        contract_id = str(row.get("id") or row.get("uuid") or row.get("contract_id") or "")
        contract_number = str(first_value(row, CONTRACT_NUMBER_FIELDS) or f"HD-{contract_id or 'NA'}")

        partner_id_value = first_value(row, PARTNER_ID_FIELDS)
        partner_id = str(partner_id_value) if partner_id_value is not None else None
        partner_name = str(first_value(row, PARTNER_NAME_FIELDS) or "")
        if not partner_name and partner_id:
            partner_name = partner_lookup.get(partner_id, "Chưa rõ đối tác")
        partner_name = partner_name or "Chưa rõ đối tác"

        owner_id_value = first_value(row, OWNER_ID_FIELDS)
        owner_id = str(owner_id_value) if owner_id_value is not None else None
        owner_name = str(first_value(row, OWNER_NAME_FIELDS) or "")
        if not owner_name and owner_id:
            owner_name = owner_lookup.get(owner_id, "Chưa gán owner")
        owner_name = owner_name or "Chưa gán owner"

        status_key = normalize_text(first_value(row, STATUS_FIELDS) or "active")
        expiry_date = parse_date(first_value(row, DATE_FIELDS))
        days_remaining = (
            (expiry_date - reference_day).days if expiry_date is not None else None
        )
        active = (
            status_key in ACTIVE_STATUSES and (days_remaining is None or days_remaining >= 0)
        ) or (
            status_key not in ACTIVE_STATUSES
            and status_key not in PENDING_STATUSES
            and (days_remaining is None or days_remaining >= 0)
        )
        pending = status_key in PENDING_STATUSES

        normalized.append(
            NormalizedContract(
                contract_id=contract_id,
                contract_number=contract_number,
                partner_id=partner_id,
                partner_name=partner_name,
                owner_id=owner_id,
                owner_name=owner_name,
                status_key=status_key,
                status_label=status_to_label(status_key),
                expiry_date=expiry_date,
                days_remaining=days_remaining,
                active=active and not pending,
                pending=pending,
            )
        )

    return normalized


def contract_budget_percent(
    contract: NormalizedContract,
    budgets: list[dict[str, Any]],
    payments: list[dict[str, Any]],
) -> float | None:
    direct_percent_values: list[float] = []
    allocated_total = 0.0
    used_total = 0.0

    for row in budgets:
        row_contract_id = row.get("contract_id") or row.get("contractId")
        row_partner_id = row.get("partner_id") or row.get("partnerId")
        row_owner_id = row.get("owner_id") or row.get("ownerId")

        if contract.contract_id and str(row_contract_id or "") == contract.contract_id:
            matches = True
        elif contract.partner_id and str(row_partner_id or "") == contract.partner_id:
            matches = True
        elif contract.owner_id and str(row_owner_id or "") == contract.owner_id:
            matches = True
        else:
            matches = False

        if not matches:
            continue

        direct_percent = to_float(first_value(row, BUDGET_PERCENT_FIELDS))
        if direct_percent is not None:
            direct_percent_values.append(direct_percent)

        allocated = to_float(first_value(row, ALLOCATED_BUDGET_FIELDS))
        used = to_float(first_value(row, USED_BUDGET_FIELDS))
        if allocated is not None:
            allocated_total += allocated
        if used is not None:
            used_total += used

    if direct_percent_values:
        return round_percent(sum(direct_percent_values) / len(direct_percent_values))

    for payment in payments:
        payment_contract_id = payment.get("contract_id") or payment.get("contractId")
        if contract.contract_id and str(payment_contract_id or "") != contract.contract_id:
            continue
        payment_status = normalize_text(first_value(payment, ["status", "payment_status", "state"]))
        if payment_status and payment_status not in PAID_STATUSES:
            continue
        amount = to_float(first_value(payment, PAYMENT_AMOUNT_FIELDS))
        if amount is not None:
            used_total += amount

    if allocated_total > 0:
        return round_percent((used_total / allocated_total) * 100)

    return None


def overall_budget_percent(
    budgets: list[dict[str, Any]],
    payments: list[dict[str, Any]],
    contracts: list[NormalizedContract],
) -> float:
    direct_percent_values: list[float] = []
    allocated_total = 0.0
    used_total = 0.0

    for row in budgets:
        direct_percent = to_float(first_value(row, BUDGET_PERCENT_FIELDS))
        if direct_percent is not None:
            direct_percent_values.append(direct_percent)

        allocated = to_float(first_value(row, ALLOCATED_BUDGET_FIELDS))
        used = to_float(first_value(row, USED_BUDGET_FIELDS))
        if allocated is not None:
            allocated_total += allocated
        if used is not None:
            used_total += used

    if direct_percent_values:
        return round_percent(sum(direct_percent_values) / len(direct_percent_values))

    if allocated_total > 0:
        for payment in payments:
            payment_status = normalize_text(first_value(payment, ["status", "payment_status", "state"]))
            if payment_status and payment_status not in PAID_STATUSES:
                continue
            amount = to_float(first_value(payment, PAYMENT_AMOUNT_FIELDS))
            if amount is not None:
                used_total += amount
        return round_percent((used_total / allocated_total) * 100)

    contract_percents = [
        contract_budget_percent(contract, budgets, payments) for contract in contracts
    ]
    usable_values = [value for value in contract_percents if value is not None]
    if usable_values:
        return round_percent(sum(usable_values) / len(usable_values))

    return 0.0


def get_dashboard_payload() -> tuple[
    bool,
    str | None,
    list[NormalizedContract],
    list[dict[str, Any]],
    list[dict[str, Any]],
]:
    settings = get_settings()
    if not settings.has_supabase:
        raise RuntimeError(
            "Chua cau hinh Supabase. Hay dien SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY trong backend/.env."
        )

    partners = fetch_rows("partners")
    profiles = fetch_rows("profiles")
    contracts = fetch_rows("contracts")
    budgets = fetch_rows("budget_allocations")
    payments = fetch_rows("payments")

    partner_lookup = build_lookup(partners, ["partner_name", "name", "title", "display_name"])
    owner_lookup = build_lookup(profiles, DISPLAY_NAME_FIELDS)
    normalized_contracts = normalize_contracts(contracts, partner_lookup, owner_lookup)

    return True, None, normalized_contracts, budgets, payments


def get_dashboard_stats() -> DashboardStatsResponse:
    try:
        connected, message, contracts, budgets, payments = get_dashboard_payload()
    except Exception as exc:
        return demo_stats_response(str(exc))

    expiring_30_days = [
        contract
        for contract in contracts
        if contract.days_remaining is not None and 0 <= contract.days_remaining <= 30
    ]
    active_contracts = [contract for contract in contracts if contract.active]
    pending_contracts = [contract for contract in contracts if contract.pending]

    return DashboardStatsResponse(
        connected=connected,
        fetched_at=utc_now(),
        message=message,
        stats=DashboardStats(
            active_contracts=len(active_contracts),
            expiring_in_30_days=len(expiring_30_days),
            pending_approval=len(pending_contracts),
            budget_used_percent=overall_budget_percent(budgets, payments, contracts),
        ),
    )


def get_dashboard_alerts() -> DashboardAlertsResponse:
    try:
        connected, message, contracts, _, _ = get_dashboard_payload()
    except Exception as exc:
        return demo_alerts_response(str(exc))

    alert_candidates = [
        contract
        for contract in contracts
        if contract.days_remaining is not None and contract.days_remaining <= 30
    ]
    alert_candidates.sort(
        key=lambda contract: (
            contract.days_remaining if contract.days_remaining is not None else 9999,
            contract.expiry_date or date.max,
        )
    )

    items = [
        DashboardAlertItem(
            contract_number=contract.contract_number,
            partner=contract.partner_name,
            owner=contract.owner_name,
            expiry_date=contract.expiry_date,
            status=contract.status_label,
            urgency=urgency_for_days(contract.days_remaining),
            days_remaining=contract.days_remaining,
        )
        for contract in alert_candidates[:12]
    ]

    return DashboardAlertsResponse(
        connected=connected,
        fetched_at=utc_now(),
        message=message,
        items=items,
    )


def get_dashboard_owner_matrix() -> DashboardOwnerMatrixResponse:
    try:
        connected, message, contracts, budgets, payments = get_dashboard_payload()
    except Exception as exc:
        return demo_owner_matrix_response(str(exc))

    grouped: dict[tuple[str, str], list[NormalizedContract]] = defaultdict(list)
    for contract in contracts:
        if contract.active:
            grouped[(contract.owner_name, contract.partner_name)].append(contract)

    items: list[OwnerMatrixItem] = []
    for (owner, partner), group_contracts in grouped.items():
        nearest_expiry = min(
            [contract.expiry_date for contract in group_contracts if contract.expiry_date],
            default=None,
        )
        budget_values = [
            contract_budget_percent(contract, budgets, payments) for contract in group_contracts
        ]
        usable_budget_values = [value for value in budget_values if value is not None]
        budget_percent = (
            round_percent(sum(usable_budget_values) / len(usable_budget_values))
            if usable_budget_values
            else 0.0
        )

        items.append(
            OwnerMatrixItem(
                owner=owner,
                partner=partner,
                active_contracts=len(group_contracts),
                nearest_expiry=nearest_expiry,
                budget_used_percent=budget_percent,
            )
        )

    items.sort(key=lambda item: (-item.active_contracts, item.owner, item.partner))

    return DashboardOwnerMatrixResponse(
        connected=connected,
        fetched_at=utc_now(),
        message=message,
        items=items[:12],
    )
