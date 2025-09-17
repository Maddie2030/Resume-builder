# auth-service/app/database/config.py
import os
from dotenv import load_dotenv # For reading .env file in local development
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base # <-- Re-added declarative_base

# Load environment variables.
# This ensures that DATABASE_URL is read from your .env file when running locally,
# or from Docker Compose's injected environment variables when running in Docker.
load_dotenv()

# Determine DATABASE_URL based on environment.
# When running locally, it should connect to localhost (if Postgres port is exposed).
# When running in Docker Compose, it should connect to 'postgres' service name.
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback/Default for development if .env is not yet set up,
    # or to illustrate how the URL is constructed.
    # In a robust setup, you might raise an error if DATABASE_URL is not found.
    POSTGRES_USER = os.getenv("POSTGRES_USER", "user") # Default for dev
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password") # Default for dev
    POSTGRES_DB = os.getenv("POSTGRES_DB", "auth_db") # Default for dev

    # This fallback is for when running within Docker Compose without DATABASE_URL set
    # in .env, using the service name 'postgres'.
    # When running locally, DATABASE_URL should be set in auth-service/.env to use localhost.
    DATABASE_URL = f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@postgres:5432/{POSTGRES_DB}"
    print(f"WARNING: DATABASE_URL not found in environment. Using fallback: {DATABASE_URL}")

# Create the SQLAlchemy engine
# echo=True is great for debugging in development.
# future=True enables SQLAlchemy 2.0 style features.
engine = create_async_engine(DATABASE_URL, echo=True, future=True)

# Create a declarative base for your ORM models
#Base = declarative_base() # <-- CRITICAL: Re-added this line!

# Configure the sessionmaker for creating AsyncSession instances
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False, # <-- Re-added for explicit transaction control
    autoflush=False,  # <-- Re-added for explicit flush control
    expire_on_commit=False
)


from typing import AsyncGenerator

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

# # Dependency for managing database sessions
# @asynccontextmanager
# async def get_session():
#     """Provides an asynchronous SQLAlchemy session for dependency injection."""
#     session = AsyncSessionLocal()
#     try:
#         yield session
#     finally:
#         # Ensure the session is closed even if an error occurs
#         await session.close()

# Optional: database init and shutdown handlers
async def init_db():
    """Initializes the database connection.
    In a production setup, Alembic manages table creation and schema changes.
    """
    # Simply ensure connection can be established for health checks, etc.
    async with engine.begin() as conn:
        await conn.run_sync(lambda _: None) # This just tests the connection

    print("Database initialization complete (via config.py).")

async def close_db():
    """Closes all connections in the connection pool on application shutdown."""
    await engine.dispose()
    print("Database connections disposed.")