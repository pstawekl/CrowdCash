import random
import string
from datetime import datetime, timezone

from app import crud, models, schemas, utils
from app.core.config import settings
from app.core.database import get_db
from app.core.email import send_email
from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

router = APIRouter()


def send_verification_email(email: str, verification_code: str):
    subject = f'Weryfikacja konta w {settings.app_name}'
    message = f'Kod weryfikacyjny: {verification_code}'

    send_email(subject=subject, body=message, to_email=email)


def generate_verification_code(length: int = 6):
    return ''.join(random.choices(string.digits, k=length))


@router.post("/register", response_model=schemas.UserOut)
async def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Sprawdź, czy użytkownik już istnieje
    existing_user = crud.get_user_by_email(db, email=user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    verification_code = generate_verification_code()
    new_user = crud.create_user(
        db, user=user, verification_code=verification_code)

    try:
        send_verification_email(new_user.email, verification_code)
        # Możesz dodać logowanie akcji
    except Exception as e:
        db.delete(new_user)
        db.commit()
        raise HTTPException(
            status_code=500, detail=f"Failed to send email: {e}")

    return new_user


@router.get("/resend-verification-code")
async def resend_verification_code(email: str, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="User already verified")

    verification_code = generate_verification_code()
    user.verification_code = verification_code
    crud.update_user(db, user=user)

    try:
        send_verification_email(user.email, verification_code)
        # crud.add_log(db, log=schemas.LogCreate(
        #     user_id=user.id,
        #     action=f"Resent verification code: {verification_code} to {user.email}",
        #     created_at=datetime.now(timezone.utc)
        # ))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to send email: {e}")

    return {"message": "Verification code resent"}


@router.post("/login")
async def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        models.User.email == form_data.username).first()
    if not db_user or not utils.verify_password(form_data.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # POZWÓL LOGOWAĆ SIĘ NIEZWERYFIKOWANYM UŻYTKOWNIKOM
    # (frontend sam przekieruje do ekranu weryfikacji)
    access_token = utils.create_access_token(data={"sub": db_user.email})
    return access_token


@router.post("/delete-user")
async def delete_user(email: str, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}


@router.get("/me")
async def get_current_user_data(db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    user = crud.get_user_by_email(db, email=current_user.email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.post("/refresh")
async def refresh_token(current_token: str = Depends(utils.oauth2_scheme), db: Session = Depends(get_db)):
    """
    Endpoint do odświeżania tokena JWT (jeśli jest jeszcze ważny).
    """
    return utils.refresh_token(current_token=current_token, db=db)


@router.get("/profile", response_model=schemas.ProfileOut)
async def get_profile(db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca profil aktualnie zalogowanego użytkownika.
    """
    profile = db.query(models.Profile).filter(
        models.Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/profile", response_model=schemas.ProfileOut)
async def update_profile(
    profile_update: schemas.ProfileCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Aktualizuje profil aktualnie zalogowanego użytkownika.
    """
    profile = db.query(models.Profile).filter(
        models.Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    for field, value in profile_update.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/verify")
async def verify_user(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    code = data.get("code")
    user = crud.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        return {"message": "User already verified"}
    if user.verification_code != code:
        raise HTTPException(
            status_code=400, detail="Invalid verification code")
    user.is_verified = True
    user.verification_code = None
    crud.update_user(db, user=user)
    return {"message": "Account verified"}
