# auth-service/app/core/security.py

import os
from datetime import datetime, timedelta
from typing import Union
import uuid

from passlib.context import CryptContext
from jose import JWTError, jwt, ExpiredSignatureError
from dotenv import load_dotenv

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models.user import User

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set.")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "jti": str(uuid.uuid4())})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise ExpiredSignatureError("Token has expired")
    except JWTError:
        raise JWTError("Could not validate credentials")

async def get_user_by_username(session: AsyncSession, username: str) -> Union[User, None]:
    query = select(User).where(User.username == username)
    result = await session.execute(query)
    return result.scalar_one_or_none()
