# Template-service/app/schemas/template.py

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from uuid import UUID, uuid4

class TextBlock(BaseModel):
    x: int
    y: int
    width: float
    height: float
    font_size: int
    color: str
    text_align: Optional[str] = "left"
    font_weight: Optional[str] = "normal"
    font_style: Optional[str] = "normal"
    content: Optional[str] = None
    default_text: Optional[str] = None

class TemplateBase(BaseModel):
    name: str
    image_path: str
    text_blocks: List[TextBlock]
    category: Optional[str] = "Modern"
    downloads: Optional[int] = 15
    rating: Optional[float] = 3.0

class TemplateCreate(TemplateBase):
    pass

class TemplateDB(TemplateBase):
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={UUID: str},
        validate_by_name=True
    )
    id: UUID = Field(alias="_id", default_factory=uuid4)