"""SQLAlchemy ORM models for jobs, files, artifacts, and download tokens."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Text,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator, CHAR

from apps.api.src.db.session import Base


# Cross-database compatible GUID / UUID type
class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(36), storing as stringified hex.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == "postgresql":
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(value))
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value)
        return value


def utcnow():
    return datetime.now(timezone.utc)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    operation = Column(String(50), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="PENDING", index=True)
    client_ip_hash = Column(String(64), nullable=True)
    options_json = Column(JSON, default=dict)
    error_code = Column(String(64), nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # Relationships
    files = relationship("JobFile", back_populates="job", cascade="all, delete-orphan")
    artifacts = relationship("JobArtifact", back_populates="job", cascade="all, delete-orphan")
    download_tokens = relationship("DownloadToken", back_populates="job", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Job {self.id} op={self.operation} status={self.status}>"


class JobFile(Base):
    __tablename__ = "job_files"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    job_id = Column(GUID(), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    file_role = Column(String(30), nullable=False)  # INPUT, OUTPUT, INTERMEDIATE
    s3_bucket = Column(String(128), nullable=False)
    s3_key = Column(String(512), nullable=False)
    filename_original = Column(String(255), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=False)
    sha256_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    job = relationship("Job", back_populates="files")

    def __repr__(self):
        return f"<JobFile {self.id} role={self.file_role} name={self.filename_original}>"


class JobArtifact(Base):
    __tablename__ = "job_artifacts"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    job_id = Column(GUID(), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    artifact_type = Column(String(64), nullable=False)  # THUMBNAIL, PREVIEW, PAGE_MAP
    s3_bucket = Column(String(128), nullable=False)
    s3_key = Column(String(512), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    job = relationship("Job", back_populates="artifacts")

    def __repr__(self):
        return f"<JobArtifact {self.id} type={self.artifact_type}>"


class DownloadToken(Base):
    __tablename__ = "download_tokens"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    token = Column(String(64), unique=True, nullable=False, index=True)
    job_id = Column(GUID(), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    file_id = Column(GUID(), ForeignKey("job_files.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    lease_expires_at = Column(DateTime(timezone=True), nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)

    # Relationships
    job = relationship("Job", back_populates="download_tokens")

    def __repr__(self):
        return f"<DownloadToken {self.token} job={self.job_id} retries={self.retry_count}>"
