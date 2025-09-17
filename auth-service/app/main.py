# auth-service/app/main.py

from fastapi import FastAPI, HTTPException, status, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

from .routers import auth
from .database import config as database_config

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Auth Service: Starting up...")
    await database_config.init_db()
    print("Auth Service: Database initialized.")
    yield
    print("Auth Service: Shutting down.")
    await database_config.close_db()

app = FastAPI(
    title="Auth Service API",
    description="API for user authentication and authorization",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check(session: database_config.AsyncSession = Depends(database_config.get_session)):
    try:
        await session.execute(select(1))
        return {
            "status": "ok",
            "service": "auth-service",
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {e}"
        )

@app.get("/")
async def read_root():
    return {"message": "Welcome to Auth Service"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )

if __name__ == "__main__":
    load_dotenv()
    host = os.getenv("APP_HOST", "0.0.0.0")
    port = int(os.getenv("APP_PORT", 8001))
    uvicorn.run(app, host=host, port=port)
