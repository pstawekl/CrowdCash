from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas, utils
from app.core.database import get_db

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def load_campaign_category(campaign: models.Campaign, db: Session):
    """
    Helper function to load category_rel for a campaign based on category name.
    Since category_id/category_rel relationship is commented out in the model,
    we manually load the Category object and set it as an attribute.
    """
    if campaign.category:
        # Find Category by name
        category = (
            db.query(models.Category)
            .filter(models.Category.name == campaign.category)
            .first()
        )
        if category:
            # Manually set the category_rel attribute
            campaign.category_rel = category
        else:
            campaign.category_rel = None
    else:
        campaign.category_rel = None


@router.post("/", response_model=schemas.CampaignOut)
async def create_campaign(
    campaign: schemas.CampaignCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Tworzy nową kampanię crowdfundingową z możliwością dodania zdjęć i widełek nagród.
    Region powinien być ID miasta (UUID) - zostanie przekonwertowany na nazwę miasta.
    """
    campaign_data = campaign.dict(exclude={"images", "reward_tiers"})

    # Jeśli region jest UUID (ID miasta), znajdź miasto i użyj jego nazwy
    region_value = campaign_data.get("region")
    if region_value:
        try:
            # Sprawdź czy to UUID
            import uuid as uuid_lib

            city_uuid = uuid_lib.UUID(region_value)
            # Znajdź miasto po ID
            city = (
                db.query(models.RegionCity)
                .filter(models.RegionCity.id == city_uuid)
                .first()
            )
            if city:
                campaign_data["region"] = city.name
        except (ValueError, TypeError):
            # Jeśli nie jest UUID, użyj jako tekst (kompatybilność wsteczna)
            pass

    # Obsługa category_id - jeśli podano category_id, użyj go, jeśli nie, sprawdź category (tekst)
    category_id = campaign_data.pop("category_id", None)
    category_text = campaign_data.pop("category", None)

    if category_id:
        # Sprawdź czy kategoria istnieje
        category = (
            db.query(models.Category).filter(models.Category.id == category_id).first()
        )
        if not category:
            raise HTTPException(
                status_code=400, detail="Kategoria nie została znaleziona"
            )
        # Używamy tylko nazwy kategorii, ponieważ model Campaign ma tylko pole 'category' jako Text
        campaign_data["category"] = category.name
    elif category_text:
        # Jeśli podano tekst kategorii, użyj go bezpośrednio
        category = (
            db.query(models.Category)
            .filter(models.Category.name == category_text)
            .first()
        )
        if category:
            campaign_data["category"] = category.name
        else:
            # Jeśli kategoria nie istnieje, użyj tylko tekstu
            campaign_data["category"] = category_text

    db_campaign = models.Campaign(**campaign_data, entrepreneur_id=current_user.id)
    db.add(db_campaign)
    db.flush()  # Flush żeby dostać ID kampanii

    # Dodaj zdjęcia jeśli są
    if campaign.images:
        for idx, image_data in enumerate(campaign.images):
            db_image = models.CampaignImage(
                campaign_id=db_campaign.id,
                image_url=image_data.image_url,
                order_index=(
                    image_data.order_index
                    if image_data.order_index is not None
                    else idx
                ),
                alt_text=image_data.alt_text,
            )
            db.add(db_image)

    # Dodaj widełki nagród jeśli są
    if campaign.reward_tiers:
        for tier_data in campaign.reward_tiers:
            db_tier = models.CampaignRewardTier(
                campaign_id=db_campaign.id,
                title=tier_data.title,
                description=tier_data.description,
                min_percentage=tier_data.min_percentage,
                max_percentage=tier_data.max_percentage,
                min_amount=tier_data.min_amount,
                max_amount=tier_data.max_amount,
                estimated_delivery_date=tier_data.estimated_delivery_date,
            )
            db.add(db_tier)

    db.commit()
    db.refresh(db_campaign)

    # Załaduj kategorię
    load_campaign_category(db_campaign, db)

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

    # Konwertuj UUID na stringi i załaduj kategorie
    for campaign in campaigns:
        campaign.id = str(campaign.id)
        campaign.entrepreneur_id = str(campaign.entrepreneur_id)
        load_campaign_category(campaign, db)

    return campaigns


@router.get("/my", response_model=list[schemas.CampaignOut])
async def my_campaigns(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Zwraca kampanie zalogowanego przedsiębiorcy.
    """
    if current_user.role.name != "entrepreneur":
        raise HTTPException(
            status_code=403, detail="Tylko przedsiębiorca może mieć własne kampanie."
        )

    campaigns = (
        db.query(models.Campaign)
        .filter(models.Campaign.entrepreneur_id == current_user.id)
        .all()
    )

    # Konwertuj UUID na stringi i załaduj relacje
    for campaign in campaigns:
        campaign.id = str(campaign.id)
        campaign.entrepreneur_id = str(campaign.entrepreneur_id)
        # Załaduj zdjęcia, widełki i kategorię
        _ = campaign.images
        _ = campaign.reward_tiers
        load_campaign_category(campaign, db)

    return campaigns


@router.get("/feed", response_model=list[schemas.CampaignOut])
async def campaigns_feed(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
    q: Optional[str] = Query(
        default=None, description="Fraza do wyszukiwania w kampaniach"
    ),
    region: Optional[str] = Query(default=None, description="Region kampanii"),
):
    """
    Zwraca kampanie globalnie: jeśli jest fraza q, filtruje po tytule, opisie, kategorii; jeśli nie ma frazy, zwraca 5 najnowszych kampanii. Można filtrować po regionie.
    """
    try:
        query = db.query(models.Campaign)
        if q:
            q_like = f"%{q.lower()}%"
            query = query.filter(
                func.lower(models.Campaign.title).like(q_like)
                | func.lower(models.Campaign.description).like(q_like)
                | func.lower(models.Campaign.category).like(q_like)
            )
        if region:
            query = query.filter(func.lower(models.Campaign.region) == region.lower())
        campaigns = query.order_by(models.Campaign.created_at.desc())
        if not q and not region:
            campaigns = campaigns.limit(5)

        result = campaigns.all()

        # Konwertuj UUID na stringi i załaduj relacje
        for campaign in result:
            campaign.id = str(campaign.id)
            campaign.entrepreneur_id = str(campaign.entrepreneur_id)
            # Załaduj zdjęcia, widełki i kategorię
            _ = campaign.images
            _ = campaign.reward_tiers
            load_campaign_category(campaign, db)

        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Wystąpił nieoczekiwany błąd podczas pobierania feedu.",
        )


@router.get("/categories", response_model=list[schemas.CategoryOut])
async def get_campaign_categories(db: Session = Depends(get_db)):
    """
    Zwraca listę dostępnych kategorii kampanii z bazy danych.
    """
    categories = db.query(models.Category).order_by(models.Category.name).all()
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
        "Inny region",
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
    Zwraca szczegóły kampanii po ID z zdjęciami i widełkami nagród.
    """
    campaign = (
        db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Załaduj zdjęcia, widełki i kategorię
    _ = campaign.images
    _ = campaign.reward_tiers
    load_campaign_category(campaign, db)

    # Konwertuj UUID na stringi
    campaign.id = str(campaign.id)
    campaign.entrepreneur_id = str(campaign.entrepreneur_id)

    return campaign


@router.put("/{campaign_id}", response_model=schemas.CampaignOut)
async def update_campaign(
    campaign_id: UUID,
    campaign_update: schemas.CampaignCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Aktualizuje kampanię (tylko właściciel lub admin).
    Obsługuje aktualizację zdjęć i widełek nagród.
    """
    campaign = (
        db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.entrepreneur_id != current_user.id and not getattr(
        current_user, "is_admin", False
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    campaign_data = campaign_update.dict(exclude={"images", "reward_tiers"})

    # Jeśli region jest UUID (ID miasta), znajdź miasto i użyj jego nazwy
    region_value = campaign_data.get("region")
    if region_value:
        try:
            import uuid as uuid_lib

            city_uuid = uuid_lib.UUID(region_value)
            city = (
                db.query(models.RegionCity)
                .filter(models.RegionCity.id == city_uuid)
                .first()
            )
            if city:
                campaign_data["region"] = city.name
        except (ValueError, TypeError):
            pass

    # Obsługa category_id
    category_id = campaign_data.pop("category_id", None)
    category_text = campaign_data.pop("category", None)

    if category_id:
        category = (
            db.query(models.Category).filter(models.Category.id == category_id).first()
        )
        if not category:
            raise HTTPException(
                status_code=400, detail="Kategoria nie została znaleziona"
            )
        # Używamy tylko nazwy kategorii, ponieważ model Campaign ma tylko pole 'category' jako Text
        campaign_data["category"] = category.name
    elif category_text:
        category = (
            db.query(models.Category)
            .filter(models.Category.name == category_text)
            .first()
        )
        if category:
            campaign_data["category"] = category.name
        else:
            campaign_data["category"] = category_text

    # Aktualizuj podstawowe pola
    for field, value in campaign_data.items():
        setattr(campaign, field, value)

    # Usuń stare zdjęcia i widełki
    db.query(models.CampaignImage).filter(
        models.CampaignImage.campaign_id == campaign_id
    ).delete()
    db.query(models.CampaignRewardTier).filter(
        models.CampaignRewardTier.campaign_id == campaign_id
    ).delete()

    # Dodaj nowe zdjęcia jeśli są
    if campaign_update.images:
        for idx, image_data in enumerate(campaign_update.images):
            db_image = models.CampaignImage(
                campaign_id=campaign.id,
                image_url=image_data.image_url,
                order_index=(
                    image_data.order_index
                    if image_data.order_index is not None
                    else idx
                ),
                alt_text=image_data.alt_text,
            )
            db.add(db_image)

    # Dodaj nowe widełki jeśli są
    if campaign_update.reward_tiers:
        for tier_data in campaign_update.reward_tiers:
            db_tier = models.CampaignRewardTier(
                campaign_id=campaign.id,
                title=tier_data.title,
                description=tier_data.description,
                min_percentage=tier_data.min_percentage,
                max_percentage=tier_data.max_percentage,
                min_amount=tier_data.min_amount,
                max_amount=tier_data.max_amount,
                estimated_delivery_date=tier_data.estimated_delivery_date,
            )
            db.add(db_tier)

    db.commit()
    db.refresh(campaign)

    # Załaduj relacje
    _ = campaign.images
    _ = campaign.reward_tiers
    load_campaign_category(campaign, db)

    # Konwertuj UUID na stringi
    campaign.id = str(campaign.id)
    campaign.entrepreneur_id = str(campaign.entrepreneur_id)

    return campaign


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Usuwa kampanię (tylko właściciel lub admin).
    Można usunąć tylko kampanie ze statusem 'draft'.
    """
    campaign = (
        db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.entrepreneur_id != current_user.id and not getattr(
        current_user, "is_admin", False
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Sprawdź czy kampania jest w statusie draft
    if campaign.status != "draft":
        raise HTTPException(
            status_code=400,
            detail="Można usunąć tylko kampanie ze statusem 'szkic'. Opublikowane kampanie nie mogą być usunięte.",
        )

    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted successfully"}


@router.patch("/{campaign_id}/status", response_model=schemas.CampaignOut)
async def update_campaign_status(
    campaign_id: UUID,
    status: str = Body(
        embed=True,
        description="Nowy status kampanii ('draft', 'active', 'successful', 'failed')",
    ),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Pozwala właścicielowi kampanii (lub adminowi) zmienić status kampanii.
    """
    campaign = (
        db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.entrepreneur_id != current_user.id and not getattr(
        current_user, "is_admin", False
    ):
        raise HTTPException(status_code=403, detail="Not authorized")
    if status not in ["draft", "active", "successful", "failed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    campaign.status = status
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/{campaign_id}/stats")
async def get_campaign_stats(
    campaign_id: UUID,
    investments_status: Optional[schemas.InvestmentStatusEnum] = Query(
        None, description="Filter by investments status"
    ),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Zwraca statystyki kampanii (liczba inwestorów, łączna kwota).
    """
    campaign = (
        db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Sprawdź uprawnienia - tylko właściciel kampanii lub admin
    if campaign.entrepreneur_id != current_user.id and not getattr(
        current_user, "is_admin", False
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Zawsze liczymy tylko approved płatności (successful transactions)
    # Pending płatności nie liczą się do postępu kampanii
    filters = [
        models.Investment.campaign_id == campaign_id,
        models.Transaction.status == "successful",  # Tylko approved płatności
        models.Investment.status == "completed",
    ]

    # Jeśli podano investments_status, dodaj dodatkowy filtr
    # Ale nadal wymagamy successful transaction
    if investments_status:
        filters.append(models.Investment.status == investments_status.value)

    investments = (
        db.query(models.Investment).join(models.Transaction).filter(*filters).all()
    )

    return {
        "investor_count": len(set(inv.investor_id for inv in investments)),
        "total_invested": sum(float(inv.amount) for inv in investments),
        "investment_count": len(investments),
    }


@router.get("/{campaign_id}/investors")
async def get_campaign_investors(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Zwraca listę inwestorów w kampanii.
    """
    campaign = (
        db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Sprawdź uprawnienia - tylko właściciel kampanii lub admin
    if campaign.entrepreneur_id != current_user.id and not getattr(
        current_user, "is_admin", False
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Tylko completed inwestycje (approved płatności) - pending nie liczą się
    investments = (
        db.query(models.Investment)
        .join(models.Transaction)
        .filter(
            models.Investment.campaign_id == campaign_id,
            models.Investment.status == "completed",
            models.Transaction.status == "successful",
        )
        .all()
    )

    result = []
    for inv in investments:
        user = db.query(models.User).filter(models.User.id == inv.investor_id).first()
        if user:
            result.append(
                {
                    "id": str(user.id),
                    "email": user.email,
                    "amount": float(inv.amount),
                    "status": inv.status,
                    "created_at": inv.created_at,
                }
            )

    return result


@router.post("/{campaign_id}/close")
async def close_campaign(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Zamyka kampanię (tylko właściciel lub admin).
    """
    campaign = (
        db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.entrepreneur_id != current_user.id and not getattr(
        current_user, "is_admin", False
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    campaign.status = "failed"  # Zamykamy jako nieudaną
    db.commit()
    db.refresh(campaign)
    return {"message": "Campaign closed successfully"}
    return {"message": "Campaign closed successfully"}
