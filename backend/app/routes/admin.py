from uuid import UUID

from app import models, schemas, utils
from app.core.database import get_db
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/admin", tags=["admin"])


def admin_required(current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/users", response_model=list[schemas.UserOut])
async def list_users(db: Session = Depends(get_db), current_user: models.User = Depends(admin_required)):
    """
    Zwraca listę wszystkich użytkowników (tylko admin).
    """
    return db.query(models.User).all()


@router.get("/campaigns", response_model=list[schemas.CampaignOut])
async def list_campaigns(db: Session = Depends(get_db), current_user: models.User = Depends(admin_required)):
    """
    Zwraca listę wszystkich kampanii (tylko admin).
    """
    return db.query(models.Campaign).all()


@router.get("/investments", response_model=list[schemas.InvestmentOut])
async def list_investments(db: Session = Depends(get_db), current_user: models.User = Depends(admin_required)):
    """
    Zwraca listę wszystkich inwestycji (tylko admin).
    """
    return db.query(models.Investment).all()


@router.get("/transactions", response_model=list[schemas.TransactionOut])
async def list_transactions(db: Session = Depends(get_db), current_user: models.User = Depends(admin_required)):
    """
    Zwraca listę wszystkich transakcji (tylko admin).
    """
    return db.query(models.Transaction).all()
