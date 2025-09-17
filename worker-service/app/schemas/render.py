# worker-service/app/schemas/render.py

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
    """The complete payload for the image rendering request."""
    template_id: str  # Changed from UUID to str to match frontend
    text_data: List[TextBlockRequest]

class ImageRenderResponse(BaseModel):
    """Schema for a successful response after image generation."""
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

# What we receive from the template-service - FIXED to match actual template service schema
class TemplateServiceTextBlock(BaseModel):
    x: int
    y: int
    width: float  # Template service uses float
    height: float  # Template service uses float
    font_size: int
    color: str
    text_align: Optional[str] = "left"
    font_weight: Optional[str] = "normal"
    font_style: Optional[str] = "normal"
    content: Optional[str] = None
    default_text: Optional[str] = None

class TemplateServiceResponse(BaseModel):
    id: UUID = Field(alias="_id")
    name: str
    image_path: str
    text_blocks: List[TemplateServiceTextBlock]
    category: Optional[str] = "General"
    downloads: Optional[int] = 0
    rating: Optional[float] = 0.0

    model_config = ConfigDict(
        populate_by_name=True,
        validate_by_name=True,
        json_encoders={UUID: str}
    )
