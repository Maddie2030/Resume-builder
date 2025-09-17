# app/database/base.py

from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Ensure models are registered for Alembic
from app.models import user  # noqa

