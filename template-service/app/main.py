# Template-service/app/main.py

from fastapi import FastAPI, status
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles

from .db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from .routers import template as template_router

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Template Service: Starting up...")
    await connect_to_mongo()
    yield
    print("Template Service: Shutting down...")
    await close_mongo_connection()

app = FastAPI(
    title="Template Service",
    version="0.1.0",
    description="Microservice for managing Templates.",
    lifespan=lifespan
)

# Mount static directory for template images
app.mount("/static", StaticFiles(directory="/app/static"), name="static")

# Include the template router
app.include_router(template_router.router, prefix="/api/v1")

@app.get("/")
async def read_root():
    return {"message": "Welcome to Template service"}

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    database = get_database()
    db_status = "disconnected"
    if database is not None:
        try:
            await database.command("ping")
            db_status = "connected"
        except Exception:
            db_status = "error"
    return {
        "status": "ok",
        "service": "Template-service",
        "database": db_status
    }

if __name__ == "__main__":
    host = os.getenv("APP_HOST", "0.0.0.0")
    port = int(os.getenv("APP_PORT", 8002))
    uvicorn.run(app, host=host, port=port)
