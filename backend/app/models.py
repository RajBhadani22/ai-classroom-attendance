import json
from datetime import datetime, date
from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey,
    Integer, String, Text
)
from sqlalchemy.orm import relationship
from .database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    roll_number = Column(String, unique=True, nullable=False, index=True)
    face_encodings = Column(Text, nullable=True)  # JSON-serialized list of encoding arrays
    photo_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    attendance_records = relationship("AttendanceRecord", back_populates="student")

    def get_face_encodings(self):
        if self.face_encodings:
            return json.loads(self.face_encodings)
        return []

    def set_face_encodings(self, encodings: list):
        self.face_encodings = json.dumps(encodings)


class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("AttendanceSession", back_populates="class_")


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    image_path = Column(String, nullable=True)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    class_ = relationship("Class", back_populates="sessions")
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("attendance_sessions.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    status = Column(String, nullable=False, default="absent")  # "present", "absent", "unknown"
    confidence = Column(Float, nullable=True)
    is_manual_override = Column(Boolean, default=False)
    face_location = Column(Text, nullable=True)  # JSON serialized [top, right, bottom, left]
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")
