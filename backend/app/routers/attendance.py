import json
import logging
import os
from datetime import date
from typing import List, Optional

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..face_recognition_service import process_classroom_image
from ..models import AttendanceRecord, AttendanceSession, Class, Student
from ..schemas import (
    AttendanceRecordUpdate,
    AttendanceSessionResponse,
    AttendanceSessionSummary,
)
from ..utils import build_csv_response, validate_image_file

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/attendance", tags=["attendance"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")


# ── helpers ──────────────────────────────────────────────────────────────────

def _get_session_or_404(session_id: int, db: Session) -> AttendanceSession:
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


def _session_summary(session: AttendanceSession) -> dict:
    records = session.records
    return {
        "id": session.id,
        "class_id": session.class_id,
        "date": session.date,
        "image_path": session.image_path,
        "processed": session.processed,
        "created_at": session.created_at,
        "total_students": len(records),
        "present_count": sum(1 for r in records if r.status == "present"),
        "absent_count": sum(1 for r in records if r.status == "absent"),
        "unknown_count": sum(1 for r in records if r.status == "unknown"),
    }


# ── endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/sessions",
    response_model=AttendanceSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_session(
    class_id: int,
    session_date: date = Query(default=None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Validate class
    class_ = db.query(Class).filter(Class.id == class_id).first()
    if not class_:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    content_type = image.content_type or "application/octet-stream"
    image_bytes = await image.read()
    ok, err = validate_image_file(content_type, len(image_bytes))
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err)

    target_date = session_date or date.today()

    # Save image
    session_upload_dir = os.path.join(UPLOAD_DIR, "sessions")
    os.makedirs(session_upload_dir, exist_ok=True)
    image_filename = f"class{class_id}_{target_date}_{image.filename}"
    image_path = os.path.join(session_upload_dir, image_filename)
    async with aiofiles.open(image_path, "wb") as f:
        await f.write(image_bytes)

    # Create session record
    session = AttendanceSession(class_id=class_id, date=target_date, image_path=image_path)
    db.add(session)
    db.flush()  # get session.id without committing

    # Fetch active students
    students = db.query(Student).filter(Student.is_active.is_(True)).all()

    # Run face recognition
    try:
        matches = process_classroom_image(image_bytes, students)
    except Exception as exc:
        logger.error("Face recognition failed: %s", exc)
        matches = []

    # Build a set of student IDs detected as present
    detected_student_ids = {
        m["student_id"] for m in matches if m["student_id"] is not None
    }

    # Create records for each known student (present / absent)
    student_records: dict[int, AttendanceRecord] = {}
    for student in students:
        record_status = "present" if student.id in detected_student_ids else "absent"
        confidence = next(
            (m["confidence"] for m in matches if m["student_id"] == student.id), None
        )
        face_location = next(
            (
                json.dumps(m["face_location"])
                for m in matches
                if m["student_id"] == student.id
            ),
            None,
        )
        record = AttendanceRecord(
            session_id=session.id,
            student_id=student.id,
            status=record_status,
            confidence=confidence,
            face_location=face_location,
        )
        db.add(record)
        student_records[student.id] = record

    # Create records for unknown faces
    for match in matches:
        if match["student_id"] is None:
            record = AttendanceRecord(
                session_id=session.id,
                student_id=None,
                status="unknown",
                confidence=None,
                face_location=json.dumps(match["face_location"]),
            )
            db.add(record)

    session.processed = True
    db.commit()
    db.refresh(session)
    logger.info(
        "Session %d processed: %d present, %d absent, %d unknown",
        session.id,
        len(detected_student_ids),
        len(students) - len(detected_student_ids),
        sum(1 for m in matches if m["student_id"] is None),
    )
    return session


@router.get("/sessions", response_model=List[AttendanceSessionSummary])
def list_sessions(
    class_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    query = db.query(AttendanceSession)
    if class_id is not None:
        query = query.filter(AttendanceSession.class_id == class_id)
    if start_date:
        query = query.filter(AttendanceSession.date >= start_date)
    if end_date:
        query = query.filter(AttendanceSession.date <= end_date)
    sessions = query.order_by(AttendanceSession.date.desc()).all()
    return [_session_summary(s) for s in sessions]


@router.get("/sessions/{session_id}", response_model=AttendanceSessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    return _get_session_or_404(session_id, db)


@router.put("/sessions/{session_id}/records/{record_id}", response_model=dict)
def update_record(
    session_id: int,
    record_id: int,
    payload: AttendanceRecordUpdate,
    db: Session = Depends(get_db),
):
    _get_session_or_404(session_id, db)
    record = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.id == record_id,
            AttendanceRecord.session_id == session_id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    record.status = payload.status
    record.is_manual_override = True
    db.commit()
    db.refresh(record)
    logger.info("Manual override: record %d set to '%s'", record_id, payload.status)
    return {"id": record.id, "status": record.status, "is_manual_override": record.is_manual_override}


@router.post("/sessions/{session_id}/confirm", response_model=dict)
def confirm_session(session_id: int, db: Session = Depends(get_db)):
    session = _get_session_or_404(session_id, db)
    if not session.processed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session has not been processed yet",
        )
    db.commit()
    logger.info("Session %d confirmed", session_id)
    return {"message": "Session confirmed", "session_id": session_id}


@router.get("/export")
def export_attendance(
    class_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(AttendanceRecord)
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .join(Student, AttendanceRecord.student_id == Student.id, isouter=True)
    )
    if class_id is not None:
        query = query.filter(AttendanceSession.class_id == class_id)
    if start_date:
        query = query.filter(AttendanceSession.date >= start_date)
    if end_date:
        query = query.filter(AttendanceSession.date <= end_date)

    records = query.order_by(AttendanceSession.date, Student.name).all()

    rows = [
        {
            "session_id": r.session_id,
            "date": r.session.date.isoformat(),
            "class_id": r.session.class_id,
            "student_id": r.student_id or "",
            "student_name": r.student.name if r.student else "Unknown",
            "roll_number": r.student.roll_number if r.student else "",
            "status": r.status,
            "confidence": r.confidence if r.confidence is not None else "",
            "is_manual_override": r.is_manual_override,
        }
        for r in records
    ]

    fieldnames = [
        "session_id", "date", "class_id", "student_id",
        "student_name", "roll_number", "status", "confidence", "is_manual_override",
    ]
    csv_content = build_csv_response(rows, fieldnames)

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_export.csv"},
    )
