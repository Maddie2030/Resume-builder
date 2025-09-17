# api-gateway/app/config.py

import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    AUTH_SERVICE_URL: str = "http://auth-service:8001"
    TEMPLATE_SERVICE_URL: str = "http://template-service:8002"
    RENDER_SERVICE_URL: str = "http://render-service:8003"
    JWT_SECRET_KEY: str
    ALGORITHM: str = "HS256"

    # Define public routes here for easy management
    public_routes: list[str] = [
        "/",
        "/health",
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/docs",
        "/openapi.json",
        "/static/{path:path}"
    ]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()