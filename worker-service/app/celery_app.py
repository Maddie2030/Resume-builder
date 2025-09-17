# worker-service/app/celery_app.py

from celery import Celery
from dotenv import load_dotenv

load_dotenv()

celery_app = Celery('worker_service')

celery_app.config_from_object('celeryconfig')

celery_app.autodiscover_tasks(['app.tasks'])