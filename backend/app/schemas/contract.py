"""Sprint 3 — Schemas contrats de bail"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import date, datetime

from backend.app.models.contract import ContractType, ContractStatus


# ── Co-locataire ──────────────────────────────────────────────────────────────

class CoTenant(BaseModel):
    firstname:  str
    lastname:   str
    email:      Optional[str] = None
    phone:      Optional[str] = None


# ── Create ────────────────────────────────────────────────────────────────────

class ContractCreate(BaseModel):
    property_id:    int

    # Locataire principal
    tenant_firstname:   str
    tenant_lastname:    str
    tenant_email:       str
    tenant_phone:       Optional[str] = None
    tenant_birth_date:  Optional[date] = None
    tenant_birth_place: Optional[str] = None
    tenant_profession:  Optional[str] = None
    cotenants:          List[CoTenant] = []

    # Bail
    contract_type:  ContractType = ContractType.meuble
    start_date:     date
    end_date:       Optional[date] = None
    notice_period:  int = Field(default=1, ge=0, le=24)

    # Financier
    rent_amount:    float = Field(gt=0)
    charges_amount: float = Field(default=0.0, ge=0)
    deposit_amount: float = Field(default=0.0, ge=0)
    payment_day:    int = Field(default=1, ge=1, le=28)
    payment_method: str = "virement"

    # Révision
    rent_revision_enabled:  bool = True
    rent_revision_index:    str = "IRL"
    rent_revision_month:    int = Field(default=1, ge=1, le=12)

    # Divers
    special_clauses:    Optional[str] = None
    internal_notes:     Optional[str] = None
    status:             ContractStatus = ContractStatus.actif


# ── Update ────────────────────────────────────────────────────────────────────

class ContractUpdate(BaseModel):
    tenant_firstname:   Optional[str] = None
    tenant_lastname:    Optional[str] = None
    tenant_email:       Optional[str] = None
    tenant_phone:       Optional[str] = None
    tenant_birth_date:  Optional[date] = None
    tenant_birth_place: Optional[str] = None
    tenant_profession:  Optional[str] = None
    cotenants:          Optional[List[CoTenant]] = None

    contract_type:  Optional[ContractType] = None
    start_date:     Optional[date] = None
    end_date:       Optional[date] = None
    notice_period:  Optional[int] = None

    rent_amount:    Optional[float] = None
    charges_amount: Optional[float] = None
    deposit_amount: Optional[float] = None
    payment_day:    Optional[int] = None
    payment_method: Optional[str] = None

    rent_revision_enabled:  Optional[bool] = None
    rent_revision_index:    Optional[str] = None
    rent_revision_month:    Optional[int] = None

    special_clauses:    Optional[str] = None
    internal_notes:     Optional[str] = None
    status:             Optional[ContractStatus] = None


# ── Response ──────────────────────────────────────────────────────────────────

class PropertySnippet(BaseModel):
    """Infos minimales du bien pour enrichir la réponse contrat"""
    id:             int
    address:        str
    city:           str
    zip_code:       str
    property_type:  str
    surface:        float

    model_config = {"from_attributes": True}


class ContractResponse(BaseModel):
    id:             int
    property_id:    int
    owner_id:       int

    tenant_firstname:   str
    tenant_lastname:    str
    tenant_email:       str
    tenant_phone:       Optional[str] = None
    tenant_birth_date:  Optional[date] = None
    tenant_birth_place: Optional[str] = None
    tenant_profession:  Optional[str] = None
    cotenants:          List[Any] = []

    contract_type:  ContractType
    start_date:     date
    end_date:       Optional[date] = None
    notice_period:  int

    rent_amount:    float
    charges_amount: float
    deposit_amount: float
    payment_day:    int
    payment_method: str

    rent_revision_enabled:  bool
    rent_revision_index:    str
    rent_revision_month:    int

    special_clauses:    Optional[str] = None
    internal_notes:     Optional[str] = None
    status:             ContractStatus

    created_at:     datetime
    updated_at:     datetime

    # Propriété enrichie (jointure)
    property:       Optional[PropertySnippet] = None

    model_config = {"from_attributes": True}


class ContractSummary(BaseModel):
    """Version légère pour les listes"""
    id:             int
    property_id:    int
    tenant_firstname:   str
    tenant_lastname:    str
    tenant_email:       str
    contract_type:  ContractType
    start_date:     date
    end_date:       Optional[date] = None
    rent_amount:    float
    charges_amount: float
    deposit_amount: float
    status:         ContractStatus
    created_at:     datetime

    property:       Optional[PropertySnippet] = None

    model_config = {"from_attributes": True}
