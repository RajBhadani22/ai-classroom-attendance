import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routers import attendance, classes, students

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

app = FastAPI(
    title="AI Classroom Attendance",
    description="Automated classroom attendance system using face recognition",
    version="1.0.0",
)

# Wide-open CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created / verified")

    # Ensure upload directories exist
    for subdir in ("students", "sessions"):
        path = os.path.join(UPLOAD_DIR, subdir)
        os.makedirs(path, exist_ok=True)
    logger.info("Upload directories ready at '%s'", UPLOAD_DIR)


# Serve uploaded files as static assets
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(students.router)
app.include_router(classes.router)
app.include_router(attendance.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": "ai-classroom-attendance"}
