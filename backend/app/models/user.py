import enum
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Boolean, DateTime
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
    role = Column(SAEnum(Role, name="role", create_type=False), default=Role.locataire, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relations (defined in property.py)
    properties = relationship("Property", back_populates="owner", foreign_keys="Property.owner_id")

