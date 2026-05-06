from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

from backend.app.models.property import PropertyType, DPEClass, PropertyStatus, RoomType, ItemCondition


# ── Photos ────────────────────────────────────────────────────────────────────

class PropertyPhotoResponse(BaseModel):
    id: int
    property_id: int
    filename: str
    url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    order: int
    is_cover: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Rooms / Inventaire ────────────────────────────────────────────────────────

class RoomItem(BaseModel):
    """Un équipement dans une pièce"""
    name: str                                        # ex: "Lit double"
    condition: ItemCondition = ItemCondition.bon
    quantity: int = 1
    observations: Optional[str] = None


class PropertyRoomCreate(BaseModel):
    room_type: RoomType
    name: Optional[str] = None
    surface: Optional[float] = None
    items: List[RoomItem] = []
    observations: Optional[str] = None


class PropertyRoomUpdate(BaseModel):
    room_type: Optional[RoomType] = None
    name: Optional[str] = None
    surface: Optional[float] = None
    items: Optional[List[RoomItem]] = None
    observations: Optional[str] = None


class PropertyRoomResponse(BaseModel):
    id: int
    property_id: int
    room_type: RoomType
    name: Optional[str] = None
    surface: Optional[float] = None
    items: List[Any] = []
    observations: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Property ──────────────────────────────────────────────────────────────────

class PropertyCreate(BaseModel):
    # Localisation
    address: str
    address2: Optional[str] = None
    city: str
    zip_code: str

    # Caractéristiques
    property_type: PropertyType
    surface: float = Field(gt=0)
    num_rooms: Optional[int] = None
    num_bedrooms: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    has_elevator: bool = False
    has_parking: bool = False
    has_cellar: bool = False
    has_balcony: bool = False
    has_garden: bool = False
    is_furnished: bool = False

    # DPE
    dpe_class: Optional[DPEClass] = None
    dpe_value: Optional[float] = None
    ges_class: Optional[DPEClass] = None
    ges_value: Optional[float] = None

    # Financier
    rent_price: float = Field(gt=0)
    charges: float = 0.0
    deposit_amount: Optional[float] = None

    # Description
    description: Optional[str] = None
    internal_notes: Optional[str] = None

    # Statut initial
    status: PropertyStatus = PropertyStatus.disponible

    # Inventaire initial (optionnel)
    rooms: List[PropertyRoomCreate] = []


class PropertyUpdate(BaseModel):
    address: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    property_type: Optional[PropertyType] = None
    surface: Optional[float] = None
    num_rooms: Optional[int] = None
    num_bedrooms: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    has_elevator: Optional[bool] = None
    has_parking: Optional[bool] = None
    has_cellar: Optional[bool] = None
    has_balcony: Optional[bool] = None
    has_garden: Optional[bool] = None
    is_furnished: Optional[bool] = None
    dpe_class: Optional[DPEClass] = None
    dpe_value: Optional[float] = None
    ges_class: Optional[DPEClass] = None
    ges_value: Optional[float] = None
    rent_price: Optional[float] = None
    charges: Optional[float] = None
    deposit_amount: Optional[float] = None
    description: Optional[str] = None
    internal_notes: Optional[str] = None
    status: Optional[PropertyStatus] = None


class PropertySummary(BaseModel):
    """Version légère pour les listes/dashboard"""
    id: int
    address: str
    city: str
    zip_code: str
    property_type: PropertyType
    surface: float
    num_rooms: Optional[int] = None
    rent_price: float
    charges: float
    status: PropertyStatus
    is_furnished: bool
    cover_photo_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PropertyResponse(PropertySummary):
    """Version complète"""
    address2: Optional[str] = None
    num_bedrooms: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    has_elevator: bool
    has_parking: bool
    has_cellar: bool
    has_balcony: bool
    has_garden: bool
    dpe_class: Optional[DPEClass] = None
    dpe_value: Optional[float] = None
    ges_class: Optional[DPEClass] = None
    ges_value: Optional[float] = None
    deposit_amount: Optional[float] = None
    description: Optional[str] = None
    internal_notes: Optional[str] = None
    updated_at: datetime
    owner_id: int
    photos: List[PropertyPhotoResponse] = []
    rooms: List[PropertyRoomResponse] = []

    model_config = {"from_attributes": True}


# ── Filtres dashboard ─────────────────────────────────────────────────────────

class PropertyFilters(BaseModel):
    status: Optional[PropertyStatus] = None
    property_type: Optional[PropertyType] = None
    city: Optional[str] = None
    min_rent: Optional[float] = None
    max_rent: Optional[float] = None
    is_furnished: Optional[bool] = None
