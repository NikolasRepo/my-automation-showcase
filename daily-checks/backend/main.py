from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
# TODO: Re-enable before go-live
# from app.core.scheduler import start_scheduler, stop_scheduler
from app.api import auth, inspections, alerts, reports, admin

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # TODO: Re-enable before go-live
    # start_scheduler()
    yield
    # stop_scheduler()


app = FastAPI(
    title="Production Inspection System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(inspections.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
