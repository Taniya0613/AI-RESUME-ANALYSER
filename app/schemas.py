"""
Pydantic schemas for request validation and response serialization.
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


# ── Auth Schemas ────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=6, description="Minimum 6 characters")


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Public user representation returned in API responses."""
    id: int
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


# ── Resume Schemas ──────────────────────────────────────────────────────────

class ResumeResponse(BaseModel):
    """Full resume analysis response."""
    id: int
    filename: str
    extracted_text: str
    skill_summary: Optional[str] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    improvements: Optional[str] = None
    score: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumeListResponse(BaseModel):
    """Lightweight resume listing (omits full text for performance)."""
    id: int
    filename: str
    score: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}
