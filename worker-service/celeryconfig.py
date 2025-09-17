# worker-service/celeryconfig.py

import os

REDIS_URI = os.getenv("REDIS_URI", "redis://redis:6379/0")

broker_url = REDIS_URI

result_backend = REDIS_URI

task_default_queue = 'render_queue'

task_routes = {
    'render.tasks.*': {'queue': 'render_queue'}
}

broker_connection_retry_on_startup = True

worker_log_format = "[%(asctime)s: %(levelname)s/%(processName)s] %(message)s"
worker_task_log_format = "[%(asctime)s: %(levelname)s/%(processName)s] %(task_name)s[%(task_id)s]: %(message)s"