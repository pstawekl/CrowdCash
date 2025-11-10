import uuid
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, EmailStr, Field


# --- USER ---
class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    role: str  # tylko dla tworzenia użytkownika


class UserOut(UserBase):
    id: uuid.UUID
    role_id: int
    created_at: datetime
    last_login: Optional[datetime] = None
    is_verified: bool

    model_config = {"from_attributes": True}


# --- PROFILE ---
class ProfileBase(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    interests: Optional[List[str]] = None
    profile_picture_url: Optional[str] = None


class ProfileCreate(ProfileBase):
    pass


class ProfileOut(ProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID

    model_config = {"from_attributes": True}


# --- CAMPAIGN ---
class CampaignBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    goal_amount: float
    region: Optional[str] = None
    deadline: datetime


class CampaignCreate(CampaignBase):
    pass


class CampaignOut(CampaignBase):
    id: uuid.UUID
    entrepreneur_id: uuid.UUID
    current_amount: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- INVESTMENT ---
class InvestmentBase(BaseModel):
    amount: float


class InvestmentCreate(InvestmentBase):
    campaign_id: uuid.UUID


class InvestmentOut(InvestmentBase):
    id: uuid.UUID
    investor_id: uuid.UUID
    campaign_id: uuid.UUID
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class InvestmentHistoryOut(BaseModel):
    id: uuid.UUID
    amount: float
    status: str
    created_at: datetime
    campaign_id: uuid.UUID | None = None
    campaign_title: str | None = None
    campaign_status: str | None = None

    model_config = {"from_attributes": True}


# --- TRANSACTION ---
class TransactionBase(BaseModel):
    amount: float
    fee: Optional[float] = 0
    type: str
    stripe_transaction_id: Optional[str] = None


class TransactionCreate(TransactionBase):
    investment_id: uuid.UUID


class TransactionOut(TransactionBase):
    id: uuid.UUID
    investment_id: uuid.UUID
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- PAYOUT ---
class PayoutBase(BaseModel):
    total_raised: Optional[float] = None
    payout_amount: Optional[float] = None
    payout_date: Optional[datetime] = None


class PayoutCreate(PayoutBase):
    campaign_id: uuid.UUID
    entrepreneur_id: uuid.UUID


class PayoutOut(PayoutBase):
    id: uuid.UUID
    entrepreneur_id: uuid.UUID
    campaign_id: uuid.UUID
    status: str

    model_config = {"from_attributes": True}


# --- NOTIFICATION ---
class NotificationBase(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    read: Optional[bool] = False


class NotificationCreate(NotificationBase):
    user_id: uuid.UUID


class NotificationOut(NotificationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# --- ADMIN LOG ---
class AdminLogBase(BaseModel):
    action: str
    details: Optional[Any] = None


class AdminLogCreate(AdminLogBase):
    admin_id: uuid.UUID


class AdminLogOut(AdminLogBase):
    id: uuid.UUID
    admin_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# --- FOLLOW ---
class FollowBase(BaseModel):
    investor_id: uuid.UUID
    entrepreneur_id: uuid.UUID


class FollowCreate(FollowBase):
    pass


class FollowOut(BaseModel):
    id: uuid.UUID
    investor_id: uuid.UUID
    entrepreneur_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# --- REGION ---
class RegionCountry(BaseModel):
    id: uuid.UUID
    name: str
    code: str | None = None

    model_config = {"from_attributes": True}


class RegionState(BaseModel):
    id: uuid.UUID
    name: str
    code: str | None = None
    country_id: uuid.UUID

    model_config = {"from_attributes": True}


class RegionCity(BaseModel):
    id: uuid.UUID
    name: str
    state_id: uuid.UUID
    country_id: uuid.UUID

    model_config = {"from_attributes": True}


# --- ENTREPRENEUR REGISTRATION ---
class EntrepreneurRegister(BaseModel):
    email: EmailStr
    password: str
    role: str = 'entrepreneur'
    company_name: str
    nip: str
    city_id: uuid.UUID


class EntrepreneurOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: str
    company_name: str
    nip: str
    city_id: uuid.UUID
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = {"from_attributes": True}


# --- ROLE AND PERMISSION ---
class PermissionOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class RoleOut(BaseModel):
    id: int
    name: str
    permissions: List[PermissionOut]

    model_config = {"from_attributes": True}
