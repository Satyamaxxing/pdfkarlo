"""Job management endpoints: creation, file ingestion, status inspection."""

import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from apps.api.src.core.config import settings
from apps.api.src.core.security import (
    calculate_sha256,
    hash_ip,
    validate_file_signature,
)
from apps.api.src.core.rate_limit import rate_limit_jobs
from apps.api.src.db.models import Job, JobFile
from apps.api.src.db.session import get_db
from apps.api.src.schemas.job import (
    JobCreateRequest,
    JobFileMetadata,
    JobOperation,
    JobResponse,
    JobStatus,
    JobStatusResponse,
)
from apps.api.src.services.storage import storage_service

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(rate_limit_jobs)])
async def create_job(
    request: Request,
    operation: JobOperation = Form(...),
    options: Optional[str] = Form(default="{}"),
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new PDF processing job with uploaded input files.
    Enforces strict magic byte validation, file size limits, and ephemeral retention deadline.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one input file must be provided.",
        )

    if operation == JobOperation.MERGE and len(files) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Merge operation requires at least two input PDF files.",
        )

    if operation == JobOperation.SPLIT and len(files) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Split operation requires exactly one input PDF file.",
        )

    if operation == JobOperation.ROTATE and len(files) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rotate operation requires exactly one input PDF file.",
        )

    if operation == JobOperation.REORDER and len(files) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reorder operation requires exactly one input PDF file.",
        )

    if operation == JobOperation.REMOVE and len(files) != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Remove operation requires exactly one input PDF file.",
        )

    try:
        parsed_options = json.loads(options) if options else {}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON format for options field.",
        )

    # Determine expected format based on operation
    expected_type = "pdf"
    if operation == JobOperation.JPG_TO_PDF:
        expected_type = "jpg"

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=settings.RETENTION_HOURS)
    client_ip = request.client.host if request.client else None
    client_hash = hash_ip(client_ip)

    new_job = Job(
        id=uuid.uuid4(),
        operation=operation.value,
        status=JobStatus.PENDING.value,
        client_ip_hash=client_hash,
        options_json=parsed_options,
        created_at=now,
        expires_at=expires_at,
    )
    db.add(new_job)

    # Process and upload input files
    for file in files:
        content = await file.read()
        file_size = len(content)

        if file_size > settings.MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File '{file.filename}' exceeds maximum allowed size ({settings.MAX_FILE_SIZE_BYTES // (1024*1024)}MB).",
            )

        # Magic byte signature check
        is_valid, detected_mime = validate_file_signature(content, expected_type)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File validation failed for '{file.filename}': {detected_mime}",
            )

        sha256 = calculate_sha256(content)
        file_id = uuid.uuid4()
        s3_key = f"jobs/{new_job.id}/input/{file_id}_{file.filename}"

        # Upload to staging bucket
        storage_service.upload_bytes(
            bucket=settings.S3_RAW_BUCKET,
            key=s3_key,
            data=content,
            content_type=detected_mime,
        )

        job_file = JobFile(
            id=file_id,
            job_id=new_job.id,
            file_role="INPUT",
            s3_bucket=settings.S3_RAW_BUCKET,
            s3_key=s3_key,
            filename_original=file.filename or f"upload_{file_id}",
            file_size_bytes=file_size,
            mime_type=detected_mime,
            sha256_hash=sha256,
            created_at=now,
        )
        db.add(job_file)

    await db.commit()
    await db.refresh(new_job)

    # Dispatch or execute operation
    if operation == JobOperation.MERGE:
        if settings.ENVIRONMENT in ("development", "test"):
            from apps.worker.src.tasks.operations import execute_merge_job_async
            await execute_merge_job_async(new_job.id, db)
            await db.refresh(new_job)
        else:
            try:
                from apps.worker.src.tasks.operations import process_merge_job
                process_merge_job.delay(str(new_job.id))
            except Exception:
                from apps.worker.src.tasks.operations import execute_merge_job_async
                await execute_merge_job_async(new_job.id, db)
                await db.refresh(new_job)

    elif operation == JobOperation.SPLIT:
        if settings.ENVIRONMENT in ("development", "test"):
            from apps.worker.src.tasks.operations import execute_split_job_async
            await execute_split_job_async(new_job.id, db)
            await db.refresh(new_job)
        else:
            try:
                from apps.worker.src.tasks.operations import process_split_job
                process_split_job.delay(str(new_job.id))
            except Exception:
                from apps.worker.src.tasks.operations import execute_split_job_async
                await execute_split_job_async(new_job.id, db)
                await db.refresh(new_job)

    elif operation == JobOperation.ROTATE:
        if settings.ENVIRONMENT in ("development", "test"):
            from apps.worker.src.tasks.operations import execute_rotate_job_async
            await execute_rotate_job_async(new_job.id, db)
            await db.refresh(new_job)
        else:
            try:
                from apps.worker.src.tasks.operations import process_rotate_job
                process_rotate_job.delay(str(new_job.id))
            except Exception:
                from apps.worker.src.tasks.operations import execute_rotate_job_async
                await execute_rotate_job_async(new_job.id, db)
                await db.refresh(new_job)

    elif operation == JobOperation.REORDER:
        if settings.ENVIRONMENT in ("development", "test"):
            from apps.worker.src.tasks.operations import execute_reorder_job_async
            await execute_reorder_job_async(new_job.id, db)
            await db.refresh(new_job)
        else:
            try:
                from apps.worker.src.tasks.operations import process_reorder_job
                process_reorder_job.delay(str(new_job.id))
            except Exception:
                from apps.worker.src.tasks.operations import execute_reorder_job_async
                await execute_reorder_job_async(new_job.id, db)
                await db.refresh(new_job)

    elif operation == JobOperation.REMOVE:
        if settings.ENVIRONMENT in ("development", "test"):
            from apps.worker.src.tasks.operations import execute_remove_job_async
            await execute_remove_job_async(new_job.id, db)
            await db.refresh(new_job)
        else:
            try:
                from apps.worker.src.tasks.operations import process_remove_job
                process_remove_job.delay(str(new_job.id))
            except Exception:
                from apps.worker.src.tasks.operations import execute_remove_job_async
                await execute_remove_job_async(new_job.id, db)
                await db.refresh(new_job)

    return JobResponse(
        job_id=new_job.id,
        operation=new_job.operation,
        status=new_job.status,
        created_at=new_job.created_at,
        expires_at=new_job.expires_at,
    )


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_job_status(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve job processing status, progress percentage, error status, or download tokens.
    """
    stmt = (
        select(Job)
        .options(selectinload(Job.files), selectinload(Job.download_tokens))
        .where(Job.id == job_id)
    )
    result = await db.execute(stmt)
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job '{job_id}' not found.",
        )

    # Check for expired job
    now = datetime.now(timezone.utc)
    job_expires = job.expires_at.replace(tzinfo=timezone.utc) if job.expires_at.tzinfo is None else job.expires_at
    if job_expires <= now and job.status != JobStatus.EXPIRED.value:
        job.status = JobStatus.EXPIRED.value
        await db.commit()

    # Map file_id to download token
    token_by_file_id = {}
    zip_token = None
    if job.download_tokens:
        for t in job.download_tokens:
            t_expires = t.expires_at.replace(tzinfo=timezone.utc) if t.expires_at.tzinfo is None else t.expires_at
            if not t.is_revoked and t_expires > now:
                if t.file_id:
                    token_by_file_id[t.file_id] = t.token

    output_files = []
    first_token = None

    for f in job.files:
        if f.file_role == "OUTPUT":
            f_token = token_by_file_id.get(f.id)
            f_url = f"{settings.API_V1_STR}/downloads/{f_token}" if f_token else None
            meta = JobFileMetadata.model_validate(f)
            meta.download_token = f_token
            meta.download_url = f_url
            output_files.append(meta)

            if f.mime_type == "application/zip":
                zip_token = f_token
            elif first_token is None:
                first_token = f_token

    primary_token = zip_token or first_token
    active_token = primary_token
    download_url = f"{settings.API_V1_STR}/downloads/{primary_token}" if primary_token else None

    progress = 0
    if job.status == JobStatus.COMPLETED.value:
        progress = 100
    elif job.status == JobStatus.PROCESSING.value:
        progress = 50
    elif job.status == JobStatus.PENDING.value:
        progress = 10

    return JobStatusResponse(
        job_id=job.id,
        operation=job.operation,
        status=job.status,
        progress_percent=progress,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
        expires_at=job.expires_at,
        error_code=job.error_code,
        error_message=job.error_message,
        download_token=active_token,
        download_url=download_url,
        output_files=output_files,
    )
