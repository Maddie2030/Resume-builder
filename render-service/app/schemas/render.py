#render-service/app/schemas/render.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from uuid import UUID


# What the frontend sends (one entry per block)
class TextBlockRequest(BaseModel):
    title: str  # This is the block ID from frontend
    user_text: str
    type: Optional[str] = None  # Block type (TITLE, DETAILS, etc.)
    
    # Position and dimensions (always provided by frontend after drag/resize)
    x: int
    y: int
    width: int
    height: int
    
    # Styling properties
    font_size: int
    color: str
    font_path: Optional[str] = None
    bold: bool = False
    italic: bool = False
    max_width: int


class ImageRenderRequest(BaseModel):
    template_id: str  # Changed from UUID to str to match frontend
    text_data: List[TextBlockRequest]


class ImageRenderResponse(BaseModel):
    image_url: str


class PDFRenderResponse(BaseModel):
    pdf_url: str


# Response for async job processing
class JobResponse(BaseModel):
    job_id: str
    status: str


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    output_url: Optional[str] = None
    error_message: Optional[str] = None


# What we receive from the template-service
class TemplateServiceTextBlock(BaseModel):
    title: str
    x: int
    y: int
    width: int
    height: int
    font_size: int
    color: str
    font_path: Optional[str] = None
    bold: Optional[bool] = False
    italic: Optional[bool] = False
    max_width: Optional[int] = None
    default_text: str = ""


class TemplateServiceResponse(BaseModel):
    id: UUID = Field(alias="_id")
    name: Optional[str] = None  # Added template name
    image_path: str
    text_blocks: List[TemplateServiceTextBlock]

    model_config = ConfigDict(
        populate_by_name=True,
        validate_by_name=True,
        json_encoders={UUID: str}
    )
