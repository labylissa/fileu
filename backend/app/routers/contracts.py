"""Sprint 3 — Endpoints contrats de bail"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from backend.app.db.session import get_db
from backend.app.deps import get_current_user, get_current_bailleur
from backend.app.models.user import User
from backend.app.models.contract import Contract, ContractStatus
from backend.app.models.property import Property, PropertyStatus
from backend.app.schemas.contract import (
    ContractCreate, ContractUpdate,
    ContractResponse, ContractSummary,
)

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

async def get_contract_or_404(
    contract_id: int,
    db: AsyncSession,
    owner: Optional[User] = None,
    load_property: bool = True,
) -> Contract:
    q = select(Contract).where(Contract.id == contract_id)
    if load_property:
        q = q.options(selectinload(Contract.property))
    result = await db.execute(q)
    contract = result.scalar_one_or_none()

    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contrat introuvable",
        )
    if owner and contract.owner_id != owner.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé",
        )
    return contract


async def _verify_property_ownership(
    property_id: int, owner: User, db: AsyncSession
) -> Property:
    result = await db.execute(
        select(Property).where(
            Property.id == property_id,
            Property.owner_id == owner.id,
        )
    )
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bien introuvable ou accès refusé",
        )
    return prop


# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[ContractSummary])
async def list_contracts(
    status_filter: Optional[ContractStatus] = Query(None, alias="status"),
    property_id:   Optional[int]            = Query(None),
    db:            AsyncSession             = Depends(get_db),
    current_user:  User                     = Depends(get_current_bailleur),
):
    """Liste tous les contrats du bailleur, avec filtres optionnels."""
    conditions = [Contract.owner_id == current_user.id]

    if status_filter:
        conditions.append(Contract.status == status_filter)
    if property_id:
        conditions.append(Contract.property_id == property_id)

    q = (
        select(Contract)
        .where(and_(*conditions))
        .options(selectinload(Contract.property))
        .order_by(Contract.created_at.desc())
    )
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def create_contract(
    body:         ContractCreate,
    db:           AsyncSession = Depends(get_db),
    current_user: User         = Depends(get_current_bailleur),
):
    """Crée un contrat de bail pour un bien appartenant au bailleur connecté."""
    prop = await _verify_property_ownership(body.property_id, current_user, db)

    # Vérifier qu'il n'y a pas déjà un contrat actif sur ce bien
    existing = await db.execute(
        select(Contract).where(
            Contract.property_id == body.property_id,
            Contract.status == ContractStatus.actif,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ce bien possède déjà un contrat actif",
        )

    data = body.model_dump()
    data["cotenants"] = [ct.model_dump() for ct in body.cotenants]

    contract = Contract(**data, owner_id=current_user.id)
    db.add(contract)

    # Mettre le bien en statut "loué" si contrat actif
    if contract.status == ContractStatus.actif:
        prop.status = PropertyStatus.loue

    # Créer automatiquement un compte locataire s'il n'existe pas déjà
    from backend.app.core.security import get_password_hash
    from backend.app.models.user import Role
    existing_tenant = await db.execute(
        select(User).where(User.email == body.tenant_email)
    )
    if not existing_tenant.scalar_one_or_none():
        import secrets, string
        tmp_pwd = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        tenant_user = User(
            email=body.tenant_email,
            hashed_password=get_password_hash(tmp_pwd),
            role=Role.locataire,
        )
        db.add(tenant_user)

    await db.commit()

    # Recharger avec relation
    result = await db.execute(
        select(Contract)
        .where(Contract.id == contract.id)
        .options(selectinload(Contract.property))
    )
    return result.scalar_one()


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id:  int,
    db:           AsyncSession = Depends(get_db),
    current_user: User         = Depends(get_current_bailleur),
):
    return await get_contract_or_404(contract_id, db, owner=current_user)


@router.patch("/{contract_id}", response_model=ContractResponse)
async def update_contract(
    contract_id:  int,
    body:         ContractUpdate,
    db:           AsyncSession = Depends(get_db),
    current_user: User         = Depends(get_current_bailleur),
):
    contract = await get_contract_or_404(
        contract_id, db, owner=current_user, load_property=True
    )

    update_data = body.model_dump(exclude_none=True)

    # Sérialiser les cotenants si présents
    if "cotenants" in update_data and body.cotenants is not None:
        update_data["cotenants"] = [ct.model_dump() for ct in body.cotenants]

    old_status = contract.status

    for field, value in update_data.items():
        setattr(contract, field, value)

    # Synchroniser le statut du bien
    if "status" in update_data and contract.property:
        new_status = update_data["status"]
        if new_status == ContractStatus.actif:
            contract.property.status = PropertyStatus.loue
        elif new_status in (ContractStatus.resilie, ContractStatus.expire):
            contract.property.status = PropertyStatus.disponible

    await db.commit()

    result = await db.execute(
        select(Contract)
        .where(Contract.id == contract_id)
        .options(selectinload(Contract.property))
    )
    return result.scalar_one()


@router.post("/{contract_id}/resilier", response_model=ContractResponse)
async def resilier_contract(
    contract_id:  int,
    db:           AsyncSession = Depends(get_db),
    current_user: User         = Depends(get_current_bailleur),
):
    """Résilie un contrat actif et remet le bien en 'disponible'."""
    contract = await get_contract_or_404(
        contract_id, db, owner=current_user, load_property=True
    )

    if contract.status != ContractStatus.actif:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seul un contrat actif peut être résilié",
        )

    contract.status = ContractStatus.resilie
    if contract.property:
        contract.property.status = PropertyStatus.disponible

    await db.commit()

    result = await db.execute(
        select(Contract)
        .where(Contract.id == contract_id)
        .options(selectinload(Contract.property))
    )
    return result.scalar_one()


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contract(
    contract_id:  int,
    db:           AsyncSession = Depends(get_db),
    current_user: User         = Depends(get_current_bailleur),
):
    """Supprime un contrat (brouillon ou résilié seulement)."""
    contract = await get_contract_or_404(
        contract_id, db, owner=current_user, load_property=True
    )

    if contract.status == ContractStatus.actif:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Résiliez le contrat avant de le supprimer",
        )

    await db.delete(contract)
    await db.commit()


# ── Endpoint locataire : voir ses propres contrats ────────────────────────────

@router.get("/me/tenant", response_model=List[ContractSummary])
async def list_my_contracts_as_tenant(
    db:           AsyncSession = Depends(get_db),
    current_user: User         = Depends(get_current_user),
):
    """Un locataire récupère les contrats associés à son email."""
    q = (
        select(Contract)
        .where(Contract.tenant_email == current_user.email)
        .options(selectinload(Contract.property))
        .order_by(Contract.created_at.desc())
    )
    result = await db.execute(q)
    return result.scalars().all()
