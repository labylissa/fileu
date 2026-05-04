from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.security import verify_password, create_access_token, get_password_hash
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.schemas.user import Token, UserCreate, UserLogin, UserResponse

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    user = await User.get(id=payload.get("sub"))
    if user is None:
        raise credentials_exception
    return user

async def get_db():
    async with AsyncSessionLocal() as db:
        yield db
