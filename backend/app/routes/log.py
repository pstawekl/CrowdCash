from app import crud
from app.core.database import get_db
from app.schemas import AdminLogCreate
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()

# Endpoint do dodawania logów


@router.post("/create-logs/")
def create_log(log: AdminLogCreate, db: Session = Depends(get_db)):
    return crud.add_admin_log(db=db, log=log)
