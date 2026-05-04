from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base

DATABASE_URL = "postgresql+asyncpg://postgres:password@db:5432/fileu"

engine = create_async_engine(DATABASE_URL)
Base = declarative_base()
