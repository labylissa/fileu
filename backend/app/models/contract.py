"""Sprint 3 — Contrats de bail"""
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime, Date,
    ForeignKey, Text, JSON
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import relationship

from backend.app.db.base import Base


class ContractType(str, enum.Enum):
    meuble       = "meublé"
    non_meuble   = "non meublé"
    mobilite     = "mobilité"
    etudiant     = "étudiant"
    colocation   = "colocation"


class ContractStatus(str, enum.Enum):
    brouillon   = "brouillon"
    actif       = "actif"
    expire      = "expiré"
    resilie     = "résilié"


class Contract(Base):
    __tablename__ = "contracts"

    id              = Column(Integer, primary_key=True, index=True)
    property_id     = Column(Integer, ForeignKey("properties.id"), nullable=False)
    owner_id        = Column(Integer, ForeignKey("users.id"), nullable=False)

    # ── Locataire ─────────────────────────────────────────────────────────────
    tenant_firstname    = Column(String, nullable=False)
    tenant_lastname     = Column(String, nullable=False)
    tenant_email        = Column(String, nullable=False)
    tenant_phone        = Column(String)
    tenant_birth_date   = Column(Date)
    tenant_birth_place  = Column(String)
    tenant_profession   = Column(String)
    # Co-locataires (JSON list de dicts)
    cotenants           = Column(JSON, default=list)

    # ── Durée & type ──────────────────────────────────────────────────────────
    contract_type   = Column(SAEnum(ContractType, name="contracttype", create_type=False), nullable=False,
                             default=ContractType.meuble)
    start_date      = Column(Date, nullable=False)
    end_date        = Column(Date)                # None = bail illimité / CDI
    notice_period   = Column(Integer, default=1)  # mois

    # ── Financier ─────────────────────────────────────────────────────────────
    rent_amount     = Column(Float, nullable=False)
    charges_amount  = Column(Float, default=0.0)
    deposit_amount  = Column(Float, default=0.0)
    payment_day     = Column(Integer, default=1)   # jour du mois
    payment_method  = Column(String, default="virement")

    # ── Révision loyer ────────────────────────────────────────────────────────
    rent_revision_enabled   = Column(Boolean, default=True)
    rent_revision_index     = Column(String, default="IRL")  # IRL, ILC, ILAT
    rent_revision_month     = Column(Integer, default=1)     # mois de révision

    # ── Clauses & notes ───────────────────────────────────────────────────────
    special_clauses = Column(Text)
    internal_notes  = Column(Text)

    # ── Statut ────────────────────────────────────────────────────────────────
    status          = Column(SAEnum(ContractStatus, name="contractstatus", create_type=False), default=ContractStatus.actif,
                             nullable=False)

    # ── Dates système ─────────────────────────────────────────────────────────
    created_at      = Column(DateTime(timezone=True),
                             default=lambda: datetime.now(timezone.utc))
    updated_at      = Column(DateTime(timezone=True),
                             default=lambda: datetime.now(timezone.utc),
                             onupdate=lambda: datetime.now(timezone.utc))

    # ── Relations ─────────────────────────────────────────────────────────────
    property    = relationship("Property", back_populates="contracts")
    owner       = relationship("User", foreign_keys=[owner_id])
