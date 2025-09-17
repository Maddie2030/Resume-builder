# auth-service/app/routers/auth.py

import os # Required for os.getenv to access environment variables directly in this file
from datetime import timedelta
from typing import Annotated # Required for type hinting with Depends in Python 3.9+

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer # New: For JWT token handling in HTTP headers
from jose import JWTError, ExpiredSignatureError # New: For catching specific JWT errors
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select # Used for querying the database

# --- Import your project's custom modules ---
from ..database.config import get_session # Dependency for getting a database session
from ..models.user import User # Your SQLAlchemy ORM model for the User table
from ..schemas.user import UserCreate, UserLogin, UserResponse # Pydantic schemas for request/response bodies
from ..schemas.token import Token, TokenData # Updated: Ensure TokenData is imported as well
# Updated: Import new security utility functions
from ..core.security import hash_password, verify_password, create_access_token, decode_access_token, get_user_by_username

# --- Initialize the FastAPI Router ---
router = APIRouter()

# --- NEW: OAuth2PasswordBearer for JWT Token Extraction ---
# This tells FastAPI how to expect the token (in Authorization: Bearer <token>)
# tokenUrl="api/v1/auth/token" points to your login endpoint where clients can obtain a token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# --- NEW: Dependency: Get Current User ---
async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], # Automatically extracts token from "Authorization: Bearer" header
    session: AsyncSession = Depends(get_session) # Provides a database session
) -> User:
    """
    FastAPI dependency function to authenticate the current user using a JWT.

    - Extracts the JWT from the request's Authorization header.
    - Decodes and validates the token's signature and expiration.
    - Retrieves the corresponding user from the database based on the token's 'sub' claim (username).
    - Raises HTTPException if the token is invalid, expired, or the user is not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the token using your custom utility function
        payload = decode_access_token(token)
        username: str = payload.get("sub") # Extract the 'sub' (subject) claim, which holds the username
        if username is None:
            raise credentials_exception
        # Validate the extracted username with the Pydantic TokenData schema
        token_data = TokenData(username=username)
    except ExpiredSignatureError:
        # Handle specific error for expired tokens
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError: # Catch all other JWT related errors (e.g., bad signature, invalid claims)
        raise credentials_exception

    # Retrieve the user from the database using the username from the token
    user = await get_user_by_username(session, token_data.username)
    if user is None:
        # If user not found in DB (e.g., deleted after token issue), raise exception
        raise credentials_exception
    return user

# --- NEW: Dependency: Get Current Active User (Optional but Good Practice) ---
async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)] # Depends on the get_current_user dependency
) -> User:
    """
    FastAPI dependency to ensure the current authenticated user is active.

    - Uses get_current_user to get the authenticated user.
    - Checks if the user's 'is_active' status is True.
    - Raises HTTPException if the user is not active.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user


# --- Endpoint: User Registration (/register) ---
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate, # Pydantic model for validating the incoming request body for registration
    session: AsyncSession = Depends(get_session) # Dependency Injection: Provides an async database session
):
    """
    Registers a new user in the system.

    - Validates the input format (e.g., email format, password minimum length).
    - Checks if the provided username or email already exists in the database to prevent duplicates.
    - Hashes the user's plain-text password using bcrypt before storing it.
    - Stores the new user record (with hashed password) in the PostgreSQL database.
    - Returns the newly created user's public information.
    """
    # 1. Check for Duplicate Username
    query_username = select(User).where(User.username == user_in.username)
    existing_user_by_username = (await session.execute(query_username)).scalar_one_or_none()
    if existing_user_by_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already registered"
        )

    # 2. Check for Duplicate Email
    query_email = select(User).where(User.email == user_in.email)
    existing_user_by_email = (await session.execute(query_email)).scalar_one_or_none()
    if existing_user_by_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # 3. Hash the User's Password
    hashed_password = hash_password(user_in.password)

    # 4. Create a New User ORM Object
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password
    )

    # 5. Add User to Session and Commit to Database
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)

    # 6. Return the Created User
    return db_user

# --- Endpoint: User Login and Token Generation (/token) ---
@router.post("/login", response_model=Token)
async def login_for_access_token(
    user_in: UserLogin, # Pydantic model for validating the incoming request body for login
    session: AsyncSession = Depends(get_session) # Dependency Injection: Provides an async database session
):
    """
    Authenticates a user and generates a JWT access token upon successful login.

    - Retrieves the user from the database based on the provided username.
    - Verifies the plain-text password against the stored hashed password.
    - If credentials are valid, generates a JSON Web Token (JWT) access token.
    - Returns the access token and its type ('bearer').
    """
    # 1. Retrieve User from Database
    query = select(User).where(User.username == user_in.username)
    user = (await session.execute(query)).scalar_one_or_none()

    # 2. Check if User Exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Verify Password
    if not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Get Access Token Expiration Time
    access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    access_token_expires = timedelta(minutes=access_token_expire_minutes)

    # 5. Create the JWT Access Token
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )

    # 6. Return the Access Token
    return {"access_token": access_token, "token_type": "bearer"}

# --- UPDATED: Protected Endpoint: Get Current User Info (/me) ---
# This endpoint now requires authentication via the get_current_active_user dependency
@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)] # This line protects the endpoint
):
    """
    Retrieves the details of the currently authenticated (and active) user.
    This endpoint is protected by JWT authentication.
    Accessing this endpoint without a valid JWT will result in a 401 Unauthorized error.
    """
    # The 'current_user' object already contains the user details retrieved from the database
    # by the get_current_active_user dependency.
    return current_user