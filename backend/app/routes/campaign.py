from uuid import UUID

from app import models, schemas, utils
from app.core.database import get_db
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.post("/", response_model=schemas.CampaignOut)
async def create_campaign(
    campaign: schemas.CampaignCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Tworzy nową kampanię crowdfundingową.
    """
    db_campaign = models.Campaign(
        **campaign.dict(),
        entrepreneur_id=current_user.id
    )
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign


@router.get("/", response_model=list[schemas.CampaignOut])
async def list_campaigns(db: Session = Depends(get_db)):
    """
    Zwraca listę wszystkich kampanii.
    """
    return db.query(models.Campaign).all()


@router.get("/my", response_model=list[schemas.CampaignOut])
async def my_campaigns(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Zwraca kampanie zalogowanego przedsiębiorcy.
    """
    if current_user.role != "entrepreneur":
        raise HTTPException(
            status_code=403, detail="Tylko przedsiębiorca może mieć własne kampanie.")
    return db.query(models.Campaign).filter(
        models.Campaign.entrepreneur_id == current_user.id).all()


@router.get("/feed", response_model=list[schemas.CampaignOut])
async def campaigns_feed(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
    q: str = Query(None, description="Fraza do wyszukiwania w kampaniach")
):
    """
    Zwraca kampanie globalnie: jeśli jest fraza q, filtruje po tytule, opisie, kategorii; jeśli nie ma frazy, zwraca 5 najnowszych kampanii.
    """
    try:
        if q:
            q_like = f"%{q.lower()}%"
            query = db.query(models.Campaign).filter(
                func.lower(models.Campaign.title).like(q_like) |
                func.lower(models.Campaign.description).like(q_like) |
                func.lower(models.Campaign.category).like(q_like)
            )
            campaigns = query.order_by(models.Campaign.created_at.desc()).all()
            return campaigns
        else:
            campaigns = db.query(models.Campaign).order_by(
                models.Campaign.created_at.desc()).limit(5).all()
            return campaigns
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Wystąpił nieoczekiwany błąd podczas pobierania feedu.")


@router.get("/categories", response_class=JSONResponse)
async def get_campaign_categories():
    """
    Zwraca listę dostępnych kategorii kampanii.
    """
    categories = [
        "Technologia",
        "Zdrowie",
        "Edukacja",
        "Sztuka",
        "Społeczność",
        "Inne",
    ]
    return categories


@router.get("/{campaign_id}", response_model=schemas.CampaignOut)
async def get_campaign(campaign_id: UUID, db: Session = Depends(get_db)):
    """
    Zwraca szczegóły kampanii po ID.
    """
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.put("/{campaign_id}", response_model=schemas.CampaignOut)
async def update_campaign(
    campaign_id: UUID,
    campaign_update: schemas.CampaignCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Aktualizuje kampanię (tylko właściciel lub admin).
    """
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.entrepreneur_id != current_user.id and not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Not authorized")
    for field, value in campaign_update.dict(exclude_unset=True).items():
        setattr(campaign, field, value)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Usuwa kampanię (tylko właściciel lub admin).
    """
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.entrepreneur_id != current_user.id and not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted successfully"}
