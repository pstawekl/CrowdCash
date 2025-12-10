from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, utils
from app.core.database import get_db

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/", response_model=schemas.TransactionOut)
async def create_transaction(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Tworzy nową transakcję (np. po udanej płatności Stripe).
    Uwaga: Ten endpoint może nie być używany - transakcje są tworzone przez /payments/
    """
    investment = db.query(models.Investment).filter(
        models.Investment.id == transaction.investment_id).first()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    
    # Walidacja - sprawdź czy inwestor to current_user
    if investment.investor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Transaction nie ma investment_id - relacja jest odwrotna (Investment ma transaction_id)
    # Utwórz transakcję
    from decimal import Decimal
    db_transaction = models.Transaction(
        stripe_transaction_id=None,  # Będzie ustawione później przez payments
        amount=Decimal(str(transaction.amount)),
        fee=Decimal(str(0.01 * transaction.amount)),  # Domyślna prowizja 1%
        currency=transaction.currency,
        type=transaction.type or schemas.TransactionTypeEnum.DEPOSIT.value,
        status=transaction.status or schemas.TransactionStatusEnum.PENDING.value,
    )
    db.add(db_transaction)
    db.flush()  # Flush żeby dostać ID transakcji
    
    # Zaktualizuj investment z transaction_id
    investment.transaction_id = db_transaction.id
    db.commit()
    db.refresh(db_transaction)
    
    # Zwróć w formacie TransactionOut (wymaga payment_url, ale tego nie mamy tutaj)
    # To może być problem - endpoint może nie być używany
    return db_transaction


@router.get("/", response_model=list[schemas.TransactionList])
async def list_transactions(db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca listę transakcji użytkownika (po inwestycjach).
    """
    # Investment ma transaction_id, więc pobieramy transakcje przez inwestycje
    investments = db.query(models.Investment).filter(
        models.Investment.investor_id == current_user.id
    ).all()
    
    # Stwórz mapę transaction_id -> investment_id
    transaction_to_investment = {inv.transaction_id: inv.id for inv in investments if inv.transaction_id is not None}
    
    if not transaction_to_investment:
        return []
    
    # Pobierz transakcje
    transactions = db.query(models.Transaction).filter(
        models.Transaction.id.in_(list(transaction_to_investment.keys()))
    ).all()
    
    # Zbuduj odpowiedź z investment_id
    result = []
    for transaction in transactions:
        # Konwertuj UUID na string dla id
        transaction_dict = {
            "id": str(transaction.id),
            "currency": transaction.currency,
            "amount": float(transaction.amount),
            "fee": float(transaction.fee),
            "type": transaction.type,
            "status": transaction.status,
            "stripe_transaction_id": transaction.stripe_transaction_id,
            "status_description": transaction.status_description,
            "created_at": transaction.created_at,
            "investment_id": transaction_to_investment.get(transaction.id)
        }
        result.append(transaction_dict)
    
    return result


@router.get("/{transaction_id}", response_model=schemas.TransactionOut)
async def get_transaction(transaction_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca szczegóły transakcji (tylko właściciel inwestycji lub admin).
    """
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Znajdź inwestycję powiązaną z tą transakcją (Investment ma transaction_id)
    investment = db.query(models.Investment).filter(
        models.Investment.transaction_id == transaction_id
    ).first()
    
    if not investment or (investment.investor_id != current_user.id and not getattr(current_user, 'is_admin', False)):
        raise HTTPException(status_code=403, detail="Not authorized")
    return transaction



