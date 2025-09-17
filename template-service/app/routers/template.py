# Template-service/app/routers/template.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Annotated
import os
from uuid import uuid4
from motor.motor_asyncio import AsyncIOMotorClient
from json import loads
from uuid import UUID
from ..schemas.template import TemplateCreate, TemplateDB, TextBlock
from ..db.mongodb import get_database
from ..db.template import create_template, get_all_templates, get_template

router = APIRouter(prefix="/templates", tags=["Templates"])

STATIC_DIR = "/app/static/backgrounds"
os.makedirs(STATIC_DIR, exist_ok=True)

def get_db_client():
    return get_database()

@router.get("/templates", response_model=List[TemplateDB])
async def get_all_templates_endpoint(
    db: Annotated[AsyncIOMotorClient, Depends(get_db_client)],
):
    return await get_all_templates(db)

@router.get("/{template_id}", response_model=TemplateDB)
async def get_template_by_id(
    template_id: str,
    db: Annotated[AsyncIOMotorClient, Depends(get_db_client)],
):
    try:
        template_uuid = UUID(template_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format for template_id")

    result = await get_template(db, template_uuid)
    if not result:
        raise HTTPException(status_code=404, detail="Template not found")
    return result

@router.post("/upload", response_model=TemplateDB, status_code=status.HTTP_201_CREATED)
async def upload_template_endpoint(
    db: Annotated[AsyncIOMotorClient, Depends(get_db_client)],
    name: Annotated[str, Form()],
    text_blocks_json: Annotated[str, Form()],
    image: Annotated[UploadFile, File()]
):
    allowed_formats = ["image/jpeg", "image/png"]
    if image.content_type not in allowed_formats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Only JPEG and PNG are allowed."
        )

    file_extension = image.filename.split(".")[-1]
    unique_filename = f"{uuid4()}.{file_extension}"
    image_path_on_disk = os.path.join(STATIC_DIR, unique_filename)

    try:
        file_content = await image.read()
        with open(image_path_on_disk, "wb") as buffer:
            buffer.write(file_content)
        image_path_for_db = f"/static/backgrounds/{unique_filename}"
    except Exception as e:
        if os.path.exists(image_path_on_disk):
            os.remove(image_path_on_disk)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image: {str(e)}"
        )

    try:
        text_blocks_data = [TextBlock(**tb) for tb in loads(text_blocks_json)]
    except Exception as e:
        if os.path.exists(image_path_on_disk):
            os.remove(image_path_on_disk)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid template metadata format: {str(e)}"
        )

    try:
        template_in_db = TemplateCreate(
            name=name,
            image_path=image_path_for_db,
            text_blocks=text_blocks_data
        )
        new_template = await create_template(db, template_in_db)
        if not new_template:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Template creation failed unexpectedly."
            )
        return new_template
    except Exception as e:
        if os.path.exists(image_path_on_disk):
            os.remove(image_path_on_disk)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save template to database: {str(e)}"
        )