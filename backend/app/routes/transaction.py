import hashlib
from uuid import UUID

import requests
from app import models, schemas, utils
from app.core.config import settings
from app.core.database import get_db
from app.core.email import send_email
from fastapi import APIRouter, Body, Depends, HTTPException, Request
from sqlalchemy.orm import Session

router = APIRouter(prefix="/transactions", tags=["transactions"])

TPAY_MERCHANT_ID = settings.tpay_merchant_id
TPAY_API_KEY = settings.tpay_api_key
TPAY_API_PASSWORD = settings.tpay_api_password
TPAY_API_URL = settings.tpay_api_url


@router.post("/", response_model=schemas.TransactionOut)
async def create_transaction(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Tworzy nową transakcję (np. po udanej płatności Stripe).
    """
    investment = db.query(models.Investment).filter(
        models.Investment.id == transaction.investment_id).first()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    # Możesz dodać dodatkową walidację (np. czy inwestor to current_user)
    db_transaction = models.Transaction(
        investment_id=transaction.investment_id,
        stripe_transaction_id=transaction.stripe_transaction_id,
        amount=transaction.amount,
        fee=transaction.fee,
        type=transaction.type,
        status='pending',
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.get("/", response_model=list[schemas.TransactionOut])
async def list_transactions(db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca listę transakcji użytkownika (po inwestycjach).
    """
    investments = db.query(models.Investment).filter(
        models.Investment.investor_id == current_user.id).all()
    investment_ids = [inv.id for inv in investments]
    return db.query(models.Transaction).filter(models.Transaction.investment_id.in_(investment_ids)).all()


@router.get("/{transaction_id}", response_model=schemas.TransactionOut)
async def get_transaction(transaction_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca szczegóły transakcji (tylko właściciel inwestycji lub admin).
    """
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    investment = db.query(models.Investment).filter(
        models.Investment.id == transaction.investment_id).first()
    if not investment or (investment.investor_id != current_user.id and not current_user.is_admin):
        raise HTTPException(status_code=403, detail="Not authorized")
    return transaction


@router.post("/initiate-tpay")
async def initiate_tpay_payment(
    investment_id: UUID = Body(embed=True),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Inicjuje płatność TPay dla inwestycji i zwraca link/formularz płatności.
    """
    investment = db.query(models.Investment).filter(
        models.Investment.id == investment_id).first()
    if not investment or investment.investor_id != current_user.id:
        raise HTTPException(status_code=404, detail="Investment not found")
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == investment.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    # Przygotuj dane do TPay
    data = {
        "merchant_id": TPAY_MERCHANT_ID,
        "amount": float(investment.amount),
        "description": f"Inwestycja w kampanię: {campaign.title}",
        "crc": str(investment.id),
        "email": current_user.email,
        "name": getattr(current_user, 'name', ''),
        "return_url": "https://twoja-aplikacja.pl/payment-success",
        "result_url": "https://twoja-aplikacja.pl/api/transactions/tpay-webhook",
        # Możesz dodać inne wymagane pola
    }
    headers = {"Content-Type": "application/json", "apikey": TPAY_API_KEY}
    try:
        response = requests.post(
            f"{TPAY_API_URL}transaction/create", json=data, headers=headers, timeout=10)
        response.raise_for_status()
        tpay_data = response.json()
        if tpay_data.get("result") != 1:
            raise Exception(tpay_data.get("err", "Błąd TPay"))
        payment_url = tpay_data["url"]
        return {"payment_url": payment_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TPay error: {e}")


def verify_tpay_signature(data: dict, api_password: str) -> bool:
    """
    Weryfikuje podpis TPay na podstawie dokumentacji:
    https://docs.tpay.com/#notification-signature
    """
    received_sign = data.get("sign")
    if not received_sign:
        return False
    # Pola do podpisu (kolejność i obecność zgodnie z dokumentacją TPay)
    sign_fields = [
        data.get("merchant_id", ""),
        data.get("pos_id", ""),
        data.get("session_id", ""),
        data.get("amount", ""),
        data.get("origin_amount", ""),
        data.get("currency", ""),
        data.get("order_id", ""),
        data.get("method_id", ""),
        data.get("statement", ""),
        data.get("crc", ""),
        api_password
    ]
    sign_string = "|".join(str(f) for f in sign_fields)
    calculated_sign = hashlib.sha256(sign_string.encode()).hexdigest()
    return calculated_sign == received_sign


@router.post("/tpay-webhook")
async def tpay_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Webhook TPay – odbiera powiadomienie o statusie płatności i aktualizuje status inwestycji/transakcji.
    Weryfikuje podpis TPay. Wysyła powiadomienie email do inwestora.
    """
    data = await request.form()
    data = dict(data)
    if not verify_tpay_signature(data, TPAY_API_PASSWORD):
        return "ERROR: Invalid signature"
    crc = data.get("crc")
    status = data.get("tr_status")
    amount = float(data.get("tr_amount", 0))
    # Znajdź inwestycję po crc
    investment = db.query(models.Investment).filter(
        models.Investment.id == crc).first()
    if not investment:
        return "ERROR: Investment not found"
    # Znajdź transakcję po investment_id
    transaction = db.query(models.Transaction).filter(
        models.Transaction.investment_id == investment.id).first()
    if not transaction:
        return "ERROR: Transaction not found"
    user = db.query(models.User).filter(
        models.User.id == investment.investor_id).first()
    if status == "TRUE":
        transaction.status = "successful"
        investment.status = "completed"
        # Wyślij powiadomienie email o sukcesie
        if user:
            send_email(
                subject="CrowdCash: Twoja płatność została zaksięgowana",
                body=f"Dziękujemy za wsparcie kampanii! Kwota {amount} PLN została zaksięgowana.",
                to_email=user.email
            )
    else:
        transaction.status = "failed"
        investment.status = "refunded"
        # Wyślij powiadomienie email o niepowodzeniu
        if user:
            send_email(
                subject="CrowdCash: Płatność nie powiodła się",
                body=f"Niestety Twoja płatność na kwotę {amount} PLN nie została zaksięgowana. Spróbuj ponownie.",
                to_email=user.email
            )
    db.commit()
    return "TRUE"
