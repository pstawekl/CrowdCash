from datetime import datetime, timedelta

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app import crud
from app.core.config import settings
from app.core.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Sekret JWT - powinien być przechowywany w zmiennych środowiskowych
SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

# Funkcja do haszowania haseł
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

# Funkcja do weryfikacji hasła
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Weryfikuje hasło przeciwko hashowi."""
    try:
        # Konwertuj hasło na bytes
        if isinstance(plain_password, str):
            plain_password_bytes = plain_password.encode('utf-8')
        else:
            plain_password_bytes = plain_password
        
        # Hash bcrypt jest przechowywany jako string w bazie
        # Musimy go przekonwertować na bytes - bcrypt.checkpw oczekuje bytes
        if isinstance(hashed_password, str):
            # Usuń ewentualne białe znaki z hasha
            hashed_password = hashed_password.strip()
            # Hash bcrypt jako string można bezpiecznie zakodować jako utf-8
            # ponieważ zawiera tylko znaki ASCII ($, 0-9, a-z, A-Z, /, .)
            hashed_password_bytes = hashed_password.encode('utf-8')
        else:
            hashed_password_bytes = hashed_password
        
        # Zweryfikuj hasło używając bcrypt
        return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)
    except Exception as e:
        print(f"[ERROR] verify_password exception: {e}")
        raise

# Alias dla kompatybilności
def get_password_hash(password: str) -> str:
    """Alias dla hash_password - używany w innych częściach aplikacji."""
    return hash_password(password)

# Funkcja do generowania tokenu


def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return {
        "access_token": encoded_jwt,
        "token_type": "bearer"
    }


# Define credentials exception for reuse
credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        user = crud.get_user_by_email(db=db, email=username)
        if user is None:
            raise credentials_exception
        return user
    except JWTError as e:
        print(f"[ERROR] get_current_user: JWTError: {e}")
        # Spróbuj odświeżyć token jeśli wygasł
        from fastapi import Request
        from fastapi.encoders import jsonable_encoder
        try:
            # Spróbuj odświeżyć token przez funkcję refresh_token
            new_token = refresh_token(token, db)
            # Spróbuj ponownie pobrać użytkownika z nowym tokenem
            payload = jwt.decode(new_token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                raise credentials_exception
            user = crud.get_user_by_email(db=db, email=username)
            if user is None:
                raise credentials_exception
            # Możesz zwrócić user i nowy token, jeśli chcesz obsłużyć to na froncie
            return user
        except Exception as e2:
            print(f"[ERROR] get_current_user: Token refresh failed: {e2}")
            raise credentials_exception
    except Exception as e:
        print(f"[ERROR] get_current_user: Unexpected error: {e}")
        raise credentials_exception


def refresh_token(current_token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Creates a new access token using the current valid token
    """
    try:
        # Verify the current token is valid
        payload = jwt.decode(current_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception

        # Generate new token with refreshed expiration
        user = crud.get_user_by_email(db=db, email=username)
        if user is None:
            raise credentials_exception

        return create_access_token(data={"sub": username})
    except JWTError:
        raise credentials_exception
        raise credentials_exception
