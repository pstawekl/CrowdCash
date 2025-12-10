import uuid
from datetime import datetime

from app.core.database import Base
from sqlalchemy import (Boolean, CheckConstraint, Column, DateTime, ForeignKey,
                        Integer, Numeric, String, Table, Text)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, NUMERIC, UUID
from sqlalchemy.orm import relationship

role_permission = Table(
    'role_permission', Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id')),
    Column('permission_id', Integer, ForeignKey('permissions.id'))
)


class User(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role_id = Column(Integer, ForeignKey('roles.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    verification_code = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)

    profile = relationship('Profile', uselist=False,
                           back_populates='user', cascade="all, delete-orphan")
    campaigns = relationship('Campaign', back_populates='entrepreneur',
                             cascade="all, delete-orphan")
    investments = relationship('Investment', back_populates='investor',
                               cascade="all, delete-orphan")
    notifications = relationship('Notification', back_populates='user',
                                 cascade="all, delete-orphan")
    admin_logs = relationship('AdminLog', back_populates='admin',
                              cascade="all, delete-orphan")
    payouts = relationship('Payout', back_populates='entrepreneur',
                           cascade="all, delete-orphan")
    follows = relationship(
        'Follow', foreign_keys='Follow.investor_id', back_populates='investor')
    role = relationship('Role', back_populates='users')


class Profile(Base):
    __tablename__ = 'profiles'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        'users.id', ondelete='CASCADE'))
    name = Column(Text)
    bio = Column(Text)
    location = Column(Text)
    interests = Column(ARRAY(Text))
    profile_picture_url = Column(Text)

    user = relationship('User', back_populates='profile')


class Category(Base):
    __tablename__ = 'categories'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    icon = Column(Text, nullable=True)  # Można później dodać ikony
    created_at = Column(DateTime, default=datetime.utcnow)

    campaigns = relationship('Campaign', back_populates='category_rel')


class Campaign(Base):
    __tablename__ = 'campaigns'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entrepreneur_id = Column(UUID(as_uuid=True), ForeignKey(
        'users.id', ondelete='CASCADE'))
    title = Column(Text, nullable=False)
    description = Column(Text)
    category_id = Column(UUID(as_uuid=True), ForeignKey('categories.id', ondelete='SET NULL'), nullable=True)
    category = Column(Text)  # Zachowaj dla kompatybilności wstecznej podczas migracji
    goal_amount = Column(Numeric(12, 2), nullable=False)
    current_amount = Column(Numeric(12, 2), default=0)
    region = Column(Text)
    deadline = Column(DateTime, nullable=False)
    status = Column(String, CheckConstraint(
        "status IN ('draft', 'active', 'successful', 'failed')"), default='draft')
    created_at = Column(DateTime, default=datetime.utcnow)

    entrepreneur = relationship('User', back_populates='campaigns')
    category_rel = relationship('Category', back_populates='campaigns')
    investments = relationship('Investment', back_populates='campaign',
                               cascade="all, delete-orphan")
    payouts = relationship('Payout', back_populates='campaign',
                           cascade="all, delete-orphan")
    images = relationship('CampaignImage', back_populates='campaign',
                          cascade="all, delete-orphan", order_by='CampaignImage.order_index')
    reward_tiers = relationship('CampaignRewardTier', back_populates='campaign',
                                 cascade="all, delete-orphan", order_by='CampaignRewardTier.min_percentage')


class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stripe_transaction_id = Column(Text)
    amount = Column(Numeric(12, 2), nullable=False)
    fee = Column(Numeric(12, 2), default=0)
    currency = Column(String(3), nullable=False) 
    type = Column(String, CheckConstraint(
        "type IN ('deposit', 'refund', 'payout')"))
    status = Column(String, CheckConstraint(
        "status IN ('pending', 'successful', 'failed', 'cancelled')"), default='pending')
    status_description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    investment = relationship('Investment', back_populates='transaction', uselist=False)
    payout = relationship('Payout', back_populates='transaction', uselist=False)


class Investment(Base):
    __tablename__ = 'investments'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    investor_id = Column(UUID(as_uuid=True), ForeignKey(
        'users.id', ondelete='CASCADE'))
    campaign_id = Column(UUID(as_uuid=True), ForeignKey(
        'campaigns.id', ondelete='CASCADE'))
    transaction_id = Column(UUID(as_uuid=True), ForeignKey(
        'transactions.id', ondelete='SET NULL'), nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String, CheckConstraint(
        "status IN ('pending', 'completed', 'refunded')"), default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)
    
    investor = relationship('User', back_populates='investments')
    campaign = relationship('Campaign', back_populates='investments')
    transaction = relationship('Transaction', back_populates='investment')


class Payout(Base):
    __tablename__ = 'payouts'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entrepreneur_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    campaign_id = Column(UUID(as_uuid=True), ForeignKey('campaigns.id'))
    transaction_id = Column(UUID(as_uuid=True), ForeignKey(
        'transactions.id', ondelete='SET NULL'), nullable=True)
    total_raised = Column(Numeric(12, 2))
    payout_amount = Column(Numeric(12, 2))
    payout_date = Column(DateTime)
    status = Column(String, CheckConstraint(
        "status IN ('pending', 'paid', 'failed')"), default='pending')
    
    entrepreneur = relationship('User', back_populates='payouts')
    campaign = relationship('Campaign', back_populates='payouts')
    transaction = relationship('Transaction', back_populates='payout')


class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        'users.id', ondelete='CASCADE'))
    title = Column(Text)
    body = Column(Text)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship('User', back_populates='notifications')


class AdminLog(Base):
    __tablename__ = 'admin_logs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    action = Column(Text)
    details = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)

    admin = relationship('User', back_populates='admin_logs')


class ErrorLog(Base):
    __tablename__ = 'error_logs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    error_type = Column(String(100), nullable=False)  # np. 'HTTPException', 'ValueError', 'DatabaseError'
    error_message = Column(Text, nullable=False)
    error_details = Column(JSONB)  # Szczegóły błędu (stack trace, request info, etc.)
    status_code = Column(Integer)  # HTTP status code jeśli dotyczy
    endpoint = Column(Text)  # Endpoint gdzie wystąpił błąd
    method = Column(String(10))  # HTTP method (GET, POST, etc.)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)  # Użytkownik jeśli był zalogowany
    ip_address = Column(String(45))  # IPv4 lub IPv6
    user_agent = Column(Text)
    resolved = Column(Boolean, default=False)  # Czy błąd został rozwiązany
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)  # Admin który rozwiązał
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship('User', foreign_keys=[user_id])
    resolver = relationship('User', foreign_keys=[resolved_by])


class Follow(Base):
    __tablename__ = 'follows'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    investor_id = Column(UUID(as_uuid=True), ForeignKey(
        'users.id', ondelete='CASCADE'))
    entrepreneur_id = Column(UUID(as_uuid=True), ForeignKey(
        'users.id', ondelete='CASCADE'))
    created_at = Column(DateTime, default=datetime.utcnow)

    investor = relationship('User', foreign_keys=[
                            investor_id], back_populates='follows')
    entrepreneur = relationship('User', foreign_keys=[entrepreneur_id])


class CampaignImage(Base):
    __tablename__ = 'campaign_images'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey(
        'campaigns.id', ondelete='CASCADE'), nullable=False)
    image_url = Column(Text, nullable=False)  # URL do zdjęcia (może być lokalny lub zewnętrzny)
    order_index = Column(Integer, default=0)  # Kolejność wyświetlania
    alt_text = Column(Text)  # Tekst alternatywny dla dostępności
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship('Campaign', back_populates='images')


class CampaignRewardTier(Base):
    __tablename__ = 'campaign_reward_tiers'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey(
        'campaigns.id', ondelete='CASCADE'), nullable=False)
    title = Column(Text, nullable=False)  # Nazwa widełki (np. "Wsparcie podstawowe")
    description = Column(Text, nullable=False)  # Opis co inwestor otrzyma
    min_percentage = Column(Numeric(5, 2), nullable=False)  # Minimalny % celu (np. 0.5 = 0.5%)
    max_percentage = Column(Numeric(5, 2), nullable=True)  # Maksymalny % celu (NULL = bez limitu)
    min_amount = Column(Numeric(12, 2), nullable=True)  # Minimalna kwota w PLN (opcjonalne)
    max_amount = Column(Numeric(12, 2), nullable=True)  # Maksymalna kwota w PLN (opcjonalne)
    estimated_delivery_date = Column(DateTime, nullable=True)  # Szacowana data dostawy
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship('Campaign', back_populates='reward_tiers')


class RegionCountry(Base):
    __tablename__ = 'region_countries'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    geonameid = Column(String, unique=True, nullable=True)
    name = Column(Text, nullable=False)
    asciiname = Column(Text)
    alternatenames = Column(Text)
    country_code = Column(String(10), nullable=True, unique=True)  # np. PL, US
    population = Column(Numeric, nullable=True)
    timezone = Column(Text)


class RegionState(Base):
    __tablename__ = 'region_states'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    geonameid = Column(String, unique=True, nullable=True)
    name = Column(Text, nullable=False)
    asciiname = Column(Text)
    alternatenames = Column(Text)
    admin1_code = Column(String(20), nullable=True)
    country_id = Column(UUID(as_uuid=True), ForeignKey(
        'region_countries.id', ondelete='CASCADE'))
    population = Column(Numeric, nullable=True)
    timezone = Column(Text)
    country = relationship('RegionCountry')


class RegionCity(Base):
    __tablename__ = 'region_cities'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    geonameid = Column(String, unique=True, nullable=True)
    name = Column(Text, nullable=False)
    asciiname = Column(Text)
    alternatenames = Column(Text)
    latitude = Column(String)
    longitude = Column(String)
    feature_class = Column(String)
    feature_code = Column(String)
    country_id = Column(UUID(as_uuid=True), ForeignKey(
        'region_countries.id', ondelete='CASCADE'))
    state_id = Column(UUID(as_uuid=True), ForeignKey(
        'region_states.id', ondelete='CASCADE'), nullable=True)
    admin1_code = Column(String(20), nullable=True)
    admin2_code = Column(String(20), nullable=True)
    admin3_code = Column(String(20), nullable=True)
    admin4_code = Column(String(20), nullable=True)
    population = Column(Numeric, nullable=True)
    elevation = Column(String)
    dem = Column(String)
    timezone = Column(Text)
    modification_date = Column(String)
    state = relationship('RegionState')
    country = relationship('RegionCountry')


class Company(Base):
    __tablename__ = 'companies'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nip = Column(String(20), unique=True, nullable=False)
    regon = Column(String(20), nullable=True)
    krs = Column(String(20), nullable=True)
    company_name = Column(Text, nullable=False)
    street = Column(Text, nullable=True)
    building_number = Column(String(20), nullable=True)
    apartment_number = Column(String(20), nullable=True)
    postal_code = Column(String(20), nullable=True)
    city = Column(Text, nullable=True)
    country = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)


class Role(Base):
    __tablename__ = 'roles'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    permissions = relationship(
        'Permission', secondary=role_permission, back_populates='roles')
    users = relationship('User', back_populates='role')


class Permission(Base):
    __tablename__ = 'permissions'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    roles = relationship('Role', secondary=role_permission,
                         back_populates='permissions')
