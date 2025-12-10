import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

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
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class CampaignBase(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    category: Optional[str] = None  # Zachowaj dla kompatybilności wstecznej
    goal_amount: float
    region: Optional[str] = None
    deadline: datetime
    images: Optional[List['CampaignImageCreate']] = None
    reward_tiers: Optional[List['CampaignRewardTierCreate']] = None


class CampaignCreate(CampaignBase):
    pass


class CampaignOut(CampaignBase):
    id: uuid.UUID
    entrepreneur_id: uuid.UUID
    current_amount: float
    status: str
    created_at: datetime
    category_rel: Optional[CategoryOut] = None
    images: Optional[List['CampaignImageOut']] = None
    reward_tiers: Optional[List['CampaignRewardTierOut']] = None

    model_config = {"from_attributes": True}


# Campaign Image Schemas
class CampaignImageBase(BaseModel):
    image_url: str
    order_index: Optional[int] = 0
    alt_text: Optional[str] = None


class CampaignImageCreate(CampaignImageBase):
    pass


class CampaignImageOut(CampaignImageBase):
    id: uuid.UUID
    campaign_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# Campaign Reward Tier Schemas
class CampaignRewardTierBase(BaseModel):
    title: str
    description: str
    min_percentage: float  # Minimalny % celu kampanii
    max_percentage: Optional[float] = None  # Maksymalny % celu (None = bez limitu)
    min_amount: Optional[float] = None  # Minimalna kwota w PLN
    max_amount: Optional[float] = None  # Maksymalna kwota w PLN
    estimated_delivery_date: Optional[datetime] = None


class CampaignRewardTierCreate(CampaignRewardTierBase):
    pass


class CampaignRewardTierOut(CampaignRewardTierBase):
    id: uuid.UUID
    campaign_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# --- INVESTMENT ---
class InvestmentStatusEnum(Enum):
    PENDING = 'pending'
    COMPLETED = 'completed'
    REFUNDED = 'refunded'

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
    transaction_id: uuid.UUID | None = None

    model_config = {"from_attributes": True}


# --- TRANSACTION ---
class TransactionStatusEnum(Enum):
    PENDING = "pending"
    ACCEPTED = "successful"
    FAILED = "failed"
    CANCELLED = 'cancelled'

class TransactionTypeEnum(Enum):
    DEPOSIT = "deposit"
    REFUND = "refund"
    PAYOUT = "payout"

class AccountHolderType(Enum):
    INDIVIDUAL = "individual"
    COMPANY = 'company'


class TransactionCreate(BaseModel):
    currency: str
    amount: float
    investment_id: uuid.UUID
    title: Optional[str] = None
    status: Optional[str] = TransactionStatusEnum.PENDING
    type: Optional[str] = TransactionTypeEnum.DEPOSIT

class TransactionOut(TransactionCreate):
    id: str
    created_at: datetime
    payment_url: str

    model_config = {"from_attributes": True}

class TransactionDetailed(TransactionCreate):
    id: str
    created_at: datetime
    stripe_transaction_id: Optional[str] = None
    fee: float

class TransactionList(BaseModel):
    """Schemat dla listy transakcji - bez investment_id (relacja jest odwrotna)"""
    id: str
    currency: str
    amount: float
    fee: float
    type: str
    status: str
    stripe_transaction_id: Optional[str] = None
    status_description: Optional[str] = None
    created_at: datetime
    investment_id: Optional[uuid.UUID] = None  # Opcjonalne, bo pobieramy przez relację

    model_config = {"from_attributes": True}

class TransactionPaymentUrl(BaseModel):
    payment_link: str   

class PayoutTransactionCreate(BaseModel):
    amount: float
    payout_id: uuid.UUID
    currency: str
    payout_description: str
    status: Optional[str] = TransactionStatusEnum.PENDING
    type:str = TransactionTypeEnum.PAYOUT

class PayoutTransactionOut(PayoutTransactionCreate):
    id: str
    created_at: datetime


# --- PAYOUT ---
class PayoutBase(BaseModel):
    total_raised: Optional[float] = None
    payout_amount: float
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


# Error Log Schemas
class ErrorLogBase(BaseModel):
    error_type: str
    error_message: str
    error_details: Optional[Dict[str, Any]] = None
    status_code: Optional[int] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None
    user_id: Optional[uuid.UUID] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class ErrorLogCreate(ErrorLogBase):
    pass


class ErrorLogUpdate(BaseModel):
    resolved: Optional[bool] = None
    resolved_by: Optional[uuid.UUID] = None


class ErrorLogOut(ErrorLogBase):
    id: uuid.UUID
    resolved: bool
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[uuid.UUID] = None
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
