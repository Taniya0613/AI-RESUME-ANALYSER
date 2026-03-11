"""
AI service for resume analysis using OpenAI ChatCompletion API.

Sends the extracted resume text to OpenAI with a structured HR recruiter
prompt and parses the JSON response.
"""

import json
import os
from typing import Any

from openai import OpenAI
from fastapi import HTTPException, status
from dotenv import load_dotenv

load_dotenv()

# ── Lazy OpenAI client (avoids crash if key is not set at import time) ──────
_client: OpenAI | None = None


def _get_client() -> OpenAI:
    """Return (and cache) an OpenAI client using the configured API key."""
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OPENAI_API_KEY is not configured on the server.",
            )
        _client = OpenAI(api_key=api_key)
    return _client


# ── System prompt ───────────────────────────────────────────────────────────
SYSTEM_PROMPT = (
    "Act as an experienced technical HR recruiter.\n"
    "Analyze the following resume and provide:\n"
    "1. Key Skills\n"
    "2. Strengths\n"
    "3. Weaknesses\n"
    "4. Improvement Suggestions\n"
    "5. Resume Score out of 100\n\n"
    "Return response strictly in JSON format with the following keys:\n"
    '  "skill_summary", "strengths", "weaknesses", "improvements", "score"\n'
    "Each value should be a string except score which should be a number."
)


async def analyze_resume(resume_text: str) -> dict[str, Any]:
    """
    Send resume text to OpenAI and return structured analysis.

    Args:
        resume_text: Plain text extracted from the resume PDF.

    Returns:
        Dict with keys: skill_summary, strengths, weaknesses, improvements, score.

    Raises:
        HTTPException 502: If the OpenAI API call fails.
        HTTPException 422: If the response cannot be parsed as valid JSON.
    """
    try:
        response = _get_client().chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": resume_text},
            ],
            temperature=0.4,
            max_tokens=1500,
        )
    except HTTPException:
        raise  # Re-raise our own missing-key error
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI API request failed: {str(exc)}",
        )

    # Extract the assistant's reply
    raw_content: str = response.choices[0].message.content.strip()

    # ── Safely parse JSON (handle markdown-wrapped code blocks) ─────────
    if raw_content.startswith("```"):
        # Strip ```json ... ``` wrapper
        lines = raw_content.split("\n")
        raw_content = "\n".join(lines[1:-1]).strip()

    try:
        analysis: dict[str, Any] = json.loads(raw_content)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Failed to parse AI response as JSON. Please try again.",
        )

    # Ensure all expected keys exist with sensible defaults
    return {
        "skill_summary": str(analysis.get("skill_summary", "")),
        "strengths": str(analysis.get("strengths", "")),
        "weaknesses": str(analysis.get("weaknesses", "")),
        "improvements": str(analysis.get("improvements", "")),
        "score": float(analysis.get("score", 0)),
    }

