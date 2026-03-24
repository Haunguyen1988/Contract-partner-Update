from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def get_supabase_client() -> Client:
    settings = get_settings()

    if not settings.has_supabase:
        raise RuntimeError(
            "Supabase environment variables are missing. "
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        )

    return create_client(settings.SUPABASE_URL, settings.supabase_key)
