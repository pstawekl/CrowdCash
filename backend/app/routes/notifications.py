from uuid import UUID

from app import models, schemas, utils
from app.core.database import get_db
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[schemas.NotificationOut])
async def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca powiadomienia użytkownika.
    """
    return db.query(models.Notification).filter(models.Notification.user_id == current_user.id).order_by(models.Notification.created_at.desc()).all()


@router.get("/{notification_id}", response_model=schemas.NotificationOut)
async def get_notification(notification_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca szczegóły powiadomienia (tylko właściciel).
    """
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return notification


@router.patch("/{notification_id}/read")
async def mark_notification_read(notification_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Oznacza powiadomienie jako przeczytane.
    """
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    notification.read = True
    db.commit()
    db.refresh(notification)
    return {"message": "Notification marked as read"}
