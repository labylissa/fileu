import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime,
    ForeignKey, Text, JSON
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import relationship

from backend.app.db.base import Base


class PropertyType(str, enum.Enum):
    appartement = "appartement"
    maison = "maison"
    studio = "studio"
    loft = "loft"
    chambre = "chambre"
    autre = "autre"


class DPEClass(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    F = "F"
    G = "G"


class PropertyStatus(str, enum.Enum):
    disponible = "disponible"
    loue = "loué"
    en_travaux = "en_travaux"
    archive = "archivé"


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Localisation
    address = Column(String, nullable=False)
    address2 = Column(String)           # complément adresse
    city = Column(String, nullable=False)
    zip_code = Column(String, nullable=False)

    # Caractéristiques
    property_type = Column(SAEnum(PropertyType), nullable=False)
    surface = Column(Float, nullable=False)          # m²
    num_rooms = Column(Integer)
    num_bedrooms = Column(Integer)
    floor = Column(Integer)                          # étage (0 = RDC)
    total_floors = Column(Integer)
    has_elevator = Column(Boolean, default=False)
    has_parking = Column(Boolean, default=False)
    has_cellar = Column(Boolean, default=False)
    has_balcony = Column(Boolean, default=False)
    has_garden = Column(Boolean, default=False)
    is_furnished = Column(Boolean, default=False)

    # DPE
    dpe_class = Column(SAEnum(DPEClass))
    dpe_value = Column(Float)                        # kWh/m²/an
    ges_class = Column(SAEnum(DPEClass))             # émissions GES
    ges_value = Column(Float)                        # kgCO2/m²/an

    # Financier
    rent_price = Column(Float, nullable=False)
    charges = Column(Float, default=0.0)
    deposit_amount = Column(Float)                   # dépôt de garantie

    # Description
    description = Column(Text)
    internal_notes = Column(Text)                    # notes privées du bailleur

    # Statut
    status = Column(SAEnum(PropertyStatus), default=PropertyStatus.disponible, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # Relations
    owner = relationship("User", back_populates="properties", foreign_keys=[owner_id])
    photos = relationship("PropertyPhoto", back_populates="property", cascade="all, delete-orphan",
                          order_by="PropertyPhoto.order")
    rooms = relationship("PropertyRoom", back_populates="property", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="property")


class PropertyPhoto(Base):
    __tablename__ = "property_photos"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)

    filename = Column(String, nullable=False)
    original_filename = Column(String)
    url = Column(String, nullable=False)             # URL complète ou chemin local
    thumbnail_url = Column(String)                   # miniature 400x300
    caption = Column(String)
    order = Column(Integer, default=0)
    is_cover = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    property = relationship("Property", back_populates="photos")


class RoomType(str, enum.Enum):
    salon = "salon"
    chambre = "chambre"
    cuisine = "cuisine"
    salle_de_bain = "salle_de_bain"
    wc = "wc"
    couloir = "couloir"
    bureau = "bureau"
    cave = "cave"
    parking = "parking"
    autre = "autre"


class ItemCondition(str, enum.Enum):
    neuf = "neuf"
    bon = "bon"
    use = "usé"
    a_remplacer = "à remplacer"


class PropertyRoom(Base):
    """Inventaire détaillé par pièce"""
    __tablename__ = "property_rooms"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)

    room_type = Column(SAEnum(RoomType), nullable=False)
    name = Column(String)                            # ex: "Chambre principale"
    surface = Column(Float)
    items = Column(JSON, default=list)               # liste d'équipements avec état
    observations = Column(Text)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    property = relationship("Property", back_populates="rooms")
