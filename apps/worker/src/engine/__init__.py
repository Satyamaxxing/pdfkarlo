"""PDF Engine package."""

from apps.worker.src.engine.merge import (
    merge_pdf_documents,
    PdfEngineError,
    PdfEncryptionError,
    PdfCorruptionError,
)
from apps.worker.src.engine.split import (
    split_pdf_document,
    SplitMode,
    SplitValidationError,
    parse_ranges_string,
    parse_pages_string,
)
from apps.worker.src.engine.rotate import (
    rotate_pdf_document,
    RotateValidationError,
    validate_rotation_angle,
    parse_rotate_pages,
)
from apps.worker.src.engine.reorder import (
    reorder_pdf_document,
    ReorderValidationError,
    validate_page_sequence,
)
from apps.worker.src.engine.remove import (
    remove_pdf_pages,
    RemoveValidationError,
    parse_remove_pages,
)

__all__ = [
    "merge_pdf_documents",
    "split_pdf_document",
    "SplitMode",
    "SplitValidationError",
    "parse_ranges_string",
    "parse_pages_string",
    "rotate_pdf_document",
    "RotateValidationError",
    "validate_rotation_angle",
    "parse_rotate_pages",
    "reorder_pdf_document",
    "ReorderValidationError",
    "validate_page_sequence",
    "remove_pdf_pages",
    "RemoveValidationError",
    "parse_remove_pages",
    "PdfEngineError",
    "PdfEncryptionError",
    "PdfCorruptionError",
]
