"""Rotate PDF processing engine using pikepdf / QPDF.

Provides high-speed, zero-copy, structural rotation of PDF documents:
- Rotate all pages by 90, 180, or 270 degrees.
- Rotate specific selected pages.
- Per-page custom rotation maps.
- Seamless preservation and accumulation with existing /Rotate page dictionary metadata.
- Memory-safe stream compaction via QPDF object stream generation.
"""

from typing import Dict, List, Optional, Tuple, Union
import io
import logging
import pikepdf

from apps.worker.src.engine.merge import (
    PdfEngineError,
    PdfEncryptionError,
    PdfCorruptionError,
)

logger = logging.getLogger(__name__)


class RotateValidationError(PdfEngineError):
    """Raised when rotation options, angles, or page selections are invalid."""
    pass


def validate_rotation_angle(angle: int) -> int:
    """Validate and normalize a rotation angle into [90, 180, 270].

    Raises:
        RotateValidationError: If angle is not a non-zero multiple of 90 degrees.
    """
    if not isinstance(angle, int) and not (isinstance(angle, str) and angle.lstrip("-").isdigit()):
        raise RotateValidationError(f"Rotation angle must be an integer, got: {angle!r}")

    angle_int = int(angle)
    if angle_int % 90 != 0:
        raise RotateValidationError(
            f"Invalid rotation angle: {angle_int}°. Rotation angle must be a multiple of 90 degrees (e.g. 90, 180, 270, -90)."
        )

    normalized = angle_int % 360
    if normalized == 0:
        raise RotateValidationError(
            f"Invalid rotation angle: {angle_int}°. Rotation angle cannot result in a 0° no-op."
        )

    return normalized


def parse_rotate_pages(pages_input: Union[List[int], str, int], total_pages: int) -> List[int]:
    """Parse and validate a list or comma-separated string of page numbers for rotation."""
    if isinstance(pages_input, int):
        target_list = [pages_input]
    elif isinstance(pages_input, list):
        target_list = [int(p) for p in pages_input]
    elif isinstance(pages_input, str):
        parts = [p.strip() for p in pages_input.split(",") if p.strip()]
        target_list = []
        for p in parts:
            if not p.isdigit():
                raise RotateValidationError(f"Invalid page reference: '{p}'. Must be a positive integer.")
            target_list.append(int(p))
    else:
        raise RotateValidationError(f"Invalid pages parameter type: {type(pages_input)}")

    if not target_list:
        raise RotateValidationError("No pages specified for rotation.")

    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for p in target_list:
        if p not in seen:
            seen.add(p)
            deduped.append(p)

    for p in deduped:
        if p < 1 or p > total_pages:
            raise RotateValidationError(
                f"Page {p} is out of bounds. Document contains {total_pages} {'page' if total_pages == 1 else 'pages'}."
            )

    return deduped


def rotate_pdf_document(
    pdf_bytes: bytes,
    angle: Optional[int] = None,
    pages: Optional[Union[List[int], str, int]] = None,
    page_rotations: Optional[Dict[Union[int, str], int]] = None,
    output_filename: str = "rotated_document.pdf",
) -> Tuple[bytes, str, int]:
    """Rotate pages in a PDF document and return updated bytes.

    Args:
        pdf_bytes: Raw binary bytes of the input PDF.
        angle: Global rotation angle in degrees (90, 180, 270, -90, etc.).
        pages: Optional list or comma-separated string of 1-indexed page numbers to rotate.
               If None and angle is provided, all pages are rotated.
        page_rotations: Optional dictionary mapping page number to angle (e.g. {"1": 90, "2": 180}).
        output_filename: Desired name for the output file.

    Returns:
        Tuple of (rotated_pdf_bytes, output_filename, total_pages).

    Raises:
        PdfEncryptionError: If the document is password-protected.
        PdfCorruptionError: If the PDF data is malformed or corrupted.
        RotateValidationError: If angles or page selections are invalid.
    """
    if not pdf_bytes:
        raise RotateValidationError("Input PDF stream is empty.")

    try:
        pdf = pikepdf.Pdf.open(io.BytesIO(pdf_bytes))
    except pikepdf.PasswordError as e:
        raise PdfEncryptionError(
            "PDF document is password-protected and cannot be rotated without authorization."
        ) from e
    except (pikepdf.PdfError, Exception) as e:
        raise PdfCorruptionError(f"PDF document is corrupted or unreadable: {e}") from e

    try:
        total_pages = len(pdf.pages)
        if total_pages == 0:
            raise RotateValidationError("PDF document contains no pages to rotate.")

        # Scenario 1: Per-page custom rotation map
        if page_rotations:
            if not isinstance(page_rotations, dict):
                raise RotateValidationError("page_rotations must be a dictionary of {page: angle}.")
            if not page_rotations:
                raise RotateValidationError("page_rotations dictionary is empty.")

            for page_key, rot_angle in page_rotations.items():
                if not str(page_key).isdigit():
                    raise RotateValidationError(f"Invalid page key in page_rotations: '{page_key}'. Must be an integer.")
                p_num = int(page_key)
                if p_num < 1 or p_num > total_pages:
                    raise RotateValidationError(
                        f"Page {p_num} in page_rotations is out of bounds (1-{total_pages})."
                    )

                norm_angle = validate_rotation_angle(rot_angle)
                page_obj = pdf.pages[p_num - 1]
                current_rot = int(page_obj.get("/Rotate", 0))
                page_obj.Rotate = (current_rot + norm_angle) % 360

        # Scenario 2: Global angle with optional page subset
        elif angle is not None:
            norm_angle = validate_rotation_angle(angle)

            if pages is not None:
                target_pages = parse_rotate_pages(pages, total_pages)
                for p_num in target_pages:
                    page_obj = pdf.pages[p_num - 1]
                    current_rot = int(page_obj.get("/Rotate", 0))
                    page_obj.Rotate = (current_rot + norm_angle) % 360
            else:
                # Rotate all pages
                for page_obj in pdf.pages:
                    current_rot = int(page_obj.get("/Rotate", 0))
                    page_obj.Rotate = (current_rot + norm_angle) % 360

        else:
            raise RotateValidationError(
                "Either 'angle' or 'page_rotations' must be specified for Rotate PDF operation."
            )

        # Write output with stream compaction
        out_buf = io.BytesIO()
        pdf.save(
            out_buf,
            object_stream_mode=pikepdf.ObjectStreamMode.generate,
            compress_streams=True,
        )
        return out_buf.getvalue(), output_filename, total_pages

    finally:
        pdf.close()
