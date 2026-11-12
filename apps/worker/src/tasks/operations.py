"""Worker tasks for PDF processing operations."""

import io
import uuid
from datetime import datetime, timezone
import structlog
from celery import shared_task
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.src.core.config import settings
from apps.api.src.core.security import calculate_sha256
from apps.api.src.db.models import Job, JobFile, DownloadToken
from apps.api.src.services.storage import storage_service
from apps.api.src.services.token_service import token_service
from apps.worker.src.engine.merge import (
    merge_pdf_documents,
    PdfEngineError,
    PdfEncryptionError,
    PdfCorruptionError,
)
from apps.worker.src.engine.split import (
    split_pdf_document,
    SplitMode,
    SplitValidationError,
)
from apps.worker.src.engine.rotate import (
    rotate_pdf_document,
    RotateValidationError,
)
from apps.worker.src.engine.reorder import (
    reorder_pdf_document,
    ReorderValidationError,
)
from apps.worker.src.engine.remove import (
    remove_pdf_pages,
    RemoveValidationError,
)
from apps.worker.src.tasks.maintenance import get_sync_engine

logger = structlog.get_logger()


def run_merge_job(job_id_str: str) -> dict:
    """
    Core execution logic for a merge PDF job.
    Can be called synchronously or within an asynchronous Celery task.
    """
    job_uuid = uuid.UUID(job_id_str)
    engine = get_sync_engine()
    now = datetime.now(timezone.utc)

    with Session(engine) as session:
        stmt = (
            select(Job)
            .options(selectinload(Job.files))
            .where(Job.id == job_uuid)
        )
        job = session.scalars(stmt).one_or_none()
        if not job:
            logger.error("Job not found for merge execution", job_id=job_id_str)
            return {"status": "error", "message": f"Job {job_id_str} not found"}

        # 1. Update status to PROCESSING
        job.status = "PROCESSING"
        job.started_at = now
        session.commit()

        try:
            # 2. Extract and order input files
            input_files = [f for f in job.files if f.file_role == "INPUT"]
            if len(input_files) < 2:
                raise PdfEngineError("At least two input files are required to merge.")

            # Respect user-specified ordering in options
            options = job.options_json or {}
            custom_order = options.get("file_order", [])

            if custom_order:
                # Order by match with custom_order list (matching by original filename or ID)
                def sort_key(f):
                    f_id_str = str(f.id)
                    if f_id_str in custom_order:
                        return custom_order.index(f_id_str)
                    if f.filename_original in custom_order:
                        return custom_order.index(f.filename_original)
                    return 999
                input_files.sort(key=sort_key)

            # 3. Fetch binary streams from S3
            pdf_bytes_list = []
            for f in input_files:
                file_bytes = storage_service.download_bytes(bucket=f.s3_bucket, key=f.s3_key)
                pdf_bytes_list.append(file_bytes)

            # 4. Execute pikepdf merge
            merged_bytes = merge_pdf_documents(pdf_bytes_list, options=options)
            merged_size = len(merged_bytes)
            merged_hash = calculate_sha256(merged_bytes)

            # 5. Upload output artifact to S3
            output_file_id = uuid.uuid4()
            output_filename = options.get("output_filename", f"merged_{job_id_str[:8]}.pdf")
            if not output_filename.endswith(".pdf"):
                output_filename += ".pdf"

            output_key = f"jobs/{job_id_str}/output/{output_file_id}_{output_filename}"
            storage_service.upload_bytes(
                bucket=settings.S3_ARTIFACT_BUCKET,
                key=output_key,
                data=merged_bytes,
                content_type="application/pdf",
            )

            # 6. Record output JobFile
            output_file = JobFile(
                id=output_file_id,
                job_id=job.id,
                file_role="OUTPUT",
                s3_bucket=settings.S3_ARTIFACT_BUCKET,
                s3_key=output_key,
                filename_original=output_filename,
                file_size_bytes=merged_size,
                mime_type="application/pdf",
                sha256_hash=merged_hash,
                created_at=datetime.now(timezone.utc),
            )
            session.add(output_file)

            # 7. Generate Leased Download Token
            # Sync generation using token_service
            import asyncio
            token_str = asyncio.run(
                token_service.create_download_token(
                    job_id=job_id_str,
                    file_id=str(output_file_id),
                    s3_bucket=settings.S3_ARTIFACT_BUCKET,
                    s3_key=output_key,
                    filename=output_filename,
                    ttl_seconds=settings.DOWNLOAD_TOKEN_TTL_SECONDS,
                    lease_window_seconds=settings.DOWNLOAD_LEASE_WINDOW_SECONDS,
                    max_retries=3,
                )
            )

            token_record = DownloadToken(
                id=uuid.uuid4(),
                token=token_str,
                job_id=job.id,
                file_id=output_file_id,
                created_at=datetime.now(timezone.utc),
                expires_at=job.expires_at,
                retry_count=0,
                max_retries=3,
                is_revoked=False,
            )
            session.add(token_record)

            # 8. Mark Job as COMPLETED
            job.status = "COMPLETED"
            job.completed_at = datetime.now(timezone.utc)
            session.commit()

            logger.info(
                "Merge job completed successfully",
                job_id=job_id_str,
                output_file=output_filename,
                output_size=merged_size,
            )
            return {
                "status": "success",
                "job_id": job_id_str,
                "output_file": output_filename,
                "token": token_str,
            }

        except PdfEncryptionError as exc:
            logger.warn("Merge job failed due to encrypted input", job_id=job_id_str, error=str(exc))
            job.status = "FAILED"
            job.error_code = "PDF_ENCRYPTED"
            job.error_message = str(exc)
            session.commit()
            return {"status": "error", "error_code": "PDF_ENCRYPTED", "message": str(exc)}

        except (PdfCorruptionError, PdfEngineError) as exc:
            logger.warn("Merge job failed due to corrupt input", job_id=job_id_str, error=str(exc))
            job.status = "FAILED"
            job.error_code = "PDF_CORRUPTED"
            job.error_message = str(exc)
            session.commit()
            return {"status": "error", "error_code": "PDF_CORRUPTED", "message": str(exc)}

        except Exception as exc:
            logger.error("Merge job unhandled error", job_id=job_id_str, error=str(exc))
            job.status = "FAILED"
            job.error_code = "PROCESSING_FAILED"
            job.error_message = f"An unexpected error occurred during processing: {str(exc)}"
            session.commit()
            return {"status": "error", "error_code": "PROCESSING_FAILED", "message": str(exc)}


@shared_task(name="apps.worker.src.tasks.operations.process_merge_job")
def process_merge_job(job_id_str: str):
    """Celery task entrypoint for merge operations."""
    return run_merge_job(job_id_str)


async def execute_merge_job_async(job_uuid: uuid.UUID, session: AsyncSession) -> dict:
    """Asynchronous execution of merge job, compatible with FastAPI AsyncSession."""
    now = datetime.now(timezone.utc)
    stmt = (
        select(Job)
        .options(selectinload(Job.files))
        .where(Job.id == job_uuid)
    )
    result = await session.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        return {"status": "error", "message": f"Job {job_uuid} not found"}

    job.status = "PROCESSING"
    job.started_at = now
    await session.commit()

    try:
        input_files = [f for f in job.files if f.file_role == "INPUT"]
        if len(input_files) < 2:
            raise PdfEngineError("At least two input files are required to merge.")

        options = job.options_json or {}
        custom_order = options.get("file_order", [])
        if custom_order:
            def sort_key(f):
                f_id_str = str(f.id)
                if f_id_str in custom_order:
                    return custom_order.index(f_id_str)
                if f.filename_original in custom_order:
                    return custom_order.index(f.filename_original)
                return 999
            input_files.sort(key=sort_key)

        pdf_bytes_list = []
        for f in input_files:
            file_bytes = storage_service.download_bytes(bucket=f.s3_bucket, key=f.s3_key)
            pdf_bytes_list.append(file_bytes)

        merged_bytes = merge_pdf_documents(pdf_bytes_list, options=options)
        merged_size = len(merged_bytes)
        merged_hash = calculate_sha256(merged_bytes)

        output_file_id = uuid.uuid4()
        output_filename = options.get("output_filename", f"merged_{str(job_uuid)[:8]}.pdf")
        if not output_filename.endswith(".pdf"):
            output_filename += ".pdf"

        output_key = f"jobs/{str(job_uuid)}/output/{output_file_id}_{output_filename}"
        storage_service.upload_bytes(
            bucket=settings.S3_ARTIFACT_BUCKET,
            key=output_key,
            data=merged_bytes,
            content_type="application/pdf",
        )

        output_file = JobFile(
            id=output_file_id,
            job_id=job.id,
            file_role="OUTPUT",
            s3_bucket=settings.S3_ARTIFACT_BUCKET,
            s3_key=output_key,
            filename_original=output_filename,
            file_size_bytes=merged_size,
            mime_type="application/pdf",
            sha256_hash=merged_hash,
            created_at=datetime.now(timezone.utc),
        )
        session.add(output_file)

        token_str = await token_service.create_download_token(
            job_id=str(job_uuid),
            file_id=str(output_file_id),
            s3_bucket=settings.S3_ARTIFACT_BUCKET,
            s3_key=output_key,
            filename=output_filename,
            ttl_seconds=settings.DOWNLOAD_TOKEN_TTL_SECONDS,
            lease_window_seconds=settings.DOWNLOAD_LEASE_WINDOW_SECONDS,
            max_retries=3,
        )

        token_record = DownloadToken(
            id=uuid.uuid4(),
            token=token_str,
            job_id=job.id,
            file_id=output_file_id,
            created_at=datetime.now(timezone.utc),
            expires_at=job.expires_at,
            retry_count=0,
            max_retries=3,
            is_revoked=False,
        )
        session.add(token_record)

        job.status = "COMPLETED"
        job.completed_at = datetime.now(timezone.utc)
        await session.commit()
        return {"status": "success", "job_id": str(job_uuid), "output_file": output_filename, "token": token_str}

    except PdfEncryptionError as exc:
        job.status = "FAILED"
        job.error_code = "PDF_ENCRYPTED"
        job.error_message = str(exc)
        await session.commit()
        return {"status": "error", "error_code": "PDF_ENCRYPTED", "message": str(exc)}
    except (PdfCorruptionError, PdfEngineError) as exc:
        job.status = "FAILED"
        job.error_code = "PDF_CORRUPTED"
        job.error_message = str(exc)
        await session.commit()
        return {"status": "error", "error_code": "PDF_CORRUPTED", "message": str(exc)}
    except Exception as exc:
        job.status = "FAILED"
        job.error_code = "PROCESSING_FAILED"
        job.error_message = f"An unexpected error occurred during processing: {str(exc)}"
        await session.commit()
        return {"status": "error", "error_code": "PROCESSING_FAILED", "message": str(exc)}




def run_split_job(job_id_str: str) -> dict:
    """Core execution logic for a split PDF job."""
    job_uuid = uuid.UUID(job_id_str)
    engine = get_sync_engine()
    now = datetime.now(timezone.utc)

    with Session(engine) as session:
        stmt = (
            select(Job)
            .options(selectinload(Job.files))
            .where(Job.id == job_uuid)
        )
        job = session.scalars(stmt).one_or_none()
        if not job:
            return {"status": "error", "message": f"Job {job_id_str} not found"}

        job.status = "PROCESSING"
        job.started_at = now
        session.commit()

        try:
            input_files = [f for f in job.files if f.file_role == "INPUT"]
            if len(input_files) != 1:
                raise PdfEngineError("Split operation requires exactly one input PDF file.")

            input_file = input_files[0]
            file_bytes = storage_service.download_bytes(bucket=input_file.s3_bucket, key=input_file.s3_key)

            options = job.options_json or {}
            mode = options.get("mode", "range")
            if "base_filename" not in options:
                options["base_filename"] = input_file.filename_original

            generated = split_pdf_document(file_bytes, mode=mode, options=options)

            import asyncio
            primary_token = None

            for item in generated:
                out_file_id = uuid.uuid4()
                filename = str(item["filename"])
                is_zip = bool(item.get("is_zip", False))
                mime_type = "application/zip" if is_zip else "application/pdf"
                out_bytes = bytes(item["bytes"])

                s3_key = f"jobs/{job_id_str}/output/{out_file_id}_{filename}"
                storage_service.upload_bytes(
                    bucket=settings.S3_ARTIFACT_BUCKET,
                    key=s3_key,
                    data=out_bytes,
                    content_type=mime_type,
                )

                output_file = JobFile(
                    id=out_file_id,
                    job_id=job.id,
                    file_role="OUTPUT",
                    s3_bucket=settings.S3_ARTIFACT_BUCKET,
                    s3_key=s3_key,
                    filename_original=filename,
                    file_size_bytes=len(out_bytes),
                    mime_type=mime_type,
                    sha256_hash=calculate_sha256(out_bytes),
                    created_at=datetime.now(timezone.utc),
                )
                session.add(output_file)

                token_str = asyncio.run(
                    token_service.create_download_token(
                        job_id=job_id_str,
                        file_id=str(out_file_id),
                        s3_bucket=settings.S3_ARTIFACT_BUCKET,
                        s3_key=s3_key,
                        filename=filename,
                        ttl_seconds=settings.DOWNLOAD_TOKEN_TTL_SECONDS,
                        lease_window_seconds=settings.DOWNLOAD_LEASE_WINDOW_SECONDS,
                        max_retries=3,
                    )
                )

                token_record = DownloadToken(
                    id=uuid.uuid4(),
                    token=token_str,
                    job_id=job.id,
                    file_id=out_file_id,
                    created_at=datetime.now(timezone.utc),
                    expires_at=job.expires_at,
                    retry_count=0,
                    max_retries=3,
                    is_revoked=False,
                )
                session.add(token_record)

                if is_zip or primary_token is None:
                    primary_token = token_str

            job.status = "COMPLETED"
            job.completed_at = datetime.now(timezone.utc)
            session.commit()

            return {
                "status": "success",
                "job_id": job_id_str,
                "output_count": len(generated),
                "primary_token": primary_token,
            }

        except PdfEncryptionError as exc:
            job.status = "FAILED"
            job.error_code = "PDF_ENCRYPTED"
            job.error_message = str(exc)
            session.commit()
            return {"status": "error", "error_code": "PDF_ENCRYPTED", "message": str(exc)}
        except (PdfCorruptionError, SplitValidationError, PdfEngineError) as exc:
            job.status = "FAILED"
            job.error_code = "SPLIT_VALIDATION_ERROR" if isinstance(exc, SplitValidationError) else "PDF_CORRUPTED"
            job.error_message = str(exc)
            session.commit()
            return {"status": "error", "error_code": job.error_code, "message": str(exc)}
        except Exception as exc:
            job.status = "FAILED"
            job.error_code = "PROCESSING_FAILED"
            job.error_message = f"An unexpected error occurred during processing: {str(exc)}"
            session.commit()
            return {"status": "error", "error_code": "PROCESSING_FAILED", "message": str(exc)}


@shared_task(name="apps.worker.src.tasks.operations.process_split_job")
def process_split_job(job_id_str: str):
    """Celery task entrypoint for split operations."""
    return run_split_job(job_id_str)


async def execute_split_job_async(job_uuid: uuid.UUID, session: AsyncSession) -> dict:
    """Asynchronous execution of split job for FastAPI AsyncSession."""
    now = datetime.now(timezone.utc)
    stmt = (
        select(Job)
        .options(selectinload(Job.files))
        .where(Job.id == job_uuid)
    )
    result = await session.execute(stmt)
    job = result.scalar_one_or_none()
    if not job:
        return {"status": "error", "message": f"Job {job_uuid} not found"}

    job.status = "PROCESSING"
    job.started_at = now
    await session.commit()

    try:
        input_files = [f for f in job.files if f.file_role == "INPUT"]
        if len(input_files) != 1:
            raise PdfEngineError("Split operation requires exactly one input PDF file.")

        input_file = input_files[0]
        file_bytes = storage_service.download_bytes(bucket=input_file.s3_bucket, key=input_file.s3_key)

        options = job.options_json or {}
        mode = options.get("mode", "range")
        if "base_filename" not in options:
            options["base_filename"] = input_file.filename_original

        generated = split_pdf_document(file_bytes, mode=mode, options=options)
        primary_token = None

        for item in generated:
            out_file_id = uuid.uuid4()
            filename = str(item["filename"])
            is_zip = bool(item.get("is_zip", False))
            mime_type = "application/zip" if is_zip else "application/pdf"
            out_bytes = bytes(item["bytes"])

            s3_key = f"jobs/{str(job_uuid)}/output/{out_file_id}_{filename}"
            storage_service.upload_bytes(
                bucket=settings.S3_ARTIFACT_BUCKET,
                key=s3_key,
                data=out_bytes,
                content_type=mime_type,
            )

            output_file = JobFile(
                id=out_file_id,
                job_id=job.id,
                file_role="OUTPUT",
                s3_bucket=settings.S3_ARTIFACT_BUCKET,
                s3_key=s3_key,
                filename_original=filename,
                file_size_bytes=len(out_bytes),
                mime_type=mime_type,
                sha256_hash=calculate_sha256(out_bytes),
                created_at=datetime.now(timezone.utc),
            )
            session.add(output_file)

            token_str = await token_service.create_download_token(
                job_id=str(job_uuid),
                file_id=str(out_file_id),
                s3_bucket=settings.S3_ARTIFACT_BUCKET,
                s3_key=s3_key,
                filename=filename,
                ttl_seconds=settings.DOWNLOAD_TOKEN_TTL_SECONDS,
                lease_window_seconds=settings.DOWNLOAD_LEASE_WINDOW_SECONDS,
                max_retries=3,
            )

            token_record = DownloadToken(
                id=uuid.uuid4(),
                token=token_str,
                job_id=job.id,
                file_id=out_file_id,
                created_at=datetime.now(timezone.utc),
                expires_at=job.expires_at,
                retry_count=0,
                max_retries=3,
                is_revoked=False,
            )
            session.add(token_record)

            if is_zip or primary_token is None:
                primary_token = token_str

        job.status = "COMPLETED"
        job.completed_at = datetime.now(timezone.utc)
        await session.commit()
        return {
            "status": "success",
            "job_id": str(job_uuid),
            "output_count": len(generated),
            "primary_token": primary_token,
        }

    except PdfEncryptionError as exc:
        job.status = "FAILED"
        job.error_code = "PDF_ENCRYPTED"
        job.error_message = str(exc)
        await session.commit()
        return {"status": "error", "error_code": "PDF_ENCRYPTED", "message": str(exc)}
    except (PdfCorruptionError, SplitValidationError, PdfEngineError) as exc:
        job.status = "FAILED"
        job.error_code = "SPLIT_VALIDATION_ERROR" if isinstance(exc, SplitValidationError) else "PDF_CORRUPTED"
        job.error_message = str(exc)
        await session.commit()
        return {"status": "error", "error_code": job.error_code, "message": str(exc)}
    except Exception as exc:
        job.status = "FAILED"
        job.error_code = "PROCESSING_FAILED"
        job.error_message = f"An unexpected error occurred during processing: {str(exc)}"
        await session.commit()
        return {"status": "error", "error_code": "PROCESSING_FAILED", "message": str(exc)}


def run_rotate_job(job_id_str: str) -> dict:
    """Core execution logic for a rotate PDF job (synchronous / Celery worker)."""
    job_uuid = uuid.UUID(job_id_str)
    engine = get_sync_engine()
    now = datetime.now(timezone.utc)

    with Session(engine) as session:
        stmt = (
            select(Job)
            .options(selectinload(Job.files))
            .where(Job.id == job_uuid)
        )
        job = session.scalars(stmt).one_or_none()
        if not job:
            logger.error("Job not found for rotate execution", job_id=job_id_str)
            return {"status": "error", "message": f"Job {job_id_str} not found"}

        job.status = "PROCESSING"
        job.started_at = now
        session.commit()

        try:
            input_files = [f for f in job.files if f.file_role == "INPUT"]
            if len(input_files) != 1:
                raise RotateValidationError("Rotate operation requires exactly one input PDF file.")

            target_file = input_files[0]
            pdf_bytes = storage_service.download_bytes(
                bucket=target_file.s3_bucket,
                key=target_file.s3_key,
            )

            options = job.options_json or {}
            angle = options.get("angle")
            pages = options.get("pages")
            page_rotations = options.get("page_rotations")
            output_filename = options.get("output_filename", f"rotated_{target_file.filename_original}")

            out_bytes, out_name, total_pages = rotate_pdf_document(
                pdf_bytes=pdf_bytes,
                angle=angle,
                pages=pages,
                page_rotations=page_rotations,
                output_filename=output_filename,
            )

            out_file_id = uuid.uuid4()
            s3_key = f"artifacts/{job_uuid}/{out_file_id}_{out_name}"

            storage_service.upload_bytes(
                bucket=settings.S3_ARTIFACT_BUCKET,
                key=s3_key,
                data=out_bytes,
                content_type="application/pdf",
            )

            output_file = JobFile(
                id=out_file_id,
                job_id=job.id,
                file_role="OUTPUT",
                s3_bucket=settings.S3_ARTIFACT_BUCKET,
                s3_key=s3_key,
                filename_original=out_name,
                file_size_bytes=len(out_bytes),
                mime_type="application/pdf",
                sha256_hash=calculate_sha256(out_bytes),
                created_at=datetime.now(timezone.utc),
            )
            session.add(output_file)

            import asyncio
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            token_str = loop.run_until_complete(
                token_service.create_download_token(
                    job_id=str(job_uuid),
                    file_id=str(out_file_id),
                    s3_bucket=settings.S3_ARTIFACT_BUCKET,
                    s3_key=s3_key,
                    filename=out_name,
                    ttl_seconds=settings.DOWNLOAD_TOKEN_TTL_SECONDS,
                    lease_window_seconds=settings.DOWNLOAD_LEASE_WINDOW_SECONDS,
                    max_retries=3,
                )
            )

            token_record = DownloadToken(
                id=uuid.uuid4(),
                token=token_str,
                job_id=job.id,
                file_id=out_file_id,
                created_at=datetime.now(timezone.utc),
                expires_at=job.expires_at,
                retry_count=0,
                max_retries=3,
                is_revoked=False,
            )
            session.add(token_record)

            job.status = "COMPLETED"
            job.completed_at = datetime.now(timezone.utc)
            session.commit()

            return {
                "status": "success",
                "job_id": str(job_uuid),
                "output_filename": out_name,
                "token": token_str,
            }

        except PdfEncryptionError as exc:
            job.status = "FAILED"
            job.error_code = "PDF_ENCRYPTED"
            job.error_message = str(exc)
            session.commit()
            return {"status": "error", "error_code": "PDF_ENCRYPTED", "message": str(exc)}
        except (PdfCorruptionError, RotateValidationError, PdfEngineError) as exc:
            job.status = "FAILED"
            job.error_code = "ROTATE_VALIDATION_ERROR" if isinstance(exc, RotateValidationError) else "PDF_CORRUPTED"
            job.error_message = str(exc)
            session.commit()
            return {"status": "error", "error_code": job.error_code, "message": str(exc)}
        except Exception as exc:
            job.status = "FAILED"
            job.error_code = "PROCESSING_FAILED"
            job.error_message = f"An unexpected error occurred during processing: {str(exc)}"
            session.commit()
            return {"status": "error", "error_code": "PROCESSING_FAILED", "message": str(exc)}


async def execute_rotate_job_async(job_uuid: uuid.UUID, session: AsyncSession) -> dict:
    """Async in-process execution for Rotate PDF job."""
    stmt = (
        select(Job)
        .options(selectinload(Job.files))
        .where(Job.id == job_uuid)
    )
    res = await session.execute(stmt)
    job = res.scalars().one_or_none()
    if not job:
        return {"status": "error", "message": f"Job {job_uuid} not found"}

    now = datetime.now(timezone.utc)
    job.status = "PROCESSING"
    job.started_at = now
    await session.commit()

    try:
        input_files = [f for f in job.files if f.file_role == "INPUT"]
        if len(input_files) != 1:
            raise RotateValidationError("Rotate operation requires exactly one input PDF file.")

        target_file = input_files[0]
        pdf_bytes = storage_service.download_bytes(
            bucket=target_file.s3_bucket,
            key=target_file.s3_key,
        )

        options = job.options_json or {}
        angle = options.get("angle")
        pages = options.get("pages")
        page_rotations = options.get("page_rotations")
        output_filename = options.get("output_filename", f"rotated_{target_file.filename_original}")

        out_bytes, out_name, total_pages = rotate_pdf_document(
            pdf_bytes=pdf_bytes,
            angle=angle,
            pages=pages,
            page_rotations=page_rotations,
            output_filename=output_filename,
        )

        out_file_id = uuid.uuid4()
        s3_key = f"artifacts/{job_uuid}/{out_file_id}_{out_name}"

        storage_service.upload_bytes(
            bucket=settings.S3_ARTIFACT_BUCKET,
            key=s3_key,
            data=out_bytes,
            content_type="application/pdf",
        )

        output_file = JobFile(
            id=out_file_id,
            job_id=job.id,
            file_role="OUTPUT",
            s3_bucket=settings.S3_ARTIFACT_BUCKET,
            s3_key=s3_key,
            filename_original=out_name,
            file_size_bytes=len(out_bytes),
            mime_type="application/pdf",
            sha256_hash=calculate_sha256(out_bytes),
            created_at=datetime.now(timezone.utc),
        )
        session.add(output_file)

        token_str = await token_service.create_download_token(
            job_id=str(job_uuid),
            file_id=str(out_file_id),
            s3_bucket=settings.S3_ARTIFACT_BUCKET,
            s3_key=s3_key,
            filename=out_name,
            ttl_seconds=settings.DOWNLOAD_TOKEN_TTL_SECONDS,
            lease_window_seconds=settings.DOWNLOAD_LEASE_WINDOW_SECONDS,
            max_retries=3,
        )

        token_record = DownloadToken(
            id=uuid.uuid4(),
            token=token_str,
            job_id=job.id,
            file_id=out_file_id,
            created_at=datetime.now(timezone.utc),
            expires_at=job.expires_at,
            retry_count=0,
            max_retries=3,
            is_revoked=False,
        )
        session.add(token_record)

        job.status = "COMPLETED"
        job.completed_at = datetime.now(timezone.utc)
        await session.commit()

        return {
            "status": "success",
            "job_id": str(job_uuid),
            "output_filename": out_name,
            "token": token_str,
        }

    except PdfEncryptionError as exc:
        job.status = "FAILED"
        job.error_code = "PDF_ENCRYPTED"
        job.error_message = str(exc)
        await session.commit()
        return {"status": "error", "error_code": "PDF_ENCRYPTED", "message": str(exc)}
    except (PdfCorruptionError, RotateValidationError, PdfEngineError) as exc:
        job.status = "FAILED"
        job.error_code = "ROTATE_VALIDATION_ERROR" if isinstance(exc, RotateValidationError) else "PDF_CORRUPTED"
        job.error_message = str(exc)
        await session.commit()
        return {"status": "error", "error_code": job.error_code, "message": str(exc)}
    except Exception as exc:
        job.status = "FAILED"
        job.error_code = "PROCESSING_FAILED"
        job.error_message = f"An unexpected error occurred during processing: {str(exc)}"
        await session.commit()
        return {"status": "error", "error_code": "PROCESSING_FAILED", "message": str(exc)}


@shared_task(name="apps.worker.src.tasks.operations.process_rotate_job")
def process_rotate_job(job_id_str: str) -> dict:
    """Celery task entrypoint for Rotate PDF."""
    return run_rotate_job(job_id_str)


def run_reorder_job(job_id_str: str) -> dict:
    """Core execution logic for a reorder PDF job (synchronous / Celery worker)."""
    job_uuid = uuid.UUID(job_id_str)
    engine = get_sync_engine()
    now = datetime.now(timezone.utc)

    with Session(engine) as session:
        stmt = (
            select(Job)
            .options(selectinload(Job.files))
            .where(Job.id == job_uuid)
        )
        job = session.scalars(stmt).one_or_none()
        if not job:
            logger.error("Job not found for reorder execution", job_id=job_id_str)
            return {"status": "error", "message": f"Job {job_id_str} not found"}

        job.status = "PROCESSING"
        job.started_at = now
        session.commit()

        try:
            input_files = [f for f in job.files if f.file_role == "INPUT"]
            if len(input_files) != 1:
                raise ReorderValidationError("Reorder operation requires exactly one input PDF file.")

            target_file = input_files[0]
            pdf_bytes = storage_service.download_bytes(
                bucket=target_file.s3_bucket,
                key=target_file.s3_key,
            )

            options = job.options_json or {}
            sequence = options.get("sequence") or options.get("order")
            output_filename = options.get("output_filename", f"reordered_{target_file.filename_original}")

            out_bytes, out_name, total_pages = reorder_pdf_document(
                pdf_bytes=pdf_bytes,
                sequence=sequence,
                output_filename=output_filename,
            )

            out_file_id = uuid.uuid4()
            s3_key = f"artifacts/{job_uuid}/{out_file_id}_{out_name}"

            storage_service.upload_bytes(
                bucket=settings.S3_ARTIFACT_BUCKET,
                key=s3_key,
                data=out_bytes,
                content_type="application/pdf",
            )

            output_file = JobFile(
                id=out_file_id,
                job_id=job.id,
                file_role="OUTPUT",
                s3_bucket=settings.S3_ARTIFACT_BUCKET,
                s3_key=s3_key,
                filename_original=out_name,
                file_size_bytes=len(out_bytes),
                mime_type="application/pdf",
                sha256_hash=calculate_sha256(out_bytes),
                created_at=datetime.now(timezone.utc),
            )
            session.add(output_file)

            import asyncio
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            token_str = loop.run_until_complete(
                token_service.create_download_token(
                    job_id=str(job_uuid),
                    file_id=str(out_file_id),
                    s3_bucket=settings.S3_ARTIFACT_BUCKET,
                    s3_key=s3_key,
                    filename=out_name,
                    ttl_seconds=settings.DOWNLOAD_TOKEN_TTL_SECONDS,
                    lease_window_seconds=settings.DOWNLOAD_LEASE_WINDOW_SECONDS,
                    max_retries=3,
                )
            )

            token_record = DownloadToken(
                id=uuid.uuid4(),
                token=token_str,
                job_id=job.id,
                file_id=out_file_id,
                created_at=datetime.now(timezone.utc),
                expires_at=job.expires_at,
                retry_count=0,
                max_retries=3,
                is_revoked=False,
            )
            session.add(token_record)

            job.status = "COMPLETED"
            job.completed_at = datetime.now(timezone.utc)
            session.commit()

            return {
                "status": "success",
                "job_id": str(job_uuid),
                "output_filename": out_name,
                "token": token_str,
            }

        except PdfEncryptionError as exc:
            job.status = "FAILED"
            job.error_code = "PDF_ENCRYPTED"
            job.error_message = str(exc)
            session.commit()
            return {"status": "error", "error_code": "PDF_ENCRYPTED", "message": str(exc)}
        except (PdfCorruptionError, ReorderValidationError, PdfEngineError) as exc:
            job.status = "FAILED"
            job.error_code = "REORDER_VALIDATION_ERROR" if isinstance(exc, ReorderValidationError) else "PDF_CORRUPTED"
            job.error_message = str(exc)
            session.commit()
            return {"status": "error", "error_code": job.error_code, "message": str(exc)}
        except Exception as exc:
            job.status = "FAILED"
            job.error_code = "PROCESSING_FAILED"
            job.error_message = f"An unexpected error occurred during processing: {str(exc)}"
            session.commit()
            return {"status": "error", "error_code": "PROCESSING_FAILED", "message": str(exc)}


async def execute_reorder_job_async(job_uuid: uuid.UUID, session: AsyncSession) -> dict:
    """Async in-process execution for Reorder PDF job."""
    stmt = (
        select(Job)
        .options(selectinload(Job.files))
        .where(Job.id == job_uuid)
    )
    res = await session.execute(stmt)
    job = res.scalars().one_or_none()
    if not job:
        return {"status": "error", "message": f"Job {job_uuid} not found"}

    now = datetime.now(timezone.utc)
    job.status = "PROCESSING"
    job.started_at = now
    await session.commit()

    try:
        input_files = [f for f in job.files if f.file_role == "INPUT"]
        if len(input_files) != 1:
            raise ReorderValidationError("Reorder operation requires exactly one input PDF file.")

        target_file = input_files[0]
        pdf_bytes = storage_service.download_bytes(
            bucket=target_file.s3_bucket,
            key=target_file.s3_key,
        )

        options = job.options_json or {}
        sequence = options.get("sequence") or options.get("order")
        output_filename = options.get("output_filename", f"reordered_{target_file.filename_original}")

        out_bytes, out_name, total_pages = reorder_pdf_document(
            pdf_bytes=pdf_bytes,
            sequence=sequence,
            output_filename=output_filename,
        )

        out_file_id = uuid.uuid4()
        s3_key = f"artifacts/{job_uuid}/{out_file_id}_{out_name}"

        storage_service.upload_bytes(
            bucket=settings.S3_ARTIFACT_BUCKET,
            key=s3_key,
            data=out_bytes,
            content_type="application/pdf",
        )

        output_file = JobFile(
            id=out_file_id,
            job_id=job.id,
            file_role="OUTPUT",
            s3_bucket=settings.S3_ARTIFACT_BUCKET,
            s3_key=s3_key,
            filename_original=out_name,
            file_size_bytes=len(out_bytes),
            mime_type="application/pdf",
            sha256_hash=calculate_sha256(out_bytes),
            created_at=datetime.now(timezone.utc),
        )
        session.add(output_file)

        token_str = await token_service.create_download_token(
            job_id=str(job_uuid),
            file_id=str(out_file_id),
            s3_bucket=settings.S3_ARTIFACT_BUCKET,
            s3_key=s3_key,
            filename=out_name,
            ttl_seconds=settings.DOWNLOAD_TOKEN_TTL_SECONDS,
            lease_window_seconds=settings.DOWNLOAD_LEASE_WINDOW_SECONDS,
            max_retries=3,
        )

        token_record = DownloadToken(
            id=uuid.uuid4(),
            token=token_str,
            job_id=job.id,
            file_id=out_file_id,
            created_at=datetime.now(timezone.utc),
            expires_at=job.expires_at,
            retry_count=0,
            max_retries=3,
            is_revoked=False,
        )
        session.add(token_record)

        job.status = "COMPLETED"
        job.completed_at = datetime.now(timezone.utc)
        await session.commit()

        return {
            "status": "success",
            "job_id": str(job_uuid),
            "output_filename": out_name,
            "token": token_str,
        }

    except PdfEncryptionError as exc:
        job.status = "FAILED"
        job.error_code = "PDF_ENCRYPTED"
        job.error_message = str(exc)
        await session.commit()
        return {"status": "error", "error_code": "PDF_ENCRYPTED", "message": str(exc)}
    except (PdfCorruptionError, ReorderValidationError, PdfEngineError) as exc:
        job.status = "FAILED"
        job.error_code = "REORDER_VALIDATION_ERROR" if isinstance(exc, ReorderValidationError) else "PDF_CORRUPTED"
        job.error_message = str(exc)
        await session.commit()
        return {"status": "error", "error_code": job.error_code, "message": str(exc)}
    except Exception as exc:
        job.status = "FAILED"
        job.error_code = "PROCESSING_FAILED"
        job.error_message = f"An unexpected error occurred during processing: {str(exc)}"
        await session.commit()
        return {"status": "error", "error_code": "PROCESSING_FAILED", "message": str(exc)}


@shared_task(name="apps.worker.src.tasks.operations.process_reorder_job")
def process_reorder_job(job_id_str: str) -> dict:
    """Celery task entrypoint for Reorder PDF."""
    return run_reorder_job(job_id_str)


def run_remove_job(job_id_str: str) -> dict:
    """Core execution logic for a remove pages PDF job (synchronous / Celery worker)."""
    job_uuid = uuid.UUID(job_id_str)
    engine = get_sync_engine()
    now = datetime.now(timezone.utc)

    with Session(engine) as session:
        stmt = (
            select(Job)
            .options(selectinload(Job.files))
            .where(Job.id == job_uuid)
        )
        job = session.scalars(stmt).one_or_none()
        if not job:
            logger.error("Job not found for remove execution", job_id=job_id_str)
            return {"status": "error", "message": f"Job {job_id_str} not found"}

        job.status = "PROCESSING"
        job.started_at = now
        session.commit()

        try:
            input_files = [f for f in job.files if f.file_role == "INPUT"]
            if len(input_files) != 1:
                raise RemoveValidationError("Remove operation requires exactly one input PDF file.")

            target_file = input_files[0]
            pdf_bytes = storage_service.download_bytes(
                bucket=target_file.s3_bucket,
                key=target_file.s3_key,
            )

            options = job.options_json or {}
            pages_to_remove = options.get("pages") or options.get("pages_to_remove")
            output_filename = options.get("output_filename", f"removed_{target_file.filename_original}")

            out_bytes, out_name, remaining_count = remove_pdf_pages(
                pdf_bytes=pdf_bytes,
                pages_to_remove=pages_to_remove,
                output_filename=output_filename,
            )

            out_file_id = uuid.uuid4()
            s3_key = f"artifacts/{job_uuid}/{out_file_id}_{out_name}"

            storage_service.upload_bytes(
                bucket=settings.S3_ARTIFACT_BUCKET,
                key=s3_key,
                data=out_bytes,
                content_type="application/pdf",
            )

            output_file = JobFile(
                id=out_file_id,
                job_id=job.id,
                file_role="OUTPUT",
                s3_bucket=settings.S3_ARTIFACT_BUCKET,
                s3_key=s3_key,
                filename_original=out_name,
                file_size_bytes=len(out_bytes),
                mime_type="application/pdf",
                sha256_hash=calculate_sha256(out_bytes),
                created_at=datetime.now(timezone.utc),
            )
            session.add(output_file)

            import asyncio
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            token_str = loop.run_until_complete(
                token_service.create_download_token(
                    job_id=str(job_uuid),
                    file_id=str(out_file_id),
                    s3_bucket=settings.S3_ARTIFACT_BUCKET,
                    s3_key=s3_key,
                    filename=out_name,
                    ttl_seconds=settings.DOWNLOAD_TOKEN_TTL_SECONDS,
                    lease_window_seconds=settings.DOWNLOAD_LEASE_WINDOW_SECONDS,
                    max_retries=3,
                )
            )

            token_record = DownloadToken(
                id=uuid.uuid4(),
                token=token_str,
                job_id=job.id,
                file_id=out_file_id,
                created_at=datetime.now(timezone.utc),
                expires_at=job.expires_at,
                retry_count=0,
                max_retries=3,
                is_revoked=False,
            )
            session.add(token_record)

            job.status = "COMPLETED"
            job.completed_at = datetime.now(timezone.utc)
            session.commit()

            return {
                "status": "success",
                "job_id": str(job_uuid),
                "output_filename": out_name,
                "token": token_str,
                "remaining_pages": remaining_count,
            }

        except PdfEncryptionError as exc:
            job.status = "FAILED"
            job.error_code = "PDF_ENCRYPTED"
            job.error_message = str(exc)
            session.commit()
            return {"status": "error", "error_code": "PDF_ENCRYPTED", "message": str(exc)}
        except (PdfCorruptionError, RemoveValidationError, PdfEngineError) as exc:
            job.status = "FAILED"
            job.error_code = "REMOVE_VALIDATION_ERROR" if isinstance(exc, RemoveValidationError) else "PDF_CORRUPTED"
            job.error_message = str(exc)
            session.commit()
            return {"status": "error", "error_code": job.error_code, "message": str(exc)}
        except Exception as exc:
            job.status = "FAILED"
            job.error_code = "PROCESSING_FAILED"
            job.error_message = f"An unexpected error occurred during processing: {str(exc)}"
            session.commit()
            return {"status": "error", "error_code": "PROCESSING_FAILED", "message": str(exc)}


async def execute_remove_job_async(job_uuid: uuid.UUID, session: AsyncSession) -> dict:
    """Async in-process execution for Remove PDF job."""
    stmt = (
        select(Job)
        .options(selectinload(Job.files))
        .where(Job.id == job_uuid)
    )
    res = await session.execute(stmt)
    job = res.scalars().one_or_none()
    if not job:
        return {"status": "error", "message": f"Job {job_uuid} not found"}

    now = datetime.now(timezone.utc)
    job.status = "PROCESSING"
    job.started_at = now
    await session.commit()

    try:
        input_files = [f for f in job.files if f.file_role == "INPUT"]
        if len(input_files) != 1:
            raise RemoveValidationError("Remove operation requires exactly one input PDF file.")

        target_file = input_files[0]
        pdf_bytes = storage_service.download_bytes(
            bucket=target_file.s3_bucket,
            key=target_file.s3_key,
        )

        options = job.options_json or {}
        pages_to_remove = options.get("pages") or options.get("pages_to_remove")
        output_filename = options.get("output_filename", f"removed_{target_file.filename_original}")

        out_bytes, out_name, remaining_count = remove_pdf_pages(
            pdf_bytes=pdf_bytes,
            pages_to_remove=pages_to_remove,
            output_filename=output_filename,
        )

        out_file_id = uuid.uuid4()
        s3_key = f"artifacts/{job_uuid}/{out_file_id}_{out_name}"

        storage_service.upload_bytes(
            bucket=settings.S3_ARTIFACT_BUCKET,
            key=s3_key,
            data=out_bytes,
            content_type="application/pdf",
        )

        output_file = JobFile(
            id=out_file_id,
            job_id=job.id,
            file_role="OUTPUT",
            s3_bucket=settings.S3_ARTIFACT_BUCKET,
            s3_key=s3_key,
            filename_original=out_name,
            file_size_bytes=len(out_bytes),
            mime_type="application/pdf",
            sha256_hash=calculate_sha256(out_bytes),
            created_at=datetime.now(timezone.utc),
        )
        session.add(output_file)

        token_str = await token_service.create_download_token(
            job_id=str(job_uuid),
            file_id=str(out_file_id),
            s3_bucket=settings.S3_ARTIFACT_BUCKET,
            s3_key=s3_key,
            filename=out_name,
            ttl_seconds=settings.DOWNLOAD_TOKEN_TTL_SECONDS,
            lease_window_seconds=settings.DOWNLOAD_LEASE_WINDOW_SECONDS,
            max_retries=3,
        )

        token_record = DownloadToken(
            id=uuid.uuid4(),
            token=token_str,
            job_id=job.id,
            file_id=out_file_id,
            created_at=datetime.now(timezone.utc),
            expires_at=job.expires_at,
            retry_count=0,
            max_retries=3,
            is_revoked=False,
        )
        session.add(token_record)

        job.status = "COMPLETED"
        job.completed_at = datetime.now(timezone.utc)
        await session.commit()

        return {
            "status": "success",
            "job_id": str(job_uuid),
            "output_filename": out_name,
            "token": token_str,
            "remaining_pages": remaining_count,
        }

    except PdfEncryptionError as exc:
        job.status = "FAILED"
        job.error_code = "PDF_ENCRYPTED"
        job.error_message = str(exc)
        await session.commit()
        return {"status": "error", "error_code": "PDF_ENCRYPTED", "message": str(exc)}
    except (PdfCorruptionError, RemoveValidationError, PdfEngineError) as exc:
        job.status = "FAILED"
        job.error_code = "REMOVE_VALIDATION_ERROR" if isinstance(exc, RemoveValidationError) else "PDF_CORRUPTED"
        job.error_message = str(exc)
        await session.commit()
        return {"status": "error", "error_code": job.error_code, "message": str(exc)}
    except Exception as exc:
        job.status = "FAILED"
        job.error_code = "PROCESSING_FAILED"
        job.error_message = f"An unexpected error occurred during processing: {str(exc)}"
        await session.commit()
        return {"status": "error", "error_code": "PROCESSING_FAILED", "message": str(exc)}


@shared_task(name="apps.worker.src.tasks.operations.process_remove_job")
def process_remove_job(job_id_str: str) -> dict:
    """Celery task entrypoint for Remove PDF."""
    return run_remove_job(job_id_str)






