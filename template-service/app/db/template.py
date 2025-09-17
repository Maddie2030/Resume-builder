# Template-service/app/db/template.py

from uuid import UUID, uuid4
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from bson.binary import Binary, UuidRepresentation

from ..schemas.template import TemplateDB, TemplateCreate

TEMPLATES_COLLECTION = "templates"

async def create_template(db: AsyncIOMotorClient, template: TemplateCreate) -> TemplateDB:
    template_with_id = TemplateDB(
        id=uuid4(),
        name=template.name,
        image_path=template.image_path,
        text_blocks=template.text_blocks
    )

    template_dict = template_with_id.model_dump(by_alias=True)
    template_dict['_id'] = Binary.from_uuid(template_with_id.id, UuidRepresentation.STANDARD)

    result = await db[TEMPLATES_COLLECTION].insert_one(template_dict)
    if not result.acknowledged:
        raise RuntimeError("Failed to insert document into database.")

    new_template = await db[TEMPLATES_COLLECTION].find_one({"_id": template_dict['_id']})
    if not new_template:
        raise ValueError("Failed to retrieve newly created template.")

    return TemplateDB(**new_template)

async def get_template(db: AsyncIOMotorClient, template_id: UUID) -> Optional[TemplateDB]:
    binary_id = Binary.from_uuid(template_id, UuidRepresentation.STANDARD)
    template = await db[TEMPLATES_COLLECTION].find_one({"_id": binary_id})
    if template:
        return TemplateDB(**template)
    return None

async def get_all_templates(db: AsyncIOMotorClient) -> List[TemplateDB]:
    templates = await db[TEMPLATES_COLLECTION].find().to_list(1000)
    return [TemplateDB(**template) for template in templates]