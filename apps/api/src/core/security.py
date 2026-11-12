"""Security primitives, file validation, and token utilities."""

import hashlib
import secrets
from typing import Tuple, Optional


# Magic byte signatures
MAGIC_BYTES = {
    "pdf": b"%PDF-",
    "jpeg": b"\xff\xd8\xff",
    "png": b"\x89PNG\r\n\x1a\n",
}

# Maximum byte header inspection length
MAX_MAGIC_LOOKAHEAD = 1024


def validate_file_signature(content: bytes, expected_type: str) -> Tuple[bool, str]:
    """
    Validate that the provided file content matches the expected file type magic bytes.
    Does NOT rely on file extensions or user-provided Content-Type headers.
    
    Returns:
        (is_valid, detected_or_error_message)
    """
    if not content:
        return False, "File content is empty."

    expected_type = expected_type.lower()
    
    if expected_type == "pdf":
        # Per PDF specification, %PDF- should appear within the first 1024 bytes
        header = content[:MAX_MAGIC_LOOKAHEAD]
        if b"%PDF-" in header:
            return True, "application/pdf"
        return False, "Invalid PDF: missing '%PDF-' header signature."

    elif expected_type in ("jpg", "jpeg"):
        if content.startswith(MAGIC_BYTES["jpeg"]):
            return True, "image/jpeg"
        return False, "Invalid JPEG: missing SOI marker (0xFFD8FF)."

    elif expected_type == "png":
        if content.startswith(MAGIC_BYTES["png"]):
            return True, "image/png"
        return False, "Invalid PNG: missing standard 8-byte PNG signature."

    return False, f"Unsupported file type validation requested: '{expected_type}'."


def hash_ip(ip_address: Optional[str], salt: str = "pdf-platform-privacy-salt") -> str:
    """
    Produce a one-way pseudonymized SHA-256 hash of a client IP address.
    Complies with GDPR and data privacy standards by ensuring raw IP addresses
    are never stored in persistent databases.
    """
    if not ip_address:
        return hashlib.sha256(f"unknown-{salt}".encode("utf-8")).hexdigest()
    
    raw = f"{ip_address.strip()}:{salt}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def generate_secure_token(prefix: str = "dl_", nbytes: int = 24) -> str:
    """
    Generate a cryptographically secure, URL-safe random token.
    Default 24 bytes yields 32 characters in base64/urlsafe string.
    """
    random_str = secrets.token_urlsafe(nbytes)
    return f"{prefix}{random_str}"


def calculate_sha256(content: bytes) -> str:
    """Compute standard SHA-256 checksum of raw binary data."""
    return hashlib.sha256(content).hexdigest()
