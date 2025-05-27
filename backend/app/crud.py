from datetime import datetime

import passlib.context
from app import models, schemas
from app.schemas import AdminLogCreate
from sqlalchemy.orm import Session

# Inicjalizacja contextu do haszowania
pwd_context = passlib.context.CryptContext(
    schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# Tworzenie nowego użytkownika
def create_user(db: Session, user: schemas.UserCreate, verification_code: str):
    hashed_password = hash_password(user.password)
    db_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
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
