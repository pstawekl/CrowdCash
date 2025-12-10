from decimal import Decimal
from typing import Optional
from uuid import UUID

from app import models, schemas, utils
from app.core.database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query
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
    # NIE aktualizujemy current_amount tutaj - będzie aktualizowane tylko gdy płatność zostanie approved
    # current_amount jest aktualizowane w webhooku Stripe gdy płatność zostanie zatwierdzona
    db.commit()
    db.refresh(db_investment)

    # Konwertuj UUID na stringi
    db_investment.id = str(db_investment.id)
    db_investment.campaign_id = str(db_investment.campaign_id)
    db_investment.investor_id = str(db_investment.investor_id)

    return db_investment


@router.get("/", response_model=list[schemas.InvestmentOut])
async def list_investments(db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca listę inwestycji zalogowanego użytkownika.
    """
    investments = db.query(models.Investment).filter(
        models.Investment.investor_id == current_user.id).all()

    # Konwertuj UUID na stringi
    for inv in investments:
        inv.id = str(inv.id)
        inv.campaign_id = str(inv.campaign_id)
        inv.investor_id = str(inv.investor_id)

    return investments


@router.get("/stats")
async def get_investment_stats(db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca statystyki inwestycji użytkownika (liczba i suma).
    Liczy tylko completed inwestycje (approved płatności).
    """
    from decimal import Decimal

    # Tylko completed inwestycje (approved płatności)
    investments = db.query(models.Investment).join(
        models.Transaction
    ).filter(
        models.Investment.investor_id == current_user.id,
        models.Investment.status == 'completed',
        models.Transaction.status == 'successful'
    ).all()

    total_amount = sum(Decimal(str(inv.amount)) for inv in investments)
    count = len(investments)

    return {
        "count": count,
        "total_amount": float(total_amount)
    }


@router.get("/campaign/{campaign_id}", response_model=list[schemas.InvestmentOut])
async def list_campaign_investments(campaign_id: UUID, db: Session = Depends(get_db)):
    """
    Zwraca listę inwestycji dla danej kampanii.
    Zwraca wszystkie inwestycje (również pending), ale frontend powinien filtrować do wyświetlenia.
    """
    investments = db.query(models.Investment).filter(
        models.Investment.campaign_id == campaign_id).all()

    # Konwertuj UUID na stringi
    for inv in investments:
        inv.id = str(inv.id)
        inv.campaign_id = str(inv.campaign_id)
        inv.investor_id = str(inv.investor_id)

    return investments


@router.get("/history", response_model=list[schemas.InvestmentHistoryOut])
async def investment_history(
    limit: Optional[int] = Query(default=None, description="Limit wyników"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    print(
        f"[DEBUG] /investments/history: current_user={getattr(current_user, 'id', None)}, email={getattr(current_user, 'email', None)}")
    query = db.query(models.Investment).filter(
        models.Investment.investor_id == current_user.id)

    if limit:
        query = query.limit(limit)

    investments = query.all()
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
            "campaign_id": str(campaign.id) if campaign else None,
            "campaign_title": campaign.title if campaign else None,
            "campaign_status": campaign.status if campaign else None,
            "transaction_id": str(inv.transaction_id) if inv.transaction_id else None
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

    # Konwertuj UUID na stringi
    investment.id = str(investment.id)
    investment.campaign_id = str(investment.campaign_id)
    investment.investor_id = str(investment.investor_id)

    return investment
