"""
Resume routes: upload, history, and detail retrieval.

All endpoints require JWT authentication.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, Resume
from app.schemas import ResumeResponse, ResumeListResponse
from app.auth import get_current_user
from app.resume_parser import extract_text_from_pdf
from app.ai_service import analyze_resume

router = APIRouter(prefix="/resume", tags=["Resume"])


@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a PDF resume for AI-powered analysis.

    Steps:
    1. Validate the uploaded file is a PDF.
    2. Extract text from the PDF.
    3. Send text to OpenAI for analysis.
    4. Store the filename, extracted text, and analysis in the database.
    """
    # ── Validate file type ──────────────────────────────────────────────
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted.",
        )

    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file content type. Please upload a PDF.",
        )

    # ── Read file bytes ─────────────────────────────────────────────────
    file_bytes = await file.read()

    # ── Extract text from PDF ───────────────────────────────────────────
    extracted_text = extract_text_from_pdf(file_bytes)

    # ── Analyze with OpenAI ─────────────────────────────────────────────
    analysis = await analyze_resume(extracted_text)

    # ── Persist to database ─────────────────────────────────────────────
    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        extracted_text=extracted_text,
        skill_summary=analysis["skill_summary"],
        strengths=analysis["strengths"],
        weaknesses=analysis["weaknesses"],
        improvements=analysis["improvements"],
        score=analysis["score"],
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


@router.get("/history", response_model=List[ResumeListResponse])
async def get_resume_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve a list of all resumes uploaded by the current user.

    Returns a lightweight listing (no full text) ordered by most recent first.
    """
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )
    return resumes


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume_detail(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve full details and analysis of a specific resume.

    Returns 404 if the resume does not exist or does not belong to the current user.
    """
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )
    return resume
