from datetime import datetime, timezone

from app.core.config import get_settings
from app.core.supabase import get_supabase_client
from app.schemas.dashboard import DashboardSummary, TableSummary
from app.schemas.resource import ResourceListResponse

TABLE_LABELS = {
    "profiles": "Nguoi dung",
    "partners": "Doi tac",
    "contracts": "Hop dong",
    "payments": "Thanh toan",
    "budget_allocations": "Ngan sach",
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def clamp_limit(limit: int | None) -> int:
    settings = get_settings()

    if limit is None:
        return settings.DEFAULT_PAGE_SIZE

    return max(1, min(limit, settings.MAX_PAGE_SIZE))


def get_table_snapshot(table_name: str, limit: int | None = None) -> ResourceListResponse:
    settings = get_settings()
    resolved_limit = clamp_limit(limit)

    if not settings.has_supabase:
        return ResourceListResponse(
            table=table_name,
            connected=False,
            count=None,
            fetched_at=utc_now(),
            message=(
                "Supabase credentials are not configured yet. "
                "Copy backend/.env.example to backend/.env and fill them in."
            ),
            items=[],
        )

    try:
        client = get_supabase_client()
        response = (
            client.table(table_name)
            .select("*", count="exact")
            .limit(resolved_limit)
            .execute()
        )
        data = response.data or []
        count = getattr(response, "count", None)

        return ResourceListResponse(
            table=table_name,
            connected=True,
            count=count,
            fetched_at=utc_now(),
            items=data,
        )
    except Exception as exc:  # pragma: no cover - defensive runtime safety
        return ResourceListResponse(
            table=table_name,
            connected=False,
            count=None,
            fetched_at=utc_now(),
            message=str(exc),
            items=[],
        )


def get_dashboard_summary() -> DashboardSummary:
    settings = get_settings()
    tables: list[TableSummary] = []
    connected = True
    first_message: str | None = None

    for table_name, label in TABLE_LABELS.items():
        snapshot = get_table_snapshot(table_name=table_name, limit=1)
        tables.append(
            TableSummary(name=table_name, label=label, count=snapshot.count)
        )
        connected = connected and snapshot.connected

        if not snapshot.connected and first_message is None:
            first_message = snapshot.message

    return DashboardSummary(
        app_name=settings.APP_NAME,
        connected=connected,
        frontend_origin=settings.FRONTEND_ORIGIN,
        fetched_at=utc_now(),
        message=first_message,
        tables=tables,
    )
