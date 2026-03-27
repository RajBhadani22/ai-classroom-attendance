from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, field_validator


# ── Student schemas ──────────────────────────────────────────────────────────

class StudentCreate(BaseModel):
    name: str
    roll_number: str

    @field_validator("name", "roll_number")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field must not be empty")
        return v


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class StudentResponse(BaseModel):
    id: int
    name: str
    roll_number: str
    photo_count: int
    created_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}


# ── Class schemas ────────────────────────────────────────────────────────────

class ClassCreate(BaseModel):
    name: str
    subject: str

    @field_validator("name", "subject")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field must not be empty")
        return v


class ClassResponse(BaseModel):
    id: int
    name: str
    subject: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Attendance Record schemas ─────────────────────────────────────────────────

class AttendanceRecordResponse(BaseModel):
    id: int
    session_id: int
    student_id: Optional[int]
    status: str
    confidence: Optional[float]
    is_manual_override: bool
    face_location: Optional[str]
    created_at: datetime
    student: Optional[StudentResponse] = None

    model_config = {"from_attributes": True}


class AttendanceRecordUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        allowed = {"present", "absent", "unknown"}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v


# ── Attendance Session schemas ────────────────────────────────────────────────

class AttendanceSessionResponse(BaseModel):
    id: int
    class_id: int
    date: date
    image_path: Optional[str]
    processed: bool
    created_at: datetime
    records: List[AttendanceRecordResponse] = []

    model_config = {"from_attributes": True}


class AttendanceSessionSummary(BaseModel):
    id: int
    class_id: int
    date: date
    image_path: Optional[str]
    processed: bool
    created_at: datetime
    total_students: int = 0
    present_count: int = 0
    absent_count: int = 0
    unknown_count: int = 0

    model_config = {"from_attributes": True}
