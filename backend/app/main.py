from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.routes.contracts import public_router as contracts_public_router
from app.api.routes.dashboard import public_router as dashboard_public_router
from app.api.routes.partners import public_router as partners_public_router
from app.api.routes.profiles import public_router as profiles_public_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="FastAPI backend cho web app quan tri hop dong doi tac bao chi noi bo PR COR.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_ORIGIN,
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_public_router, prefix="/api")
app.include_router(contracts_public_router, prefix="/api")
app.include_router(partners_public_router, prefix="/api")
app.include_router(profiles_public_router, prefix="/api")


@app.get("/", tags=["Meta"])
def read_root():
    return {
        "app_name": settings.APP_NAME,
        "docs": "/docs",
        "healthcheck": f"{settings.API_V1_PREFIX}/health",
        "frontend_origin": settings.FRONTEND_ORIGIN,
    }
