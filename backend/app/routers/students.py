import json
import logging
import os
from typing import List

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..face_recognition_service import encode_face, validate_image
from ..models import Student
from ..schemas import StudentCreate, StudentResponse
from ..utils import validate_image_file

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/students", tags=["students"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.roll_number == payload.roll_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student with roll number '{payload.roll_number}' already exists",
        )
    student = Student(name=payload.name, roll_number=payload.roll_number)
    db.add(student)
    db.commit()
    db.refresh(student)
    logger.info("Created student %s (%s)", student.name, student.roll_number)
    return student


@router.get("", response_model=List[StudentResponse])
def list_students(db: Session = Depends(get_db)):
    return db.query(Student).filter(Student.is_active.is_(True)).order_by(Student.name).all()


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


@router.post("/{student_id}/photos", response_model=StudentResponse)
async def upload_photos(
    student_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id, Student.is_active.is_(True)).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files provided")

    student_upload_dir = os.path.join(UPLOAD_DIR, "students", str(student_id))
    os.makedirs(student_upload_dir, exist_ok=True)

    existing_encodings: list = student.get_face_encodings()
    new_encodings_count = 0
    errors: list[str] = []

    for upload in files:
        content_type = upload.content_type or "application/octet-stream"
        image_bytes = await upload.read()

        ok, err = validate_image_file(content_type, len(image_bytes))
        if not ok:
            errors.append(f"{upload.filename}: {err}")
            continue

        if not validate_image(image_bytes):
            errors.append(f"{upload.filename}: No face detected in image")
            continue

        encodings = encode_face(image_bytes)
        if not encodings:
            errors.append(f"{upload.filename}: Could not encode face")
            continue

        existing_encodings.extend(encodings)
        new_encodings_count += len(encodings)

        # Persist file
        safe_name = f"{student.photo_count + new_encodings_count}_{upload.filename}"
        dest = os.path.join(student_upload_dir, safe_name)
        async with aiofiles.open(dest, "wb") as f:
            await f.write(image_bytes)

    if new_encodings_count == 0 and errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "No valid face photos processed", "errors": errors},
        )

    student.set_face_encodings(existing_encodings)
    student.photo_count += new_encodings_count
    db.commit()
    db.refresh(student)

    if errors:
        logger.warning("Photo upload partial errors for student %d: %s", student_id, errors)

    logger.info(
        "Added %d face encoding(s) for student %s", new_encodings_count, student.roll_number
    )
    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    student.is_active = False
    db.commit()
    logger.info("Soft-deleted student %d", student_id)
