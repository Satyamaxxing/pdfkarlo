"""Remove PDF pages engine using pikepdf / QPDF.

Provides high-speed, zero-copy, structural page removal:
- Deletes specified pages from a document.
- Validates page indexes against total document page bounds.
- Rejects requests that would remove all pages (leaving zero pages).
- Preserves relative order, content streams, orientations (/Rotate), and annotations (/Annots) of remaining pages.
- Automatically excludes dead objects and compacts unreferenced cross-reference streams.
"""

from typing import List, Set, Tuple, Union
import io
import logging
import pikepdf

from apps.worker.src.engine.merge import (
    PdfEngineError,
    PdfEncryptionError,
    PdfCorruptionError,
)

logger = logging.getLogger(__name__)


class RemoveValidationError(PdfEngineError):
    """Raised when page removal options or indexes are invalid."""
    pass


def parse_remove_pages(
    pages_input: Union[List[int], str, int, Set[int]],
    total_pages: int,
) -> List[int]:
    """Parse, validate, and deduplicate page indexes for removal.

    Args:
        pages_input: Page numbers to remove (1-indexed), as int, list of ints, or comma-separated string.
        total_pages: Total number of pages in the source document.

    Returns:
        Sorted list of unique 1-indexed page numbers to remove.

    Raises:
        RemoveValidationError: If input is invalid, out of bounds, or requests removing all pages.
    """
    if pages_input is None:
        raise RemoveValidationError("Page indexes to remove are required.")

    if isinstance(pages_input, int):
        parsed = [pages_input]
    elif isinstance(pages_input, (list, set)):
        if not pages_input:
            raise RemoveValidationError("No pages specified for removal.")
        parsed = []
        for p in pages_input:
            if not isinstance(p, int) and not (isinstance(p, str) and str(p).isdigit()):
                raise RemoveValidationError(
                    f"Invalid page index '{p}'. Must be a positive integer."
                )
            parsed.append(int(p))
    elif isinstance(pages_input, str):
        parts = [p.strip() for p in pages_input.split(",") if p.strip()]
        if not parts:
            raise RemoveValidationError("No pages specified for removal.")
        parsed = []
        for p in parts:
            if not p.isdigit():
                raise RemoveValidationError(
                    f"Invalid page index '{p}'. Must be a positive integer."
                )
            parsed.append(int(p))
    else:
        raise RemoveValidationError(f"Unsupported page input type: {type(pages_input)}")

    # Deduplicate and sort
    unique_pages = sorted(set(parsed))
    if not unique_pages:
        raise RemoveValidationError("No valid pages specified for removal.")

    # Check bounds
    for p in unique_pages:
        if p < 1 or p > total_pages:
            raise RemoveValidationError(
                f"Page index {p} is out of bounds. Document contains {total_pages} {'page' if total_pages == 1 else 'pages'}."
            )

    # Invariant: Cannot remove every page
    if len(unique_pages) >= total_pages:
        raise RemoveValidationError(
            f"Cannot remove all {total_pages} pages: the output document must contain at least one page."
        )

    return unique_pages


def remove_pdf_pages(
    pdf_bytes: bytes,
    pages_to_remove: Union[List[int], str, int, Set[int]],
    output_filename: str = "removed_document.pdf",
) -> Tuple[bytes, str, int]:
    """Remove specified pages from a PDF document and return updated bytes.

    Args:
        pdf_bytes: Raw binary bytes of the input PDF.
        pages_to_remove: 1-indexed page numbers to remove.
        output_filename: Desired name for the resulting PDF.

    Returns:
        Tuple of (output_pdf_bytes, output_filename, remaining_page_count).

    Raises:
        PdfEncryptionError: If the document is password-protected.
        PdfCorruptionError: If the PDF stream is malformed or corrupted.
        RemoveValidationError: If page selections are invalid or would leave 0 pages.
    """
    if not pdf_bytes:
        raise RemoveValidationError("Input PDF stream is empty.")

    try:
        src_pdf = pikepdf.Pdf.open(io.BytesIO(pdf_bytes))
    except pikepdf.PasswordError as e:
        raise PdfEncryptionError(
            "PDF document is password-protected and cannot be modified without authorization."
        ) from e
    except (pikepdf.PdfError, Exception) as e:
        raise PdfCorruptionError(f"PDF document is corrupted or unreadable: {e}") from e

    try:
        total_pages = len(src_pdf.pages)
        if total_pages == 0:
            raise RemoveValidationError("PDF document contains no pages to remove.")

        remove_list = parse_remove_pages(pages_to_remove, total_pages)
        remove_set = set(remove_list)

        # Compute retained pages (preserves relative order)
        remaining_pages = [p for p in range(1, total_pages + 1) if p not in remove_set]

        target_pdf = pikepdf.Pdf.new()

        # Append remaining pages
        for p in remaining_pages:
            target_pdf.pages.append(src_pdf.pages[p - 1])

        # Remap outlines / bookmarks
        old_to_new = {old_p - 1: new_idx for new_idx, old_p in enumerate(remaining_pages)}
        page_to_index = {page.objgen: idx for idx, page in enumerate(src_pdf.pages)}

        try:
            with target_pdf.open_outline() as target_outline, src_pdf.open_outline() as src_outline:
                for item in src_outline.root:
                    if hasattr(item, "destination") and item.destination and len(item.destination) > 0:
                        target_page_obj = item.destination[0]
                        if hasattr(target_page_obj, "objgen") and target_page_obj.objgen in page_to_index:
                            old_idx = page_to_index[target_page_obj.objgen]
                            # Only include bookmark if its target page was not removed
                            if old_idx in old_to_new:
                                new_idx = old_to_new[old_idx]
                                target_outline.root.append(pikepdf.OutlineItem(item.title, new_idx))
        except Exception as e:
            logger.debug("Outline remapping skipped for remove operation", error=str(e))

        out_buf = io.BytesIO()
        target_pdf.save(
            out_buf,
            object_stream_mode=pikepdf.ObjectStreamMode.generate,
            compress_streams=True,
        )
        return out_buf.getvalue(), output_filename, len(remaining_pages)

    finally:
        src_pdf.close()
