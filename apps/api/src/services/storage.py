"""Storage service interface for MinIO and AWS S3 object storage."""

import io
from typing import Optional, Tuple, BinaryIO
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError, EndpointConnectionError

from apps.api.src.core.config import settings


class StorageService:
    def __init__(self):
        self.endpoint_url = settings.S3_ENDPOINT_URL
        self.raw_bucket = settings.S3_RAW_BUCKET
        self.artifact_bucket = settings.S3_ARTIFACT_BUCKET
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = boto3.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
                region_name=settings.S3_REGION,
                config=Config(
                    signature_version="s3v4",
                    s3={"addressing_style": "path" if settings.S3_FORCE_PATH_STYLE else "auto"}
                ),
            )
        return self._client

    def ensure_buckets_exist(self) -> None:
        """Create target buckets if they do not already exist."""
        try:
            existing = [b["Name"] for b in self.client.list_buckets().get("Buckets", [])]
            for bucket in [self.raw_bucket, self.artifact_bucket]:
                if bucket not in existing:
                    self.client.create_bucket(Bucket=bucket)
        except (ClientError, EndpointConnectionError):
            pass

    def upload_bytes(
        self,
        bucket: str,
        key: str,
        data: bytes,
        content_type: str = "application/pdf",
        metadata: Optional[dict] = None
    ) -> str:
        """Upload raw byte buffer to S3 bucket."""
        extra_args = {"ContentType": content_type}
        if metadata:
            extra_args["Metadata"] = metadata

        self.client.put_object(
            Bucket=bucket,
            Key=key,
            Body=data,
            **extra_args
        )
        return f"{bucket}/{key}"

    def download_bytes(self, bucket: str, key: str) -> bytes:
        """Fetch full byte content of an S3 object."""
        response = self.client.get_object(Bucket=bucket, Key=key)
        return response["Body"].read()

    def get_object_stream(
        self,
        bucket: str,
        key: str,
        range_header: Optional[str] = None
    ) -> Tuple[BinaryIO, int, Optional[str], str]:
        """
        Stream object body supporting HTTP Range headers for chunked and resume downloads.
        Returns: (body_stream, content_length, content_range_str, content_type)
        """
        params = {"Bucket": bucket, "Key": key}
        if range_header:
            params["Range"] = range_header

        response = self.client.get_object(**params)
        body = response["Body"]
        content_length = response["ContentLength"]
        content_range = response.get("ContentRange")
        content_type = response.get("ContentType", "application/octet-stream")
        return body, content_length, content_range, content_type

    def delete_object(self, bucket: str, key: str) -> bool:
        """Delete an object from S3."""
        try:
            self.client.delete_object(Bucket=bucket, Key=key)
            return True
        except ClientError:
            return False

    def generate_presigned_download_url(
        self,
        bucket: str,
        key: str,
        filename: Optional[str] = None,
        expires_in: int = 300
    ) -> str:
        """Generate a short-lived presigned download URL."""
        params = {"Bucket": bucket, "Key": key}
        if filename:
            params["ResponseContentDisposition"] = f'attachment; filename="{filename}"'

        return self.client.generate_presigned_url(
            "get_object",
            Params=params,
            ExpiresIn=expires_in
        )

    def check_health(self) -> bool:
        """Verify S3/MinIO cluster availability."""
        try:
            self.client.list_buckets()
            return True
        except Exception:
            return False


storage_service = StorageService()
