"""Unit tests for security primitives, magic byte inspection, and IP pseudonymization."""

import pytest
from apps.api.src.core.security import (
    validate_file_signature,
    hash_ip,
    generate_secure_token,
    calculate_sha256,
)


def test_validate_file_signature_pdf():
    # Valid standard PDF header
    valid_pdf = b"%PDF-1.7\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<<>>\nendobj"
    is_valid, mime = validate_file_signature(valid_pdf, "pdf")
    assert is_valid is True
    assert mime == "application/pdf"

    # PDF with leading comment/whitespace within 1024 bytes
    padded_pdf = b"\x00" * 32 + b"%PDF-2.0\n..."
    is_valid, mime = validate_file_signature(padded_pdf, "pdf")
    assert is_valid is True
    assert mime == "application/pdf"

    # Invalid PDF: spoofed extension / executable header
    exe_spoofed = b"MZ\x90\x00\x03\x00\x00\x00"
    is_valid, err = validate_file_signature(exe_spoofed, "pdf")
    assert is_valid is False
    assert "Invalid PDF" in err

    # Empty content
    is_valid, err = validate_file_signature(b"", "pdf")
    assert is_valid is False
    assert "empty" in err.lower()


def test_validate_file_signature_images():
    # Valid JPEG SOI marker
    valid_jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF"
    is_valid, mime = validate_file_signature(valid_jpeg, "jpg")
    assert is_valid is True
    assert mime == "image/jpeg"

    # Invalid JPEG
    bad_jpeg = b"GIF89a..."
    is_valid, err = validate_file_signature(bad_jpeg, "jpg")
    assert is_valid is False
    assert "Invalid JPEG" in err

    # Valid PNG header
    valid_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    is_valid, mime = validate_file_signature(valid_png, "png")
    assert is_valid is True
    assert mime == "image/png"


def test_hash_ip_pseudonymization():
    ip_1 = "192.168.1.100"
    ip_2 = "10.0.0.50"

    hash_1 = hash_ip(ip_1)
    hash_2 = hash_ip(ip_2)

    # 64 hex characters (SHA-256)
    assert len(hash_1) == 64
    assert len(hash_2) == 64
    # Different IPs yield different hashes
    assert hash_1 != hash_2
    # Deterministic with same salt
    assert hash_ip(ip_1) == hash_1
    # Raw IP is never contained in hash
    assert ip_1 not in hash_1
    # Handles None or empty IP safely
    assert len(hash_ip(None)) == 64


def test_generate_secure_token():
    token_1 = generate_secure_token()
    token_2 = generate_secure_token()

    assert token_1.startswith("dl_")
    assert token_2.startswith("dl_")
    assert len(token_1) > 20
    assert token_1 != token_2


def test_calculate_sha256():
    data = b"Hello, OpenPDF Platform!"
    h = calculate_sha256(data)
    assert len(h) == 64
    assert h == calculate_sha256(data)
