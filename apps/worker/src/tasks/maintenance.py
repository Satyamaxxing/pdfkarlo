"""Maintenance tasks: Active ephemeral data retention cleanup & scratch purging."""

import glob
import os
import tempfile
from datetime import datetime, timezone
import structlog
from celery import shared_task
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, selectinload

from apps.api.src.core.config import settings
from apps.api.src.db.models import Job, JobFile, DownloadToken
from apps.api.src.services.storage import storage_service

logger = structlog.get_logger()

# Synchronous engine for Celery worker maintenance tasks
# Converts asyncpg/aiosqlite URI to standard sync driver if needed
sync_db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://").replace("sqlite+aiosqlite://", "sqlite://")
sync_engine = None

def get_sync_engine():
    global sync_engine
    if sync_engine is None:
        sync_engine = create_engine(sync_db_url, pool_pre_ping=True)
    return sync_engine


@shared_task(name="apps.worker.src.tasks.maintenance.cleanup_expired_jobs")
def cleanup_expired_jobs():
    """
    Active retention sweeper executed every 10 minutes by Celery Beat.
    Identifies jobs where expires_at <= now, deletes associated S3 objects,
    removes temporary worker scratch files, and transitions job status to EXPIRED.
    """
    now = datetime.now(timezone.utc)
    purged_jobs_count = 0
    deleted_files_count = 0

    try:
        engine = get_sync_engine()
        with Session(engine) as session:
            # Query expired jobs that are not yet marked EXPIRED
            stmt = (
                select(Job)
                .options(selectinload(Job.files))
                .where(Job.expires_at <= now)
                .where(Job.status != "EXPIRED")
                .limit(100)  # Batch size to bound execution time
            )
            expired_jobs = session.scalars(stmt).all()

            for job in expired_jobs:
                # 1. Delete associated S3 objects
                for f in job.files:
                    try:
                        storage_service.delete_object(bucket=f.s3_bucket, key=f.s3_key)
                        deleted_files_count += 1
                    except Exception as err:
                        logger.error(
                            "Failed to delete S3 file during retention cleanup",
                            job_id=str(job.id),
                            bucket=f.s3_bucket,
                            key=f.s3_key,
                            error=str(err),
                        )

                # 2. Delete worker scratch files matching job ID in temp dir
                tmp_dir = tempfile.gettempdir()
                pattern = os.path.join(tmp_dir, f"*{job.id}*")
                for scratch_file in glob.glob(pattern):
                    try:
                        if os.path.isfile(scratch_file):
                            os.remove(scratch_file)
                    except OSError:
                        pass

                # 3. Mark job as EXPIRED
                job.status = "EXPIRED"
                purged_jobs_count += 1

            session.commit()

        logger.info(
            "Completed ephemeral retention sweep",
            expired_jobs_purged=purged_jobs_count,
            files_deleted=deleted_files_count,
            timestamp=now.isoformat(),
        )

        return {
            "status": "success",
            "expired_jobs_purged": purged_jobs_count,
            "files_deleted": deleted_files_count,
            "timestamp": now.isoformat(),
        }

    except Exception as exc:
        logger.error("Error during retention sweep execution", error=str(exc))
        return {
            "status": "error",
            "error": str(exc),
        }
