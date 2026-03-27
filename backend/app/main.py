import logging
import os
from contextlib import asynccontextmanager

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and upload dirs
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created / verified")
    for subdir in ("students", "sessions"):
        path = os.path.join(UPLOAD_DIR, subdir)
        os.makedirs(path, exist_ok=True)
    logger.info("Upload directories ready at '%s'", UPLOAD_DIR)
    yield
    # Shutdown: nothing to clean up for SQLite


app = FastAPI(
    title="AI Classroom Attendance",
    description="Automated classroom attendance system using face recognition",
    version="1.0.0",
    lifespan=lifespan,
)

# Wide-open CORS for development – restrict origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
