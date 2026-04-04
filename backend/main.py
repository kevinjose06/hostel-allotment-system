import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import (
    auth,
    admin,
    advisor,
    student,
    application,
    allotment,
    hostel,
    document,
)

load_dotenv()

app = FastAPI(
    title="RIT Hostel Allotment API",
    description=(
        "Backend for the Hostel Admission and Allotment System, "
        "Rajiv Gandhi Institute of Technology, Kottayam."
    ),
    version="1.0.0",
    docs_url="/docs",       # Swagger UI  — visit /docs in browser
    redoc_url="/redoc",     # ReDoc UI    — visit /redoc in browser
)

# ── CORS ─────────────────────────────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL")
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
if FRONTEND_URL:
    # Handle the trailing slash issue automatically
    origins.append(FRONTEND_URL.rstrip('/'))
    origins.append(FRONTEND_URL.rstrip('/') + '/')

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(advisor.router)
app.include_router(student.router)
app.include_router(application.router)
app.include_router(allotment.router)
app.include_router(hostel.router)
app.include_router(document.router)


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}


# ── Root ─────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "project": "RGIT Hostel Allotment API",
        "docs": "/docs",
        "health": "/health"
    }
