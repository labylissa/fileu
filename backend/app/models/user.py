from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Boolean, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Role(str, Enum):
    bailleur = "bailleur"
    locataire = "locataire"
    admin = "admin"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(Role), default=Role.locataire)
    is_active = Column(Boolean, default=True)

class Property(Base):
    __tablename__ = "properties"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    address = Column(String)
    description = Column(String)
    rent_price = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"))
    tenant_id = Column(Integer, ForeignKey("users.id"))
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String)
