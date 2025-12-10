from sqlalchemy import create_engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# Import psycopg2 dla bezpośredniego użycia parametrów połączenia
try:
    import psycopg2
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False


def _ensure_utf8(value):
    """Konwertuje wartość na string UTF-8, obsługując Windows-1250"""
    if value is None:
        return None
    
    if isinstance(value, bytes):
        try:
            return value.decode('utf-8')
        except UnicodeDecodeError:
            try:
                # Próbujemy Windows-1250
                return value.decode('windows-1250').encode('utf-8').decode('utf-8')
            except Exception:
                return value.decode('utf-8', errors='replace')
    
    # Jeśli to już string, konwertujemy przez bytes
    str_value = str(value)
    
    # Najpierw próbujemy zakodować jako UTF-8
    try:
        str_value.encode('utf-8')
        # Jeśli się udało, sprawdzamy czy nie ma problemów z kodowaniem
        # Konwertujemy przez latin1 (który może przechować wszystkie bajty) i Windows-1250
        try:
            # Kodujemy jako latin1 (zachowuje wszystkie bajty)
            latin1_bytes = str_value.encode('latin1')
            # Sprawdzamy czy są znaki Windows-1250 (np. 0xb3 = ł)
            if any(b >= 0x80 for b in latin1_bytes):
                # Próbujemy zdekodować jako Windows-1250 i zakodować jako UTF-8
                decoded = latin1_bytes.decode('windows-1250')
                return decoded.encode('utf-8').decode('utf-8')
        except (UnicodeDecodeError, UnicodeEncodeError):
            pass
        return str_value
    except UnicodeEncodeError:
        # Jeśli nie można zakodować jako UTF-8, próbujemy przez Windows-1250
        try:
            # Kodujemy jako Windows-1250, a następnie dekodujemy jako UTF-8
            windows_bytes = str_value.encode('windows-1250')
            return windows_bytes.decode('utf-8', errors='replace')
        except Exception:
            # Ostatnia deska ratunku
            return str_value.encode('utf-8', errors='replace').decode('utf-8', errors='replace')


# Tworzymy engine z obsługą kodowania UTF-8
db_url = settings.database_url

# Konwersja do stringa UTF-8 jeśli potrzeba
if isinstance(db_url, bytes):
    try:
        db_url = db_url.decode('utf-8')
    except UnicodeDecodeError:
        # Jeśli UTF-8 nie działa, spróbuj Windows-1250 (polskie znaki)
        db_url = db_url.decode('windows-1250').encode('utf-8').decode('utf-8')
else:
    db_url = str(db_url)

# Jeśli używamy PostgreSQL i psycopg2, użyjmy parametrów bezpośrednio
# aby uniknąć problemów z kodowaniem w connection stringu
if "postgresql" in db_url and PSYCOPG2_AVAILABLE:
    try:
        url_obj = make_url(db_url)
        
        # Konwertujemy wszystkie parametry na UTF-8 przed użyciem
        host = _ensure_utf8(url_obj.host) if url_obj.host else "localhost"
        port = int(url_obj.port) if url_obj.port else 5432
        username = _ensure_utf8(url_obj.username) if url_obj.username else None
        password = _ensure_utf8(url_obj.password) if url_obj.password else None
        database = url_obj.database if url_obj.database else (url_obj.path[1:] if url_obj.path and len(url_obj.path) > 1 else None)
        database = _ensure_utf8(database) if database else None
        
        # Tworzymy funkcję creator, która używa parametrów bezpośrednio
        def create_connection():
            # Upewniamy się, że wszystkie parametry są prawidłowo zakodowane jako UTF-8
            # Konwertujemy każdy parametr osobno
            host_clean = _ensure_utf8(host) if host else "localhost"
            username_clean = _ensure_utf8(username) if username else None
            password_clean = _ensure_utf8(password) if password else None
            database_clean = _ensure_utf8(database) if database else None
            
            # Używamy parametrów bezpośrednio - psycopg2 powinien je obsłużyć
            # Ale najpierw upewniamy się, że są to czyste stringi UTF-8
            conn_kwargs = {
                'host': host_clean,
                'port': port,
                'client_encoding': 'utf8'
            }
            
            if username_clean:
                conn_kwargs['user'] = username_clean
            if password_clean:
                conn_kwargs['password'] = password_clean
            if database_clean:
                conn_kwargs['database'] = database_clean
            
            # Próbujemy połączyć się używając parametrów
            return psycopg2.connect(**conn_kwargs)
        
        # Używamy create_engine z creator zamiast connection stringu
        engine = create_engine(
            "postgresql://",
            echo=True,
            creator=create_connection,
        )
    except Exception:
        # Jeśli użycie creator się nie powiodło, użyj standardowego podejścia
        connect_args = {"client_encoding": "utf8"}
        engine = create_engine(
            db_url,
            echo=True,
            connect_args=connect_args,
        )
else:
    # Dla innych baz danych lub jeśli psycopg2 nie jest dostępne
    connect_args = {}
    if "postgresql" in db_url:
        connect_args["client_encoding"] = "utf8"
    
    engine = create_engine(
        db_url,
        echo=True,
        connect_args=connect_args,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Funkcja do uzyskania sesji bazy danych
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()