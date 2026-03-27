import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Class
from ..schemas import ClassCreate, ClassResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/classes", tags=["classes"])


@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(payload: ClassCreate, db: Session = Depends(get_db)):
    class_ = Class(name=payload.name, subject=payload.subject)
    db.add(class_)
    db.commit()
    db.refresh(class_)
    logger.info("Created class '%s' (%s)", class_.name, class_.subject)
    return class_


@router.get("", response_model=List[ClassResponse])
def list_classes(db: Session = Depends(get_db)):
    return db.query(Class).order_by(Class.name).all()


@router.get("/{class_id}", response_model=ClassResponse)
def get_class(class_id: int, db: Session = Depends(get_db)):
    class_ = db.query(Class).filter(Class.id == class_id).first()
    if not class_:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    return class_
