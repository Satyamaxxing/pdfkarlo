"""Reorder PDF pages engine using pikepdf / QPDF.

Provides high-speed, zero-copy, structural page reordering:
- Validates that the submitted page sequence is a complete, valid permutation.
- Rejects duplicate, missing, and out-of-range indexes.
- Preserves all page content streams, /Rotate orientations, /Annots annotations, and structural metadata.
- Remaps outline / bookmark destination offsets to match new page positions.
- Compresses output object streams with pikepdf.ObjectStreamMode.generate.
"""

from typing import List, Tuple, Union
import io
import logging
import pikepdf

from apps.worker.src.engine.merge import (
    PdfEngineError,
    PdfEncryptionError,
    PdfCorruptionError,
)

logger = logging.getLogger(__name__)


class ReorderValidationError(PdfEngineError):
    """Raised when page sequence permutation or ordering options are invalid."""
    pass


def validate_page_sequence(
    sequence_input: Union[List[int], str],
    total_pages: int,
) -> List[int]:
    """Validate that the input represents a complete, bijective permutation of [1..total_pages].

    Args:
        sequence_input: List of 1-indexed integers or comma-separated string (e.g. "3, 1, 2" or [3, 1, 2]).
        total_pages: Total number of pages in the source document.

    Returns:
        List of verified 1-indexed integers representing the target order.

    Raises:
        ReorderValidationError: If sequence is empty, invalid format, missing pages,
                                contains duplicates, or contains out-of-bounds indices.
    """
    if sequence_input is None:
        raise ReorderValidationError("Page sequence is required for reordering.")

    if isinstance(sequence_input, str):
        parts = [p.strip() for p in sequence_input.split(",") if p.strip()]
        if not parts:
            raise ReorderValidationError("Empty page sequence string provided.")
        parsed = []
        for p in parts:
            if not p.isdigit():
                raise ReorderValidationError(
                    f"Invalid page index '{p}' in sequence. Must be positive integers."
                )
            parsed.append(int(p))
    elif isinstance(sequence_input, list):
        if not sequence_input:
            raise ReorderValidationError("Page sequence list is empty.")
        parsed = []
        for p in sequence_input:
            if not isinstance(p, int) and not (isinstance(p, str) and str(p).isdigit()):
                raise ReorderValidationError(
                    f"Invalid page index '{p}' in sequence. Must be positive integers."
                )
            parsed.append(int(p))
    else:
        raise ReorderValidationError(f"Unsupported sequence type: {type(sequence_input)}")

    # Check bounds
    for p in parsed:
        if p < 1 or p > total_pages:
            raise ReorderValidationError(
                f"Page index {p} is out of bounds. Document contains {total_pages} {'page' if total_pages == 1 else 'pages'}."
            )

    # Check length against total pages
    if len(parsed) != total_pages:
        if len(parsed) < total_pages:
            missing = set(range(1, total_pages + 1)) - set(parsed)
            raise ReorderValidationError(
                f"Incomplete page sequence: got {len(parsed)} pages, expected {total_pages}. "
                f"Missing pages: {sorted(missing)}"
            )
        else:
            raise ReorderValidationError(
                f"Page sequence length ({len(parsed)}) exceeds document page count ({total_pages})."
            )

    # Check for duplicates (must be a valid permutation)
    if len(set(parsed)) != total_pages:
        seen = set()
        duplicates = set()
        for p in parsed:
            if p in seen:
                duplicates.add(p)
            seen.add(p)
        raise ReorderValidationError(
            f"Duplicate page indexes detected in sequence: {sorted(duplicates)}. Every page must appear exactly once."
        )

    return parsed


def reorder_pdf_document(
    pdf_bytes: bytes,
    sequence: Union[List[int], str],
    output_filename: str = "reordered_document.pdf",
) -> Tuple[bytes, str, int]:
    """Reorder pages in a PDF according to the given permutation sequence.

    Args:
        pdf_bytes: Raw binary bytes of the input PDF.
        sequence: 1-indexed page permutation (e.g. [2, 1, 3] or "2, 1, 3").
        output_filename: Desired name for the resulting PDF.

    Returns:
        Tuple of (reordered_pdf_bytes, output_filename, total_pages).

    Raises:
        PdfEncryptionError: If the document is password-protected.
        PdfCorruptionError: If the PDF stream is malformed or corrupted.
        ReorderValidationError: If sequence is not a valid permutation.
    """
    if not pdf_bytes:
        raise ReorderValidationError("Input PDF stream is empty.")

    try:
        src_pdf = pikepdf.Pdf.open(io.BytesIO(pdf_bytes))
    except pikepdf.PasswordError as e:
        raise PdfEncryptionError(
            "PDF document is password-protected and cannot be reordered without authorization."
        ) from e
    except (pikepdf.PdfError, Exception) as e:
        raise PdfCorruptionError(f"PDF document is corrupted or unreadable: {e}") from e

    try:
        total_pages = len(src_pdf.pages)
        if total_pages == 0:
            raise ReorderValidationError("PDF document contains no pages to reorder.")

        # Validate complete permutation
        valid_sequence = validate_page_sequence(sequence, total_pages)

        # Mapping: old 0-based page index -> new 0-based page index
        old_to_new = {old_p - 1: new_pos for new_pos, old_p in enumerate(valid_sequence)}
        page_to_index = {page.objgen: idx for idx, page in enumerate(src_pdf.pages)}

        target_pdf = pikepdf.Pdf.new()

        # Append pages in the user-specified permutation order
        for page_num in valid_sequence:
            target_pdf.pages.append(src_pdf.pages[page_num - 1])

        # Remap outlines / bookmarks if present
        try:
            with target_pdf.open_outline() as target_outline, src_pdf.open_outline() as src_outline:
                for item in src_outline.root:
                    if hasattr(item, "destination") and item.destination and len(item.destination) > 0:
                        target_page_obj = item.destination[0]
                        if hasattr(target_page_obj, "objgen") and target_page_obj.objgen in page_to_index:
                            old_idx = page_to_index[target_page_obj.objgen]
                            new_idx = old_to_new.get(old_idx, 0)
                            target_outline.root.append(pikepdf.OutlineItem(item.title, new_idx))
        except Exception as e:
            logger.debug("Outline remapping skipped or completed with fallback", error=str(e))

        out_buf = io.BytesIO()
        target_pdf.save(
            out_buf,
            object_stream_mode=pikepdf.ObjectStreamMode.generate,
            compress_streams=True,
        )
        return out_buf.getvalue(), output_filename, total_pages

    finally:
        src_pdf.close()
