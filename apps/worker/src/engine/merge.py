"""Core PDF Merge Engine using pikepdf / QPDF."""

import io
from typing import List, Optional
import pikepdf


class PdfEngineError(Exception):
    """Base exception for PDF engine operations."""
    pass


class PdfEncryptionError(PdfEngineError):
    """Raised when an encrypted PDF document cannot be decrypted without credentials."""
    pass


class PdfCorruptionError(PdfEngineError):
    """Raised when a PDF file is malformed, truncated, or unparseable."""
    pass


def merge_pdf_documents(
    pdf_bytes_list: List[bytes],
    options: Optional[dict] = None
) -> bytes:
    """
    Merge multiple PDF binary streams into a single unified PDF document.
    
    Args:
        pdf_bytes_list: List of raw PDF bytes in the exact order to be merged.
        options: Optional configuration dictionary (e.g. outline handling, compression).
        
    Returns:
        bytes: Merged PDF file content.
        
    Raises:
        PdfEngineError: If fewer than two files are provided.
        PdfEncryptionError: If any input file is password-protected.
        PdfCorruptionError: If any input file is corrupted, malformed, or unparseable.
    """
    if not pdf_bytes_list or len(pdf_bytes_list) < 2:
        raise PdfEngineError("At least two PDF documents are required for a merge operation.")

    options = options or {}
    merged_pdf = pikepdf.Pdf.new()
    opened_sources = []

    try:
        for idx, pdf_bytes in enumerate(pdf_bytes_list):
            if not pdf_bytes:
                raise PdfCorruptionError(f"Input document #{idx + 1} is empty.")

            # Test magic bytes before passing to parser
            if not pdf_bytes.startswith(b"%PDF-") and b"%PDF-" not in pdf_bytes[:1024]:
                raise PdfCorruptionError(
                    f"Input document #{idx + 1} lacks valid PDF magic bytes header."
                )

            stream = io.BytesIO(pdf_bytes)
            try:
                src_pdf = pikepdf.open(stream)
                opened_sources.append(src_pdf)
            except pikepdf.PasswordError as exc:
                raise PdfEncryptionError(
                    f"Document #{idx + 1} is password-protected and cannot be merged without credentials."
                ) from exc
            except (pikepdf.PdfError, pikepdf.DataDecodingError, ValueError, Exception) as exc:
                raise PdfCorruptionError(
                    f"Document #{idx + 1} is corrupted or cannot be parsed: {str(exc)}"
                ) from exc

            # Verify the source document contains at least one page
            if len(src_pdf.pages) == 0:
                raise PdfCorruptionError(f"Document #{idx + 1} contains zero pages.")

            # Append pages from source into merged target
            merged_pdf.pages.extend(src_pdf.pages)

            # Preserve bookmarks / outlines where present and structurally sound
            try:
                page_offset = len(merged_pdf.pages) - len(src_pdf.pages)
                with src_pdf.open_outline() as src_outline:
                    if src_outline and len(src_outline.root) > 0:
                        with merged_pdf.open_outline() as target_outline:
                            for item_idx, item in enumerate(src_outline.root):
                                dest_page = page_offset + min(item_idx, len(src_pdf.pages) - 1)
                                target_outline.root.append(pikepdf.OutlineItem(item.title, dest_page))
            except Exception:
                # If outline structure is non-standard or incompatible, skip outline copy
                # without failing the core page merge
                pass

        # Write merged document to memory buffer
        out_buf = io.BytesIO()
        merged_pdf.save(
            out_buf,
            object_stream_mode=pikepdf.ObjectStreamMode.generate,
            compress_streams=True,
        )
        return out_buf.getvalue()

    finally:
        # Guarantee all opened source file handles and merged target are closed
        for src in opened_sources:
            try:
                src.close()
            except Exception:
                pass
        try:
            merged_pdf.close()
        except Exception:
            pass
