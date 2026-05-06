from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., alias="DATABASE_URL")
    JWT_SECRET_KEY: str = Field(..., alias="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # S3 / MinIO — optionnel en dev (stockage local en fallback)
    S3_ENDPOINT_URL: Optional[str] = None        # ex: http://minio:9000
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "fileu"
    S3_REGION: str = "eu-west-1"
    USE_LOCAL_STORAGE: bool = True               # True = stockage local /uploads

    # Dossier upload local (dev)
    UPLOAD_DIR: str = "/tmp/fileu_uploads"

    model_config = SettingsConfigDict(env_file=".env", populate_by_name=True)


settings = Settings()
