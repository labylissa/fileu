from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.routers.auth import router as auth_router

app = FastAPI()

@app.on_event("startup")
async def startup():
    app.db = await get_db()
