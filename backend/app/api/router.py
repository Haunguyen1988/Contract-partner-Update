from fastapi import APIRouter

from app.api.routes import (
    budget_allocations,
    contracts,
    dashboard,
    health,
    partners,
    payments,
    profiles,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(dashboard.router)
api_router.include_router(profiles.router)
api_router.include_router(partners.router)
api_router.include_router(contracts.router)
api_router.include_router(payments.router)
api_router.include_router(budget_allocations.router)
