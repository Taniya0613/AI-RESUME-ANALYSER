"""
AI Resume Analyzer API — Application entrypoint.

Sets up the FastAPI app, includes routers, configures CORS,
serves the frontend static files, and creates database tables on startup.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from app.database import engine, Base
from app.routes.auth_routes import router as auth_router
from app.routes.resume_routes import router as resume_router


# ── Lifespan: create tables on startup ──────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all database tables when the application starts."""
    Base.metadata.create_all(bind=engine)
    yield


# ── FastAPI application ────────────────────────────────────────────────────
app = FastAPI(
    title="AI Resume Analyzer API",
    description=(
        "A production-ready REST API that accepts PDF resumes, extracts text, "
        "and uses OpenAI to generate a detailed analysis including skills, "
        "strengths, weaknesses, improvements, and a score out of 100."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS middleware (adjust origins for production) ─────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ───────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(resume_router)


# ── Root redirect to frontend ──────────────────────────────────────────────
@app.get("/", tags=["Frontend"])
async def root_redirect():
    """Redirect root URL to the frontend login page."""
    return RedirectResponse(url="/static/index.html")


# ── Serve frontend static files ────────────────────────────────────────────
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")
