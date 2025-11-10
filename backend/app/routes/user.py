from uuid import UUID

from app import crud, models, schemas, utils
from app.core.database import get_db
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/users/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: UUID, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Konwertuj UUID na string
    db_user.id = str(db_user.id)

    return db_user


@router.post("/follow/{entrepreneur_id}", response_model=schemas.FollowOut)
async def follow_entrepreneur(entrepreneur_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role.name != "investor":
        raise HTTPException(
            status_code=403, detail="Tylko inwestor może obserwować przedsiębiorców.")
    if db.query(models.Follow).filter_by(investor_id=current_user.id, entrepreneur_id=entrepreneur_id).first():
        raise HTTPException(
            status_code=400, detail="Już obserwujesz tego przedsiębiorcę.")
    follow = models.Follow(investor_id=current_user.id,
                           entrepreneur_id=entrepreneur_id)
    db.add(follow)
    db.commit()
    db.refresh(follow)
    return follow


@router.delete("/unfollow/{entrepreneur_id}")
async def unfollow_entrepreneur(entrepreneur_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    follow = db.query(models.Follow).filter_by(
        investor_id=current_user.id, entrepreneur_id=entrepreneur_id).first()
    if not follow:
        raise HTTPException(
            status_code=404, detail="Nie obserwujesz tego przedsiębiorcy.")
    db.delete(follow)
    db.commit()
    return {"detail": "Przestano obserwować przedsiębiorcę."}


@router.get("/following", response_model=list[schemas.FollowOut])
async def list_following(db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    return db.query(models.Follow).filter_by(investor_id=current_user.id).all()


@router.get("/me/profile", response_model=schemas.ProfileOut)
async def get_my_profile(db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Zwraca profil zalogowanego użytkownika.
    """
    profile = db.query(models.Profile).filter(
        models.Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/me/profile", response_model=schemas.ProfileOut)
async def update_my_profile(profile_update: schemas.ProfileCreate, db: Session = Depends(get_db), current_user: models.User = Depends(utils.get_current_user)):
    """
    Aktualizuje profil zalogowanego użytkownika.
    """
    profile = db.query(models.Profile).filter(
        models.Profile.user_id == current_user.id).first()
    if not profile:
        # Utwórz profil jeśli nie istnieje
        profile = models.Profile(user_id=current_user.id)
        db.add(profile)

    for field, value in profile_update.dict(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/{user_id}/profile", response_model=schemas.ProfileOut)
async def get_user_profile(user_id: UUID, db: Session = Depends(get_db)):
    """
    Zwraca profil użytkownika (publiczny).
    """
    profile = db.query(models.Profile).filter(
        models.Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
