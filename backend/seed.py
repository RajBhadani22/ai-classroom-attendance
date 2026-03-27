"""
Seed script – populates the database with sample classes and students.
Run from the backend/ directory:

    python seed.py
"""

import sys
import os

# Allow importing the app package
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv

load_dotenv(".env.example")  # load defaults if no real .env present

from app.database import Base, engine, SessionLocal
from app.models import Class, Student

CLASSES = [
    {"name": "Math 101", "subject": "Mathematics"},
    {"name": "Science 201", "subject": "Science"},
    {"name": "History 101", "subject": "History"},
]

STUDENTS = [
    {"name": "Alice Johnson", "roll_number": "S001"},
    {"name": "Bob Smith", "roll_number": "S002"},
    {"name": "Carol White", "roll_number": "S003"},
    {"name": "David Brown", "roll_number": "S004"},
    {"name": "Eva Martinez", "roll_number": "S005"},
    {"name": "Frank Lee", "roll_number": "S006"},
    {"name": "Grace Kim", "roll_number": "S007"},
    {"name": "Henry Wilson", "roll_number": "S008"},
    {"name": "Isla Davis", "roll_number": "S009"},
    {"name": "James Taylor", "roll_number": "S010"},
]


def seed():
    print("Creating database tables …")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ── Classes ──────────────────────────────────────────────────────────
        print("\nSeeding classes …")
        for data in CLASSES:
            existing = db.query(Class).filter(Class.name == data["name"]).first()
            if existing:
                print(f"  [skip] Class '{data['name']}' already exists")
                continue
            class_ = Class(**data)
            db.add(class_)
            db.flush()
            print(f"  [ok]   Class '{class_.name}' (id={class_.id})")

        db.commit()

        # ── Students ─────────────────────────────────────────────────────────
        print("\nSeeding students …")
        for data in STUDENTS:
            existing = db.query(Student).filter(
                Student.roll_number == data["roll_number"]
            ).first()
            if existing:
                print(f"  [skip] Student '{data['name']}' ({data['roll_number']}) already exists")
                continue
            student = Student(
                name=data["name"],
                roll_number=data["roll_number"],
                # No face encodings for seed data – real photos required
            )
            db.add(student)
            db.flush()
            print(f"  [ok]   Student '{student.name}' (id={student.id})")

        db.commit()
        print("\nSeed complete ✓")
    except Exception as exc:
        db.rollback()
        print(f"\nSeed failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
