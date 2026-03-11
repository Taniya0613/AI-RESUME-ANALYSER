"""
PDF resume text extractor using PyMuPDF (fitz).

Handles empty, corrupted, and non-PDF files gracefully.
"""

import fitz  # PyMuPDF
from fastapi import HTTPException, status


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract all text content from a PDF file.

    Args:
        file_bytes: Raw bytes of the uploaded PDF.

    Returns:
        Cleaned concatenated text from every page.

    Raises:
        HTTPException 400: If the file is empty, corrupted, or contains no text.
    """
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to read the PDF file. It may be corrupted or not a valid PDF.",
        )

    # Extract text from every page
    text_parts: list[str] = []
    for page_num in range(len(doc)):
        page_text = doc[page_num].get_text()
        if page_text:
            text_parts.append(page_text.strip())

    doc.close()

    full_text = "\n".join(text_parts).strip()
    if not full_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text found in the PDF. The file may be image-based or empty.",
        )

    return full_text
