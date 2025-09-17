# api-gateway/app/routers/template.py
from fastapi import APIRouter, Request, HTTPException, Response, status
import httpx, os
# Change the import from 'settings' to 'config'
from ..config import settings

router = APIRouter()  # No prefix here, handled in main.py

client = httpx.AsyncClient()

# Use settings.TEMPLATE_SERVICE_URL directly for consistency
TEMPLATE_SERVICE_URL = settings.TEMPLATE_SERVICE_URL

# Define hop-by-hop headers
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
async def forward_template_request(path: str, request: Request):
    """
    Forward any request under /api/v1/templates/* to the Template Service.
    """
    url = f"{TEMPLATE_SERVICE_URL}/api/v1/templates/{path}" if path else f"{TEMPLATE_SERVICE_URL}/api/v1/templates/"

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
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Template Service is unavailable: {e}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Unexpected error: {e}")