# render-service/app/celery_app.py

from celery import Celery
from dotenv import load_dotenv
import os

load_dotenv()

# The same broker URL should be used as in the worker service
REDIS_URI = os.getenv("REDIS_URI", "redis://redis:6379/0")

celery_app = Celery(
    'render_service',
    broker=REDIS_URI,
    backend=REDIS_URI
)

celery_app.conf.update(
    task_default_queue='render_queue',
    task_routes={
        'render.tasks.*': {'queue': 'render_queue'}
    }
)