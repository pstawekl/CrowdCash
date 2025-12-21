from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.routes import admin
from app.routes import auth as auth_routes
from app.routes import (campaign, error_logs, investment, log, payments,
                        payout, region, sessions, stats, tasks, transaction,
                        upload, user)
from app.routes.notifications import router as notifications_router
from app.routes.user import router as user_router

app = FastAPI()


# Event handler dla zamykania aplikacji
@app.on_event("shutdown")
async def shutdown_event():
    """Zamyka SSH tunnel przy zamykaniu aplikacji."""
    from app.core.database import close_ssh_tunnel
    close_ssh_tunnel()


# Middleware do logowania błędów
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Globalny handler błędów - loguje wszystkie błędy do bazy danych."""
    from app.core.database import get_db
    from app.core.error_logging import log_error_to_db
    
    db = next(get_db())
    
    # Pobierz user_id z tokenu jeśli dostępny
    user_id = None
    try:
        from app import utils
        token = request.headers.get('authorization', '').replace('Bearer ', '')
        if token:
            current_user = utils.get_current_user(token=token, db=db)
            if current_user:
                user_id = current_user.id
    except Exception:
        pass
    
    # Określ kod statusu
    status_code = 500
    if hasattr(exc, 'status_code'):
        status_code = exc.status_code
    
    # Zaloguj błąd
    try:
        log_error_to_db(
            db=db,
            error=exc,
            request=request,
            user_id=user_id,
            status_code=status_code
        )
    except Exception as log_error:
        print(f"CRITICAL: Nie udało się zalogować błędu: {log_error}")
    
    # Zwróć odpowiedź błędu
    if hasattr(exc, 'status_code') and hasattr(exc, 'detail'):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": str(exc.detail)}
        )
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Wystąpił błąd wewnętrzny serwera"}
    )


app.add_middleware(
    CORSMiddleware,
    # Pozwala na dostęp z dowolnego localhost i portu (do developmentu)
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/auth", tags=["auth"])
app.include_router(user.router, prefix="/users", tags=["users"])
app.include_router(log.router, prefix="/admin-logs", tags=["admin-logs"])
app.include_router(error_logs.router, prefix="/error-logs", tags=["error-logs"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
app.include_router(campaign.router)
app.include_router(investment.router)
app.include_router(transaction.router)
app.include_router(admin.router)
app.include_router(payout.router)
app.include_router(region.router)
app.include_router(notifications_router)

app.include_router(user_router)
app.include_router(payments.router)
app.include_router(upload.router, prefix="/upload", tags=["upload"])

# Serwuj statyczne pliki z katalogu uploads
uploads_dir = Path("uploads")
if uploads_dir.exists():
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
if uploads_dir.exists():
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
