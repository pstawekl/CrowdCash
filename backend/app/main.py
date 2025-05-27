from app.routes import auth as auth_routes
from app.routes import (admin, auth, campaign, investment, log, payout,
                        sessions, stats, tasks, transaction, user)
from app.routes.user import router as user_router
from fastapi import FastAPI

app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user.router, prefix="/users", tags=["users"])
app.include_router(log.router, prefix="/admin-logs", tags=["admin-logs"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])
app.include_router(campaign.router)
app.include_router(investment.router)
app.include_router(transaction.router)
app.include_router(admin.router)
app.include_router(payout.router)

app.include_router(user_router)

# Dodajemy /me bez prefixu /auth

app.include_router(auth_routes.router)
