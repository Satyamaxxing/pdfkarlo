"""Pydantic schemas for API request and response validation."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class JobOperation(str, Enum):
    MERGE = "merge"
    SPLIT = "split"
    ROTATE = "rotate"
    REORDER = "reorder"
    REMOVE = "remove"
    JPG_TO_PDF = "jpg_to_pdf"
    PDF_TO_JPG = "pdf_to_jpg"
    PROTECT = "protect"
    UNLOCK = "unlock"
    COMPRESS = "compress"


class JobStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"


class FileRole(str, Enum):
    INPUT = "INPUT"
    OUTPUT = "OUTPUT"
    INTERMEDIATE = "INTERMEDIATE"


class JobFileMetadata(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    file_role: str
    filename_original: str
    file_size_bytes: int
    mime_type: str
    sha256_hash: str
    created_at: datetime
    download_token: Optional[str] = None
    download_url: Optional[str] = None


class JobCreateRequest(BaseModel):
    operation: JobOperation
    options: Dict[str, Any] = Field(default_factory=dict)


class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: UUID
    operation: str
    status: str
    created_at: datetime
    expires_at: datetime


class JobStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: UUID
    operation: str
    status: str
    progress_percent: int = 0
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    expires_at: datetime
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    download_token: Optional[str] = None
    download_url: Optional[str] = None
    output_files: List[JobFileMetadata] = Field(default_factory=list)


class DownloadTokenResponse(BaseModel):
    token: str
    job_id: UUID
    file_id: Optional[UUID] = None
    expires_at: datetime
    retry_count: int
    max_retries: int


class HealthComponentStatus(BaseModel):
    status: str
    latency_ms: Optional[float] = None
    details: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str = "0.1.0"
    timestamp: datetime
    components: Dict[str, HealthComponentStatus]
