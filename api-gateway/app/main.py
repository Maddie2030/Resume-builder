# api-gateway/app/main.py

import logging
import httpx
from fastapi import FastAPI, Request, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

from .middleware import JWTAuthMiddleware
from .routers import auth, template, render
from .config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api-gateway")

app = FastAPI(
    title="API Gateway",
    description="Gateway for all microservices."
)

# Global httpx client for static file forwarding or other direct requests
client = httpx.AsyncClient()

# --- Startup / Shutdown ---
@app.on_event("startup")
async def startup():
    redis = Redis(host="redis", port=6379, db=0)
    await FastAPILimiter.init(redis)

@app.on_event("shutdown")
async def shutdown():
    await client.aclose()
    await FastAPILimiter.close()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- JWT Auth Middleware ---
# Uses the single source of truth for public routes from settings.py
app.add_middleware(JWTAuthMiddleware, public_routes=settings.public_routes)

# --- Logging Middleware ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code} for {request.method} {request.url}")
    return response

# --- Static Files Proxy ---
@app.api_route("/static/{path:path}", methods=["GET"])
async def forward_static_files(path: str, request: Request):
    """
    Forward /static/* requests to Template Service.
    """
    template_service_url = settings.TEMPLATE_SERVICE_URL
    url = f"{template_service_url}/static/{path}"

    headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}

    try:
        response = await client.request("GET", url, headers=headers)
        response.raise_for_status()

        return Response(
            content=response.content,
            status_code=response.status_code,
            headers={
                "Content-Type": response.headers.get("content-type"),
                "Content-Length": response.headers.get("content-length")
            },
            media_type=response.headers.get("content-type")
        )
    except httpx.HTTPStatusError as e:
        logger.error(f"Static file error: {e.response.status_code} - {e.response.text}")
        return Response(status_code=e.response.status_code, content=e.response.text)
    except httpx.ConnectError:
        logger.critical("Template Service is unavailable for static files.")
        return Response(status_code=503, content="Template Service unavailable")

# --- Include Routers with prefixes ---
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(template.router, prefix="/api/v1/templates", tags=["Templates"])
app.include_router(render.router, prefix="/api/v1/render", tags=["Render"])

# --- Root / Health ---
@app.get("/", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
def root():
    return {"message": "Welcome to the API Gateway"}

@app.get("/health", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
def health_check():
    return {"status": "ok"}