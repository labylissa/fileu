from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.db.session import engine
from backend.app.db.base import Base
import backend.app.models.user      # noqa
import backend.app.models.property  # noqa

from backend.app.routers.auth import router as auth_router
from backend.app.routers.properties import router as properties_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crée les dossiers de stockage local
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    (Path(settings.UPLOAD_DIR) / "photos").mkdir(exist_ok=True)
    (Path(settings.UPLOAD_DIR) / "thumbnails").mkdir(exist_ok=True)

    # Crée les tables (dev uniquement — utiliser Alembic en prod)
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

# Fichiers statiques (photos en stockage local)
app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")

# Routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(properties_router, prefix="/api/v1/properties", tags=["properties"])


@app.get("/health")
async def health():
    return {"status": "ok"}
