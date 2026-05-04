from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import timedelta

from backend.app.core.config import settings
from backend.app.core.security import verify_password, create_access_token, get_password_hash
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.schemas.user import Token, UserCreate, UserLogin, UserResponse

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
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

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await User.get(email=user.email)
    if not user or not verify_password(user.hashed_password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.id}, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}

@router.post("/refresh")
async def refresh(token: str):
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(data={"sub": payload.get("sub")}, expires_delta=access_token_expires)
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
