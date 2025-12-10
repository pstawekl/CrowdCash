from datetime import datetime, timedelta
from uuid import UUID

from app import models, schemas, utils
from app.core.database import get_db
from app.core.email import send_email
from app.routes.admin import admin_required
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import Session

router = APIRouter(prefix="/payouts", tags=["payouts"])


@router.post("/", response_model=schemas.PayoutOut)
async def create_payout(
    payout: schemas.PayoutCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_required)
):
    """
    Tworzy nowy payout (wypłatę) dla kampanii (tylko admin).
    """
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == payout.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    entrepreneur = db.query(models.User).filter(
        models.User.id == payout.entrepreneur_id).first()
    if not entrepreneur:
        raise HTTPException(status_code=404, detail="Entrepreneur not found")
    db_payout = models.Payout(
        campaign_id=payout.campaign_id,
        entrepreneur_id=payout.entrepreneur_id,
        total_raised=payout.total_raised,
        payout_amount=payout.payout_amount,
        payout_date=payout.payout_date,
        status="pending"
    )
    db.add(db_payout)
    db.commit()
    db.refresh(db_payout)
    # Powiadomienie email do przedsiębiorcy o utworzeniu payoutu
    send_email(
        subject="Crowdoo: Zlecono wypłatę środków",
        body=f"Twoja wypłata za kampanię '{campaign.title}' została zlecona. Kwota: {db_payout.payout_amount} PLN.",
        to_email=entrepreneur.email
    )
    return db_payout


@router.get("/", response_model=list[schemas.PayoutOut])
async def list_payouts(db: Session = Depends(get_db), current_user: models.User = Depends(admin_required)):
    """
    Zwraca listę wszystkich payoutów (tylko admin).
    """
    return db.query(models.Payout).all()


@router.get("/my", response_model=list[schemas.PayoutOut])
async def list_my_payouts(db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca listę payoutów zalogowanego przedsiębiorcy (właściciela kampanii).
    """
    return db.query(models.Payout).filter(models.Payout.entrepreneur_id == current_user.id).all()


@router.get("/campaign/{campaign_id}", response_model=list[schemas.PayoutOut])
async def list_campaign_payouts(campaign_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(admin_required)):
    """
    Zwraca listę payoutów dla danej kampanii (tylko admin).
    """
    return db.query(models.Payout).filter(models.Payout.campaign_id == campaign_id).all()


@router.put("/{payout_id}", response_model=schemas.PayoutOut)
async def update_payout_status(
    payout_id: UUID,
    status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_required)
):
    """
    Aktualizuje status payoutu (tylko admin).
    """
    payout = db.query(models.Payout).filter(
        models.Payout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    payout.status = status
    db.commit()
    db.refresh(payout)
    # Powiadomienie email do przedsiębiorcy o zmianie statusu wypłaty
    entrepreneur = db.query(models.User).filter(
        models.User.id == payout.entrepreneur_id).first()
    if entrepreneur:
        if status == "paid":
            send_email(
                subject="Crowdoo: Wypłata zrealizowana",
                body=f"Twoja wypłata za kampanię została zrealizowana. Kwota: {payout.payout_amount} PLN.",
                to_email=entrepreneur.email
            )
        elif status == "failed":
            send_email(
                subject="Crowdoo: Błąd wypłaty",
                body=f"Niestety wypłata za kampanię nie powiodła się. Skontaktuj się z obsługą.",
                to_email=entrepreneur.email
            )
    return payout


@router.post("/auto-generate", response_model=list[schemas.PayoutOut])
async def auto_generate_payouts(db: Session = Depends(get_db), current_user: models.User = Depends(admin_required)):
    """
    Automatycznie generuje payouty dla kampanii zakończonych, które nie mają jeszcze wypłaty, na 10 dzień następnego miesiąca po zakończeniu.
    """
    now = datetime.utcnow()
    payouts_created = []
    # Szukaj kampanii zakończonych (status 'successful', deadline < teraz)
    campaigns = db.query(models.Campaign).filter(
        and_(models.Campaign.status == 'successful',
             models.Campaign.deadline < now)
    ).all()
    for campaign in campaigns:
        # Sprawdź, czy już istnieje payout dla tej kampanii
        existing_payout = db.query(models.Payout).filter(
            models.Payout.campaign_id == campaign.id).first()
        if existing_payout:
            continue
        # Wyznacz datę wypłaty: 10 dzień następnego miesiąca po deadline
        deadline = campaign.deadline
        if deadline.month == 12:
            payout_month = 1
            payout_year = deadline.year + 1
        else:
            payout_month = deadline.month + 1
            payout_year = deadline.year
        payout_date = datetime(payout_year, payout_month, 10)
        # Kwota do wypłaty = current_amount
        payout_amount = float(campaign.current_amount or 0)
        if payout_amount <= 0:
            continue
        db_payout = models.Payout(
            campaign_id=campaign.id,
            entrepreneur_id=campaign.entrepreneur_id,
            total_raised=payout_amount,
            payout_amount=payout_amount,
            payout_date=payout_date,
            status="pending"
        )
        db.add(db_payout)
        db.commit()
        db.refresh(db_payout)
        # Powiadomienie email do przedsiębiorcy
        entrepreneur = db.query(models.User).filter(
            models.User.id == campaign.entrepreneur_id).first()
        if entrepreneur:
            send_email(
                subject="Crowdoo: Automatyczna wypłata środków",
                body=f"Twoja kampania '{campaign.title}' została zakończona. Wypłata {payout_amount} PLN zostanie zrealizowana 10 dnia następnego miesiąca.",
                to_email=entrepreneur.email
            )
        payouts_created.append(db_payout)
    return payouts_created
