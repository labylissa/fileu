from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.db.session import engine
from backend.app.db.base import Base

# Import all models so Base.metadata is complete
import backend.app.models.user      # noqa
import backend.app.models.property  # noqa

from backend.app.routers.auth import router as auth_router
from backend.app.routers.properties import router as properties_router


def _ensure_upload_dirs():
    upload = Path(settings.UPLOAD_DIR)
    upload.mkdir(parents=True, exist_ok=True)
    (upload / "photos").mkdir(exist_ok=True)
    (upload / "thumbnails").mkdir(exist_ok=True)


# Create upload dirs at import time so StaticFiles mount succeeds
_ensure_upload_dirs()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="Fileu API",
    description="Application de gestion locative — Bailleur Direct",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for local photo storage
app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(properties_router, prefix="/api/v1/properties", tags=["properties"])


@app.get("/health")
async def health():
    return {"status": "ok"}
