import codecs
import os
import sys
from logging.config import fileConfig

from eralchemy import render_er
from sqlalchemy import MetaData, create_engine, pool
from sqlalchemy.engine.url import make_url

from alembic import context
from app.core.config import settings
from app.models import Base

# Import psycopg2 dla bezpośredniego użycia parametrów połączenia
try:
    import psycopg2
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

def generate_erd(connection=None):
    """Generuje diagram ERD po migracji"""
    # Pomijamy generowanie ERD na Windows ze względu na problemy z kodowaniem
    if sys.platform == "win32":
        print("Generowanie ERD pominięte: nie jest obsługiwane na Windows")
        return
    
    if connection is None:
        print("Generowanie ERD pominięte: brak połączenia z bazą danych")
        return
    
    try:
        erd_path = "./ERD.png"
        if os.path.exists(erd_path):
            os.remove(erd_path)
        
        metadata = MetaData()
        metadata.reflect(bind=connection)
        render_er(metadata, erd_path)
        print(f"ERD wygenerowany: {erd_path}")
    except Exception as e:
        print(f"Nie udało się wygenerować ERD: {e}")


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

    # generate_erd() - pomijamy w trybie offline, wymaga połączenia


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


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Używamy DATABASE_URL z settings (.env) zamiast alembic.ini
    # aby uniknąć problemów z kodowaniem
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
            connectable = create_engine(
                "postgresql://",
                poolclass=pool.NullPool,
                creator=create_connection,
            )
        except Exception as e:
            # Jeśli użycie creator się nie powiodło, użyj standardowego podejścia
            connect_args = {"client_encoding": "utf8"}
            connectable = create_engine(
                db_url,
                poolclass=pool.NullPool,
                connect_args=connect_args,
            )
    else:
        # Dla innych baz danych lub jeśli psycopg2 nie jest dostępne
        connect_args = {}
        if "postgresql" in db_url:
            connect_args["client_encoding"] = "utf8"
        
        connectable = create_engine(
            db_url,
            poolclass=pool.NullPool,
            connect_args=connect_args,
        )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

        generate_erd(connection)

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
