"""Celery worker configuration and task routing for PDF Processing Platform."""

import os
from celery import Celery

# Redis connection URL from environment or settings
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "pdf_platform_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "apps.worker.src.tasks.maintenance",
        "apps.worker.src.tasks.operations",
    ],
)

# Celery Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes hard timeout
    task_soft_time_limit=240,  # 4 minutes soft timeout
    worker_concurrency=4,
    worker_prefetch_multiplier=1,  # Prevent worker starving on long PDF tasks
    worker_max_tasks_per_child=100,  # Prevent memory leaks from PDF C-bindings
    
    # Celery Beat Scheduled Tasks
    beat_schedule={
        "cleanup-expired-files-every-10-mins": {
            "task": "apps.worker.src.tasks.maintenance.cleanup_expired_jobs",
            "schedule": 600.0,  # Runs every 10 minutes (600s)
        },
    },
)

if __name__ == "__main__":
    celery_app.start()
