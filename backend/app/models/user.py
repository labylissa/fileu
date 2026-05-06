import enum
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Date, ForeignKey
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import relationship

from backend.app.db.base import Base


class Role(str, enum.Enum):
    bailleur = "bailleur"
    locataire = "locataire"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(Role), default=Role.locataire, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relations
    properties = relationship("Property", back_populates="owner", foreign_keys="Property.owner_id")
    contracts_as_tenant = relationship("Contract", back_populates="tenant", foreign_keys="Contract.tenant_id")


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    address = Column(String, nullable=False)
    city = Column(String)
    zip_code = Column(String)
    property_type = Column(String)  # appartement, maison, studio...
    surface = Column(Float)
    num_rooms = Column(Integer)
    description = Column(String)
    rent_price = Column(Float, nullable=False)
    charges = Column(Float, default=0.0)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relations
    owner = relationship("User", back_populates="properties", foreign_keys=[owner_id])
    contracts = relationship("Contract", back_populates="property")


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    rent_amount = Column(Float, nullable=False)
    deposit_amount = Column(Float)
    status = Column(String, default="active")  # active, expired, terminated
    contract_type = Column(String, default="meublé")  # nu, meublé, mobilité
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relations
    property = relationship("Property", back_populates="contracts")
    tenant = relationship("User", back_populates="contracts_as_tenant", foreign_keys=[tenant_id])
