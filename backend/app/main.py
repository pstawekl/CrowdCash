from app.routes import admin
from app.routes import auth as auth_routes
from app.routes import (campaign, investment, log, payout, region, sessions,
                        stats, tasks, transaction, user)
from app.routes.notifications import router as notifications_router
from app.routes.user import router as user_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

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
