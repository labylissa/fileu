from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., env='DATABASE_URL')
    JWT_SECRET_KEY: str = Field(..., env='JWT_SECRET_KEY')
    JWT_ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    class Config:
        env_file = '.env'

settings = Settings()
