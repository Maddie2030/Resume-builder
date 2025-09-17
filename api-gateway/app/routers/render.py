# api-gateway/app/routers/render.py
from fastapi import APIRouter, Request, HTTPException, Response, status
import httpx
from ..config import settings

router = APIRouter()

client = httpx.AsyncClient()

# Use the centralized settings object
RENDER_SERVICE_URL = settings.RENDER_SERVICE_URL

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
async def forward_render_request(path: str, request: Request):
    url = f"{RENDER_SERVICE_URL}/api/v1/render/{path}" if path else f"{RENDER_SERVICE_URL}/api/v1/render/"
    
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
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Render Service is unavailable: {e}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {e}")