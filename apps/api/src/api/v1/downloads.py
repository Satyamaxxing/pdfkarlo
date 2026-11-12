"""Download token redemption and secure byte streaming endpoint."""

from typing import Optional
from fastapi import APIRouter, Header, HTTPException, Response, status, Depends
from fastapi.responses import StreamingResponse

from apps.api.src.core.config import settings
from apps.api.src.core.rate_limit import rate_limit_downloads
from apps.api.src.services.storage import storage_service
from apps.api.src.services.token_service import token_service

router = APIRouter(prefix="/downloads", tags=["Downloads"])


@router.get("/{token}", dependencies=[Depends(rate_limit_downloads)])
async def download_file(
    token: str,
    range_header: Optional[str] = Header(None, alias="Range"),
):
    """
    Redeem a leased download token to stream the output file.
    Supports HTTP Range requests for resuming interrupted downloads.
    Enforces atomic lease window and retry limits.
    """
    is_allowed, reason, meta = await token_service.validate_and_lease_token(token)

    if not is_allowed:
        if reason == "TOKEN_NOT_FOUND":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Download token not found.",
            )
        elif reason in ("TOKEN_EXPIRED", "LEASE_EXPIRED"):
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Download token has expired. Output files are removed after the retention window.",
            )
        elif reason == "RETRIES_EXHAUSTED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Maximum download retry limit reached for this token.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Download token is invalid: {reason}",
            )

    bucket = meta.get("s3_bucket", settings.S3_ARTIFACT_BUCKET)
    key = meta.get("s3_key")
    filename = meta.get("filename", "document.pdf")
    retries = meta.get("retry_count", 1)
    max_retries = meta.get("max_retries", 3)
    remaining_attempts = max(0, int(max_retries) - int(retries))

    try:
        stream, content_length, content_range, content_type = storage_service.get_object_stream(
            bucket=bucket,
            key=key,
            range_header=range_header,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to retrieve file from storage: {str(exc)}",
        )

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Cache-Control": "private, no-store, no-cache, must-revalidate",
        "X-Download-Attempts-Remaining": str(remaining_attempts),
    }

    if content_range:
        headers["Content-Range"] = content_range
        return StreamingResponse(
            stream,
            status_code=status.HTTP_206_PARTIAL_CONTENT,
            headers=headers,
            media_type=content_type,
        )

    headers["Content-Length"] = str(content_length)
    return StreamingResponse(
        stream,
        status_code=status.HTTP_200_OK,
        headers=headers,
        media_type=content_type,
    )
