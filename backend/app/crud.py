import uuid
from datetime import datetime
from typing import Optional
from uuid import UUID

import bcrypt
from sqlalchemy.orm import Session

from app import models, schemas
from app.schemas import AdminLogCreate


def hash_password(password: str) -> str:
    """Hashuje hasło używając bcrypt."""
    # Konwertuj hasło na bytes jeśli jest stringiem
    if isinstance(password, str):
        password = password.encode('utf-8')
    
    # Generuj salt i hashuj hasło
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password, salt)
    
    # Zwróć jako string
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Weryfikuje hasło przeciwko hashowi."""
    # Konwertuj na bytes jeśli są stringami
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    
    # Zweryfikuj hasło
    return bcrypt.checkpw(plain_password, hashed_password)


# Tworzenie nowego użytkownika
def create_user(db: Session, user: schemas.UserCreate, verification_code: str):
    hashed_password = hash_password(user.password)

    # Znajdź role po nazwie
    role = db.query(models.Role).filter(models.Role.name == user.role).first()
    if not role:
        # Jeśli rola nie istnieje, utwórz ją
        role = models.Role(name=user.role)
        db.add(role)
        db.flush()  # żeby dostać ID

    db_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        role_id=role.id,
        verification_code=verification_code,
        is_verified=False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user: models.User):
    db_user = db.query(models.User).filter(models.User.id == user.id).first()
    if db_user:
        db_user.email = user.email
        db_user.role = user.role
        db_user.is_verified = user.is_verified
        db_user.verification_code = user.verification_code
        db.commit()
        db.refresh(db_user)
    return db_user

# Pobieranie użytkownika po ID


def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

# Pobieranie użytkownika po emailu


def get_user_by_email(db: Session, email: str):
    try:
        return db.query(models.User).filter(models.User.email == email).first()
    except Exception as e:
        print(f"Error fetching user by email: {e}")
        return None


def add_admin_log(db: Session, log: schemas.AdminLogCreate):
    db_log = models.AdminLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


# Error Log CRUD operations
def create_error_log(db: Session, error_log: schemas.ErrorLogCreate):
    """Tworzy nowy wpis w logu błędów."""
    db_error_log = models.ErrorLog(**error_log.dict())
    db.add(db_error_log)
    db.commit()
    db.refresh(db_error_log)
    return db_error_log


def get_error_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    resolved: Optional[bool] = None,
    error_type: Optional[str] = None
):
    """Pobiera listę błędów z opcjonalnymi filtrami."""
    query = db.query(models.ErrorLog)
    
    if resolved is not None:
        query = query.filter(models.ErrorLog.resolved == resolved)
    
    if error_type:
        query = query.filter(models.ErrorLog.error_type == error_type)
    
    return query.order_by(models.ErrorLog.created_at.desc()).offset(skip).limit(limit).all()


def get_error_log_by_id(db: Session, error_id: uuid.UUID):
    """Pobiera pojedynczy błąd po ID."""
    return db.query(models.ErrorLog).filter(models.ErrorLog.id == error_id).first()


def update_error_log(
    db: Session,
    error_id: uuid.UUID,
    error_update: schemas.ErrorLogUpdate
):
    """Aktualizuje status błędu (np. oznacza jako rozwiązany)."""
    db_error_log = db.query(models.ErrorLog).filter(models.ErrorLog.id == error_id).first()
    if not db_error_log:
        return None
    
    update_data = error_update.dict(exclude_unset=True)
    
    if update_data.get('resolved') and not db_error_log.resolved:
        update_data['resolved_at'] = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(db_error_log, key, value)
    
    db.commit()
    db.refresh(db_error_log)
    return db_error_log


def delete_error_log(db: Session, error_id: uuid.UUID):
    """Usuwa wpis błędu z logów."""
    db_error_log = db.query(models.ErrorLog).filter(models.ErrorLog.id == error_id).first()
    if not db_error_log:
        return None
    
    db.delete(db_error_log)
    db.commit()
    return db_error_log
