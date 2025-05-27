import uuid
from datetime import datetime

from app.core.database import Base
from sqlalchemy import (Boolean, CheckConstraint, Column, DateTime, ForeignKey,
                        Numeric, String, Text)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, NUMERIC, UUID
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(String, CheckConstraint(
        "role IN ('investor', 'entrepreneur', 'admin')"), nullable=False)
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


class Campaign(Base):
    __tablename__ = 'campaigns'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entrepreneur_id = Column(UUID(as_uuid=True), ForeignKey(
        'users.id', ondelete='CASCADE'))
    title = Column(Text, nullable=False)
    description = Column(Text)
    category = Column(Text)
    goal_amount = Column(Numeric(12, 2), nullable=False)
    current_amount = Column(Numeric(12, 2), default=0)
    region = Column(Text)
    deadline = Column(DateTime, nullable=False)
    status = Column(String, CheckConstraint(
        "status IN ('draft', 'active', 'successful', 'failed')"), default='draft')
    created_at = Column(DateTime, default=datetime.utcnow)

    entrepreneur = relationship('User', back_populates='campaigns')
    investments = relationship('Investment', back_populates='campaign',
                               cascade="all, delete-orphan")
    payouts = relationship('Payout', back_populates='campaign',
                           cascade="all, delete-orphan")


class Investment(Base):
    __tablename__ = 'investments'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    investor_id = Column(UUID(as_uuid=True), ForeignKey(
        'users.id', ondelete='CASCADE'))
    campaign_id = Column(UUID(as_uuid=True), ForeignKey(
        'campaigns.id', ondelete='CASCADE'))
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String, CheckConstraint(
        "status IN ('pending', 'completed', 'refunded')"), default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)

    investor = relationship('User', back_populates='investments')
    campaign = relationship('Campaign', back_populates='investments')
    transactions = relationship('Transaction', back_populates='investment',
                                cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    investment_id = Column(UUID(as_uuid=True), ForeignKey(
        'investments.id', ondelete='CASCADE'))
    stripe_transaction_id = Column(Text)
    amount = Column(Numeric(12, 2), nullable=False)
    fee = Column(Numeric(12, 2), default=0)
    type = Column(String, CheckConstraint(
        "type IN ('deposit', 'refund', 'payout')"))
    status = Column(String, CheckConstraint(
        "status IN ('pending', 'successful', 'failed')"), default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)

    investment = relationship('Investment', back_populates='transactions')


class Payout(Base):
    __tablename__ = 'payouts'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entrepreneur_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    campaign_id = Column(UUID(as_uuid=True), ForeignKey('campaigns.id'))
    total_raised = Column(Numeric(12, 2))
    payout_amount = Column(Numeric(12, 2))
    payout_date = Column(DateTime)
    status = Column(String, CheckConstraint(
        "status IN ('pending', 'paid', 'failed')"), default='pending')

    entrepreneur = relationship('User', back_populates='payouts')
    campaign = relationship('Campaign', back_populates='payouts')


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
