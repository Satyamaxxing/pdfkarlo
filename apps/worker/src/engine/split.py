"""Core PDF Split Engine using pikepdf / QPDF."""

import io
import re
import zipfile
from enum import Enum
from typing import Dict, List, Optional, Tuple, Union
import pikepdf

from apps.worker.src.engine.merge import (
    PdfCorruptionError,
    PdfEncryptionError,
    PdfEngineError,
)


class SplitMode(str, Enum):
    RANGE = "range"
    EXTRACT = "extract"
    BURST = "burst"


class SplitValidationError(PdfEngineError):
    """Raised when user-specified page numbers or ranges are invalid or out of bounds."""
    pass


def parse_ranges_string(ranges_str: str, total_pages: int) -> List[Tuple[int, int]]:
    """
    Parse a range expression string such as '1-3, 4-6, 8-10' or '1-2, 5'.
    
    Returns:
        List of 1-indexed (start, end) tuples.
        
    Raises:
        SplitValidationError: If ranges are invalid, malformed, or out of bounds.
    """
    if not ranges_str or not ranges_str.strip():
        raise SplitValidationError("Page range expression cannot be empty.")

    clean_str = ranges_str.strip()
    segments = [s.strip() for s in clean_str.split(",") if s.strip()]
    if not segments:
        raise SplitValidationError("No valid range segments found.")

    parsed_ranges: List[Tuple[int, int]] = []
    seen_pages = set()

    for seg in segments:
        if "-" in seg:
            parts = [p.strip() for p in seg.split("-") if p.strip()]
            if len(parts) != 2:
                raise SplitValidationError(f"Invalid range segment format: '{seg}'. Expected format like '1-5'.")
            try:
                start, end = int(parts[0]), int(parts[1])
            except ValueError:
                raise SplitValidationError(f"Non-numeric values in range segment: '{seg}'.")
        else:
            try:
                start = end = int(seg)
            except ValueError:
                raise SplitValidationError(f"Non-numeric page number: '{seg}'.")

        if start < 1:
            raise SplitValidationError(f"Start page must be at least 1 (got {start} in '{seg}').")
        if end > total_pages:
            raise SplitValidationError(
                f"Page number {end} exceeds total document pages ({total_pages}) in '{seg}'."
            )
        if start > end:
            raise SplitValidationError(f"Start page cannot be greater than end page in '{seg}' ({start} > {end}).")

        # Check for overlapping ranges
        current_pages = set(range(start, end + 1))
        overlap = seen_pages.intersection(current_pages)
        if overlap:
            overlap_sorted = sorted(list(overlap))
            raise SplitValidationError(
                f"Overlapping page range detected: page(s) {overlap_sorted} appear in multiple ranges."
            )

        seen_pages.update(current_pages)
        parsed_ranges.append((start, end))

    return parsed_ranges


def parse_pages_string(pages_str: str, total_pages: int) -> List[int]:
    """
    Parse a comma-separated or space-separated list of individual page numbers such as '1, 3, 5'.
    
    Returns:
        List of 1-indexed page integers.
        
    Raises:
        SplitValidationError: If page numbers are invalid or out of bounds.
    """
    if not pages_str or not pages_str.strip():
        raise SplitValidationError("Page list cannot be empty.")

    tokens = re.split(r"[,;\s]+", pages_str.strip())
    page_numbers: List[int] = []

    for t in tokens:
        if not t:
            continue
        try:
            p = int(t)
        except ValueError:
            raise SplitValidationError(f"Invalid page number token: '{t}'.")

        if p < 1:
            raise SplitValidationError(f"Page number must be at least 1 (got {p}).")
        if p > total_pages:
            raise SplitValidationError(f"Page number {p} exceeds document total page count ({total_pages}).")

        if p not in page_numbers:
            page_numbers.append(p)

    if not page_numbers:
        raise SplitValidationError("No valid page numbers provided.")

    return page_numbers


def split_pdf_document(
    pdf_bytes: bytes,
    mode: Union[SplitMode, str] = SplitMode.RANGE,
    options: Optional[dict] = None
) -> List[Dict[str, Union[str, bytes, int, bool]]]:
    """
    Split a source PDF document into one or more output documents.
    
    Modes:
      - RANGE: Split by page ranges (e.g. '1-3, 4-6').
      - EXTRACT: Extract specific pages (e.g. [1, 3, 5]) into a single PDF.
      - BURST: Extract every page into its own individual PDF.
      
    Returns:
      List of dicts representing generated files:
      [
        {"filename": "part_1.pdf", "bytes": b"...", "page_count": 2, "is_zip": False},
        ...
        {"filename": "split_documents.zip", "bytes": b"...", "page_count": N, "is_zip": True} (if > 1 file)
      ]
    """
    if not pdf_bytes:
        raise PdfCorruptionError("Uploaded PDF content is empty.")

    if not pdf_bytes.startswith(b"%PDF-") and b"%PDF-" not in pdf_bytes[:1024]:
        raise PdfCorruptionError("Uploaded file lacks a valid PDF header signature.")

    options = options or {}
    stream = io.BytesIO(pdf_bytes)

    try:
        src_pdf = pikepdf.open(stream)
    except pikepdf.PasswordError as exc:
        raise PdfEncryptionError(
            "Document is password-protected and cannot be split without credentials."
        ) from exc
    except (pikepdf.PdfError, pikepdf.DataDecodingError, ValueError, Exception) as exc:
        raise PdfCorruptionError(f"Document is corrupted or cannot be parsed: {str(exc)}") from exc

    total_pages = len(src_pdf.pages)
    if total_pages == 0:
        src_pdf.close()
        raise PdfCorruptionError("Document contains zero pages.")

    mode_str = mode.value.lower() if hasattr(mode, "value") else str(mode).lower()
    generated_files: List[Dict[str, Union[str, bytes, int, bool]]] = []

    try:
        # MODE A: Split by Page Ranges
        if mode_str == SplitMode.RANGE.value:
            ranges_input = options.get("ranges")
            if isinstance(ranges_input, list):
                # Structured list: [{"from": 1, "to": 3}, ...]
                parsed_ranges = []
                seen_pages = set()
                for item in ranges_input:
                    start = int(item.get("from", 1))
                    end = int(item.get("to", total_pages))
                    if start < 1 or end > total_pages or start > end:
                        raise SplitValidationError(f"Invalid range bounds: {start}-{end}")
                    current_pages = set(range(start, end + 1))
                    if seen_pages.intersection(current_pages):
                        raise SplitValidationError(f"Overlapping page range detected for pages {start}-{end}.")
                    seen_pages.update(current_pages)
                    parsed_ranges.append((start, end))
            else:
                ranges_str = str(ranges_input or f"1-{total_pages}")
                parsed_ranges = parse_ranges_string(ranges_str, total_pages)

            base_name = options.get("base_filename", "document")
            if base_name.endswith(".pdf"):
                base_name = base_name[:-4]

            for idx, (start, end) in enumerate(parsed_ranges):
                part_pdf = pikepdf.Pdf.new()
                for p_idx in range(start - 1, end):
                    part_pdf.pages.append(src_pdf.pages[p_idx])

                out_buf = io.BytesIO()
                part_pdf.save(out_buf, object_stream_mode=pikepdf.ObjectStreamMode.generate, compress_streams=True)
                part_pdf.close()

                filename = f"{base_name}_part_{idx + 1}_pages_{start}-{end}.pdf"
                generated_files.append({
                    "filename": filename,
                    "bytes": out_buf.getvalue(),
                    "page_count": end - start + 1,
                    "is_zip": False,
                })

        # MODE B: Extract Specific Pages into a single output PDF
        elif mode_str == SplitMode.EXTRACT.value:
            pages_input = options.get("pages")
            if isinstance(pages_input, list):
                pages_list = [int(p) for p in pages_input]
                # Validate bounds
                for p in pages_list:
                    if p < 1 or p > total_pages:
                        raise SplitValidationError(f"Page number {p} is out of bounds (1-{total_pages}).")
            else:
                pages_str = str(pages_input or "1")
                pages_list = parse_pages_string(pages_str, total_pages)

            part_pdf = pikepdf.Pdf.new()
            for p in pages_list:
                part_pdf.pages.append(src_pdf.pages[p - 1])

            out_buf = io.BytesIO()
            part_pdf.save(out_buf, object_stream_mode=pikepdf.ObjectStreamMode.generate, compress_streams=True)
            part_pdf.close()

            filename = options.get("output_filename", "extracted_pages.pdf")
            if not filename.endswith(".pdf"):
                filename += ".pdf"

            generated_files.append({
                "filename": filename,
                "bytes": out_buf.getvalue(),
                "page_count": len(pages_list),
                "is_zip": False,
            })

        # MODE C: Burst (Extract every page into individual 1-page PDFs)
        elif mode_str == SplitMode.BURST.value:
            base_name = options.get("base_filename", "document")
            if base_name.endswith(".pdf"):
                base_name = base_name[:-4]

            for p_idx in range(total_pages):
                part_pdf = pikepdf.Pdf.new()
                part_pdf.pages.append(src_pdf.pages[p_idx])

                out_buf = io.BytesIO()
                part_pdf.save(out_buf, object_stream_mode=pikepdf.ObjectStreamMode.generate, compress_streams=True)
                part_pdf.close()

                filename = f"{base_name}_page_{p_idx + 1}.pdf"
                generated_files.append({
                    "filename": filename,
                    "bytes": out_buf.getvalue(),
                    "page_count": 1,
                    "is_zip": False,
                })

        else:
            raise SplitValidationError(f"Unsupported split mode: '{mode}'. Expected range, extract, or burst.")

        # If multiple files are generated, also create a consolidated ZIP bundle for convenience
        if len(generated_files) > 1:
            zip_buf = io.BytesIO()
            with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
                for f in generated_files:
                    zf.writestr(str(f["filename"]), bytes(f["bytes"]))

            generated_files.append({
                "filename": f"{options.get('base_filename', 'split_documents')}.zip",
                "bytes": zip_buf.getvalue(),
                "page_count": total_pages,
                "is_zip": True,
            })

        return generated_files

    finally:
        src_pdf.close()
