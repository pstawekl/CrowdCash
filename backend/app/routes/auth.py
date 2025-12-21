import random
import string
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Form, Header, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, models, schemas, utils
from app.core.config import settings
from app.core.database import get_db
from app.core.email import send_email

router = APIRouter()


def send_verification_email(email: str, verification_code: str):
    subject = f'Weryfikacja konta w {settings.app_name}'
    message = f'Kod weryfikacyjny: {verification_code}'

    send_email(subject=subject, body=message, to_email=email)


def generate_verification_code(length: int = 6):
    return ''.join(random.choices(string.digits, k=length))


@router.post("/register", response_model=schemas.UserOut)
async def register_user(
    email: str = Form(default=None),
    password: str = Form(default=None),
    role: str = Form(default=None),
    company_name: str = Form(default=None),
    nip: str = Form(default=None),
    city_id: str = Form(default=None),
    street: str = Form(default=None),
    building_number: str = Form(default=None),
    apartment_number: str = Form(default=None),
    postal_code: str = Form(default=None),
    db: Session = Depends(get_db)
):
    # Rozpoznaj typ rejestracji
    if role == 'entrepreneur':
        # Walidacja pól przedsiębiorcy
        if not (company_name and nip and city_id):
            raise HTTPException(
                status_code=422, detail="Brak wymaganych danych firmy")
        # Sprawdź, czy użytkownik już istnieje
        existing_user = crud.get_user_by_email(db, email=email)
        if existing_user:
            raise HTTPException(
                status_code=400, detail="Email already registered")
        
        # Sprawdź czy miasto istnieje
        city = db.query(models.RegionCity).filter(models.RegionCity.id == city_id).first()
        if not city:
            raise HTTPException(
                status_code=404, detail="Miasto nie zostało znalezione")
        
        verification_code = generate_verification_code()
        
        # Tworzenie użytkownika z city_id
        new_user = crud.create_user(
            db, user=schemas.UserCreate(email=email, password=password, role='entrepreneur'), 
            verification_code=verification_code
        )
        
        # Ustaw city_id dla użytkownika
        new_user.city_id = city_id
        db.commit()
        db.refresh(new_user)
        
        # Tworzenie firmy (Company) z powiązaniem do użytkownika
        company = models.Company(
            user_id=new_user.id,
            nip=nip,
            company_name=company_name,
            city=city.name,  # Zapisz nazwę miasta jako tekst
            country=city.country.name if city.country else None,
            street=street,
            building_number=building_number,
            apartment_number=apartment_number,
            postal_code=postal_code
        )
        db.add(company)
        db.commit()
        db.refresh(company)
        
        try:
            send_verification_email(new_user.email, verification_code)
        except Exception as e:
            db.delete(new_user)
            db.commit()
            raise HTTPException(
                status_code=500, detail=f"Failed to send email: {e}")
        return new_user
    else:
        # Standardowa rejestracja inwestora
        if not (email and password and role):
            raise HTTPException(
                status_code=422, detail="Brak wymaganych danych")
        existing_user = crud.get_user_by_email(db, email=email)
        if existing_user:
            raise HTTPException(
                status_code=400, detail="Email already registered")
        verification_code = generate_verification_code()
        new_user = crud.create_user(db, user=schemas.UserCreate(
            email=email, password=password, role=role), verification_code=verification_code)
        try:
            send_verification_email(new_user.email, verification_code)
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
    print("in login")
    if not db_user or not utils.verify_password(form_data.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Sprawdź czy konto jest zweryfikowane
    if not db_user.is_verified:
        raise HTTPException(
            status_code=403,
            detail=f"Account not verified. Please verify your account at {db_user.email}"
        )
    
    access_token = utils.create_access_token(data={"sub": db_user.email, "role_id": db_user.role_id})
    
    # Zwróć token wraz z role_id
    return {
        "access_token": access_token.get("access_token"),
        "token_type": access_token.get("token_type", "bearer"),
        "role_id": db_user.role_id
    }


@router.post("/delete-user")
async def delete_user(email: str, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}


@router.delete("/me")
async def delete_my_account(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Usuwa konto aktualnie zalogowanego użytkownika.
    Usuwa wszystkie powiązane dane (cascade).
    """
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Zapisz email do logów przed usunięciem (opcjonalnie)
    user_email = user.email
    
    # Usuń użytkownika (cascade usuwa powiązane dane)
    db.delete(user)
    db.commit()
    
    return {"message": f"Konto {user_email} zostało pomyślnie usunięte"}


@router.put("/change-password")
async def change_password(
    password_data: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Zmienia hasło aktualnie zalogowanego użytkownika.
    """
    # Sprawdź czy nowe hasło i potwierdzenie są takie same
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Nowe hasło i jego potwierdzenie nie są identyczne"
        )
    
    # Sprawdź czy nowe hasło jest różne od starego
    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=400,
            detail="Nowe hasło musi być różne od obecnego hasła"
        )
    
    # Sprawdź czy obecne hasło jest poprawne
    if not utils.verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Nieprawidłowe obecne hasło"
        )
    
    # Walidacja siły nowego hasła
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Nowe hasło musi mieć co najmniej 8 znaków"
        )
    
    # Zmień hasło
    current_user.password_hash = utils.get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Hasło zostało pomyślnie zmienione"}


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

    # Konwertuj UUID na stringi dla zgodności z frontendem
    profile_dict = {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "name": profile.name,
        "bio": profile.bio,
        "location": profile.location,
        "interests": profile.interests,
        "profile_picture_url": profile.profile_picture_url
    }

    return profile_dict


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

    # Konwertuj UUID na stringi dla zgodności z frontendem
    profile_dict = {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "name": profile.name,
        "bio": profile.bio,
        "location": profile.location,
        "interests": profile.interests,
        "profile_picture_url": profile.profile_picture_url
    }

    return profile_dict


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


@router.get("/permissions", response_model=list[schemas.PermissionOut])
async def get_user_permissions(current_user: models.User = Depends(utils.get_current_user), db: Session = Depends(get_db)):
    role = db.query(models.Role).filter(
        models.Role.id == current_user.role_id).first()
    if not role:
        return []
    return role.permissions


@router.get("/me", response_model=schemas.UserOut)
async def get_current_user_info(db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca informacje o aktualnie zalogowanym użytkowniku.
    """
    # Pobierz pełne dane użytkownika z bazy danych
    user = crud.get_user_by_email(db, email=current_user.email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Konwertuj UUID na stringi dla zgodności z frontendem
    user_dict = {
        "id": str(user.id),
        "email": user.email,
        "role_id": user.role_id,
        "city_id": str(user.city_id) if user.city_id else None,
        "created_at": user.created_at,
        "last_login": user.last_login,
        "is_verified": user.is_verified
    }

    return user_dict


@router.get("/settings", response_model=schemas.UserSettingsOut)
async def get_user_settings(db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca pełne informacje o użytkowniku dla ekranu Ustawień.
    Zawiera dane użytkownika, profil, dane firmy (dla przedsiębiorców) i informacje o regionie.
    """
    # Pobierz pełne dane użytkownika z bazy danych
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Pobierz profil użytkownika
    profile = db.query(models.Profile).filter(models.Profile.user_id == user.id).first()
    
    # Pobierz dane firmy (jeśli użytkownik jest przedsiębiorcą)
    company = None
    if user.role and user.role.name == 'entrepreneur':
        company = db.query(models.Company).filter(models.Company.user_id == user.id).first()
    
    # Pobierz informacje o mieście
    city = None
    if user.city_id:
        city = db.query(models.RegionCity).filter(models.RegionCity.id == user.city_id).first()
    
    # Przygotuj odpowiedź
    settings_data = {
        "id": user.id,
        "email": user.email,
        "role_id": user.role_id,
        "role_name": user.role.name if user.role else "unknown",
        "city_id": user.city_id,
        "created_at": user.created_at,
        "last_login": user.last_login,
        "is_verified": user.is_verified,
        "profile": profile,
        "company": company,
        "city": city
    }
    
    return settings_data


@router.put("/settings/user", response_model=schemas.UserOut)
async def update_user_settings(
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Aktualizuje dane użytkownika (city_id).
    """
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Sprawdź czy miasto istnieje
    if user_update.city_id:
        city = db.query(models.RegionCity).filter(models.RegionCity.id == user_update.city_id).first()
        if not city:
            raise HTTPException(status_code=404, detail="Miasto nie zostało znalezione")
    
    # Aktualizuj dane
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.put("/settings/company", response_model=schemas.CompanyOut)
async def update_company_settings(
    company_update: schemas.CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Aktualizuje dane firmy przedsiębiorcy.
    Tylko dla użytkowników z rolą 'entrepreneur'.
    """
    # Sprawdź czy użytkownik jest przedsiębiorcą
    if not current_user.role or current_user.role.name != 'entrepreneur':
        raise HTTPException(
            status_code=403, 
            detail="Tylko przedsiębiorcy mogą aktualizować dane firmy"
        )
    
    # Pobierz firmę użytkownika
    company = db.query(models.Company).filter(models.Company.user_id == current_user.id).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Firma nie została znaleziona")
    
    # Aktualizuj dane firmy
    for field, value in company_update.dict(exclude_unset=True).items():
        if value is not None:  # Aktualizuj tylko pola które są podane
            setattr(company, field, value)
    
    # Automatycznie aktualizuj updated_at
    company.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(company)
    
    return company
