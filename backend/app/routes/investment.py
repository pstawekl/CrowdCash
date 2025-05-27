from uuid import UUID

from app import models, schemas, utils
from app.core.database import get_db
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/investments", tags=["investments"])


@router.post("/", response_model=schemas.InvestmentOut)
async def create_investment(
    investment: schemas.InvestmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Tworzy nową inwestycję w kampanię.
    """
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == investment.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status != 'active':
        raise HTTPException(status_code=400, detail="Campaign is not active")
    db_investment = models.Investment(
        investor_id=current_user.id,
        campaign_id=investment.campaign_id,
        amount=investment.amount,
        status='pending',
    )
    db.add(db_investment)
    # Aktualizacja current_amount w kampanii
    campaign.current_amount = (
        campaign.current_amount or 0) + investment.amount
    db.commit()
    db.refresh(db_investment)
    return db_investment


@router.get("/", response_model=list[schemas.InvestmentOut])
async def list_investments(db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca listę inwestycji zalogowanego użytkownika.
    """
    return db.query(models.Investment).filter(models.Investment.investor_id == current_user.id).all()


@router.get("/campaign/{campaign_id}", response_model=list[schemas.InvestmentOut])
async def list_campaign_investments(campaign_id: UUID, db: Session = Depends(get_db)):
    """
    Zwraca listę inwestycji dla danej kampanii.
    """
    return db.query(models.Investment).filter(models.Investment.campaign_id == campaign_id).all()


@router.get("/history", response_model=list[schemas.InvestmentHistoryOut])
async def investment_history(db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    print(
        f"[DEBUG] /investments/history: current_user={getattr(current_user, 'id', None)}, email={getattr(current_user, 'email', None)}")
    investments = db.query(models.Investment).filter(
        models.Investment.investor_id == current_user.id).all()
    print(
        f"[DEBUG] /investments/history: investments_count={len(investments)}")
    result = []
    for inv in investments:
        campaign = db.query(models.Campaign).filter(
            models.Campaign.id == inv.campaign_id).first()
        print(
            f"[DEBUG] /investments/history: inv_id={inv.id}, campaign_id={getattr(campaign, 'id', None)}")
        result.append({
            "id": inv.id,
            "amount": float(inv.amount),
            "status": inv.status,
            "created_at": inv.created_at,
            "campaign_id": campaign.id if campaign else None,
            "campaign_title": campaign.title if campaign else None,
            "campaign_status": campaign.status if campaign else None
        })
    print(f"[DEBUG] /investments/history: result_count={len(result)}")
    return result


@router.get("/{investment_id}", response_model=schemas.InvestmentOut)
async def get_investment(investment_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca szczegóły inwestycji (tylko właściciel lub admin).
    """
    investment = db.query(models.Investment).filter(
        models.Investment.id == investment_id).first()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    if investment.investor_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return investment
