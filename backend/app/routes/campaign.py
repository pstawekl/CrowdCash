from typing import Optional
from uuid import UUID

from app import models, schemas, utils
from app.core.database import get_db
from fastapi import APIRouter, Body, Depends, HTTPException, Query
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

    # Konwertuj UUID na stringi
    db_campaign.id = str(db_campaign.id)
    db_campaign.entrepreneur_id = str(db_campaign.entrepreneur_id)

    return db_campaign


@router.get("/", response_model=list[schemas.CampaignOut])
async def list_campaigns(db: Session = Depends(get_db)):
    """
    Zwraca listę wszystkich kampanii.
    """
    campaigns = db.query(models.Campaign).all()

    # Konwertuj UUID na stringi
    for campaign in campaigns:
        campaign.id = str(campaign.id)
        campaign.entrepreneur_id = str(campaign.entrepreneur_id)

    return campaigns


@router.get("/my", response_model=list[schemas.CampaignOut])
async def my_campaigns(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Zwraca kampanie zalogowanego przedsiębiorcy.
    """
    if current_user.role.name != "entrepreneur":
        raise HTTPException(
            status_code=403, detail="Tylko przedsiębiorca może mieć własne kampanie.")

    campaigns = db.query(models.Campaign).filter(
        models.Campaign.entrepreneur_id == current_user.id).all()

    # Konwertuj UUID na stringi
    for campaign in campaigns:
        campaign.id = str(campaign.id)
        campaign.entrepreneur_id = str(campaign.entrepreneur_id)

    return campaigns


@router.get("/feed", response_model=list[schemas.CampaignOut])
async def campaigns_feed(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
    q: Optional[str] = Query(
        default=None, description="Fraza do wyszukiwania w kampaniach"),
    region: Optional[str] = Query(default=None, description="Region kampanii")
):
    """
    Zwraca kampanie globalnie: jeśli jest fraza q, filtruje po tytule, opisie, kategorii; jeśli nie ma frazy, zwraca 5 najnowszych kampanii. Można filtrować po regionie.
    """
    try:
        query = db.query(models.Campaign)
        if q:
            q_like = f"%{q.lower()}%"
            query = query.filter(
                func.lower(models.Campaign.title).like(q_like) |
                func.lower(models.Campaign.description).like(q_like) |
                func.lower(models.Campaign.category).like(q_like)
            )
        if region:
            query = query.filter(func.lower(
                models.Campaign.region) == region.lower())
        campaigns = query.order_by(models.Campaign.created_at.desc())
        if not q and not region:
            campaigns = campaigns.limit(5)

        result = campaigns.all()

        # Konwertuj UUID na stringi
        for campaign in result:
            campaign.id = str(campaign.id)
            campaign.entrepreneur_id = str(campaign.entrepreneur_id)

        return result
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


@router.get("/regions", response_class=JSONResponse)
async def get_campaign_regions():
    """
    Zwraca listę dostępnych regionów kampanii (przykładowe miasta, powiaty, województwa).
    """
    regions = [
        "Zduńska Wola",
        "Powiat Skierniewicki",
        "Województwo Małopolskie",
        "Warszawa",
        "Kraków",
        "Województwo Mazowieckie",
        "Województwo Śląskie",
        "Powiat Łódzki Wschodni",
        "Poznań",
        "Gdańsk",
        "Wrocław",
        "Inny region"
    ]
    return regions


@router.get("/all-regions", response_model=dict)
async def get_all_regions(db: Session = Depends(get_db)):
    """
    Zwraca wszystkie regiony: kraje, stany/województwa, miasta.
    """
    countries = db.query(models.RegionCountry).all()
    states = db.query(models.RegionState).all()
    cities = db.query(models.RegionCity).all()
    return {
        "countries": [schemas.RegionCountry.from_orm(c) for c in countries],
        "states": [schemas.RegionState.from_orm(s) for s in states],
        "cities": [schemas.RegionCity.from_orm(c) for c in cities],
    }


@router.get("/{campaign_id}", response_model=schemas.CampaignOut)
async def get_campaign(campaign_id: UUID, db: Session = Depends(get_db)):
    """
    Zwraca szczegóły kampanii po ID.
    """
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Konwertuj UUID na stringi
    campaign.id = str(campaign.id)
    campaign.entrepreneur_id = str(campaign.entrepreneur_id)

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


@router.patch("/{campaign_id}/status", response_model=schemas.CampaignOut)
async def update_campaign_status(
    campaign_id: UUID,
    status: str = Body(embed=True,
                       description="Nowy status kampanii ('draft', 'active', 'successful', 'failed')"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    """
    Pozwala właścicielowi kampanii (lub adminowi) zmienić status kampanii.
    """
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.entrepreneur_id != current_user.id and not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Not authorized")
    if status not in ["draft", "active", "successful", "failed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    campaign.status = status
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/{campaign_id}/stats")
async def get_campaign_stats(campaign_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca statystyki kampanii (liczba inwestorów, łączna kwota).
    """
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Sprawdź uprawnienia - tylko właściciel kampanii lub admin
    if campaign.entrepreneur_id != current_user.id and not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Not authorized")

    investments = db.query(models.Investment).filter(
        models.Investment.campaign_id == campaign_id).all()

    return {
        "investor_count": len(set(inv.investor_id for inv in investments)),
        "total_invested": sum(float(inv.amount) for inv in investments),
        "investment_count": len(investments)
    }


@router.get("/{campaign_id}/investors")
async def get_campaign_investors(campaign_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca listę inwestorów w kampanii.
    """
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Sprawdź uprawnienia - tylko właściciel kampanii lub admin
    if campaign.entrepreneur_id != current_user.id and not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Not authorized")

    investments = db.query(models.Investment).filter(
        models.Investment.campaign_id == campaign_id).all()

    result = []
    for inv in investments:
        user = db.query(models.User).filter(
            models.User.id == inv.investor_id).first()
        if user:
            result.append({
                "id": str(user.id),
                "email": user.email,
                "amount": float(inv.amount),
                "status": inv.status,
                "created_at": inv.created_at
            })

    return result


@router.post("/{campaign_id}/close")
async def close_campaign(campaign_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zamyka kampanię (tylko właściciel lub admin).
    """
    campaign = db.query(models.Campaign).filter(
        models.Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.entrepreneur_id != current_user.id and not getattr(current_user, 'is_admin', False):
        raise HTTPException(status_code=403, detail="Not authorized")

    campaign.status = 'failed'  # Zamykamy jako nieudaną
    db.commit()
    db.refresh(campaign)
    return {"message": "Campaign closed successfully"}
