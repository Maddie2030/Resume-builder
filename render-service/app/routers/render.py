# render-service/app/routers/render.py

import os
from typing import Optional, Union
from fastapi import APIRouter, status, HTTPException
from pydantic import BaseModel, HttpUrl
from celery import chain
from fastapi import Body
from app.celery_app import celery_app
from app.schemas.render import ImageRenderRequest
from celery.result import AsyncResult
from fastapi.responses import JSONResponse



# Schemas for the asynchronous response
class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[Union[HttpUrl, str]] = None
    error: Optional[str] = None

class TaskQueuedResponse(BaseModel):
    task_id: str
    status: str

class PdfDirectRequest(BaseModel):
    image_path: str

router = APIRouter(prefix="/api/v1/render", tags=["render"])

@router.post(
    "/generate-image",
    response_model=TaskQueuedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def generate_image_endpoint(request: ImageRenderRequest):
    """
    Sends a request to generate a custom image to the worker service.
    """
    task = celery_app.send_task(
        'render.tasks.generate_image_task',
        args=[request.model_dump()],
        queue='render_queue'
    )
    return TaskQueuedResponse(
        task_id=task.id,
        status="Task queued. Use GET /api/v1/status/{task_id} to check status."
    )



@router.post(
    "/generate-pdf-direct",
    response_model=TaskQueuedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def generate_pdf_direct_endpoint(request: PdfDirectRequest):
    """
    Sends a request to generate a PDF from an existing image path (.png).
    """
    task = celery_app.send_task(
        'render.tasks.generate_pdf_from_image_task',
        args=[request.image_path],
        queue='render_queue'
    )
    return TaskQueuedResponse(
        task_id=task.id,
        status="PDF generation task queued. Use GET /api/v1/status/{task_id} to check status."
    )

@router.post(
    "/generate-pdf-from-image",
    response_model=TaskQueuedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def generate_pdf_endpoint(request: ImageRenderRequest):
    """
    Sends a request to generate a PDF to the worker service using a task chain.
    """
    # Create a task chain: generate image first, then generate PDF from that image.
    task_chain = chain(
        celery_app.signature('render.tasks.generate_image_task', args=[request.model_dump()]),
        celery_app.signature('render.tasks.generate_pdf_from_image_task')
    )
    
    task_result = task_chain.apply_async(queue='render_queue')
    
    return TaskQueuedResponse(
        task_id=task_result.id,
        status="Task queued. Use GET /api/v1/status/{task_id} to check status."
    )

## New: Job Status Endpoint
@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """
    Fetches the current status of a rendering task from the result backend.
    """
    task = AsyncResult(task_id, app=celery_app)
    
    if task.state == 'FAILURE':
        error_details = task.info.get('reason', 'Unknown error.') if isinstance(task.info, dict) else str(task.info)
        return TaskStatusResponse(
            task_id=task.id,
            status=task.state,
            error=error_details
        )
    elif task.state == 'SUCCESS':
        # The task result is the public URL path (e.g., /static/outputs/filename.png)
        result_path = task.result
        # Prepend the base URL to make it a complete, downloadable URL
        full_url = f"{result_path}"
        return TaskStatusResponse(
            task_id=task.id,
            status=task.state,
            result=full_url
        )
    else:
        # PENDING, STARTED, RETRY, etc.
        return TaskStatusResponse(
            task_id=task.id,
            status=task.state
        )