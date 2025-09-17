# api-gateway/app/routers/auth.py

from fastapi import APIRouter, Request, HTTPException, Response, status
import httpx
from ..config import settings

router = APIRouter()

client = httpx.AsyncClient()

# Use the centralized settings object
AUTH_SERVICE_URL = settings.AUTH_SERVICE_URL

HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
}

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def forward_auth_request(path: str, request: Request):
    # The URL should include the prefix that the Auth Service expects
    # The path will be "register", "login", etc.
    url = f"{AUTH_SERVICE_URL}/api/v1/auth/{path}" if path else f"{AUTH_SERVICE_URL}/api/v1/auth/"
    
    headers = dict(request.headers)
    headers.pop("host", None)

    try:
        response = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            params=request.query_params,
            content=await request.body()
        )

        filtered_headers = {k: v for k, v in response.headers.items() if k.lower() not in HOP_BY_HOP_HEADERS}

        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=filtered_headers,
            media_type=response.headers.get("content-type"),
        )

    except httpx.ConnectError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Auth Service is unavailable: {e}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {e}")