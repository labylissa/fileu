from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from backend.app.db.session import get_db
from backend.app.deps import get_current_user, get_current_bailleur
from backend.app.models.user import User
from backend.app.models.property import (
    Property, PropertyPhoto, PropertyRoom,
    PropertyStatus, PropertyType,
)
from backend.app.schemas.property import (
    PropertyCreate, PropertyUpdate, PropertyResponse,
    PropertySummary, PropertyRoomCreate, PropertyRoomUpdate,
    PropertyRoomResponse, PropertyPhotoResponse,
)
from backend.app.services.storage import upload_property_photo, delete_photo_files

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

async def get_property_or_404(
    property_id: int,
    db: AsyncSession,
    owner: Optional[User] = None,
    load_relations: bool = True,
) -> Property:
    q = select(Property).where(Property.id == property_id)
    if load_relations:
        q = q.options(
            selectinload(Property.photos),
            selectinload(Property.rooms),
        )
    result = await db.execute(q)
    prop = result.scalar_one_or_none()

    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bien introuvable")
    if owner and prop.owner_id != owner.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return prop


def _cover_url(prop: Property) -> Optional[str]:
    if not prop.photos:
        return None
    covers = [p for p in prop.photos if p.is_cover]
    photo = covers[0] if covers else prop.photos[0]
    return photo.thumbnail_url or photo.url


# ── CRUD Biens ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[PropertySummary])
async def list_properties(
    status: Optional[PropertyStatus] = Query(None),
    property_type: Optional[PropertyType] = Query(None),
    city: Optional[str] = Query(None),
    min_rent: Optional[float] = Query(None),
    max_rent: Optional[float] = Query(None),
    is_furnished: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_bailleur),
):
    """Liste des biens du bailleur avec filtres."""
    conditions = [Property.owner_id == current_user.id]

    if status:
        conditions.append(Property.status == status)
    if property_type:
        conditions.append(Property.property_type == property_type)
    if city:
        conditions.append(Property.city.ilike(f"%{city}%"))
    if min_rent is not None:
        conditions.append(Property.rent_price >= min_rent)
    if max_rent is not None:
        conditions.append(Property.rent_price <= max_rent)
    if is_furnished is not None:
        conditions.append(Property.is_furnished == is_furnished)

    q = (
        select(Property)
        .where(and_(*conditions))
        .options(selectinload(Property.photos))
        .order_by(Property.created_at.desc())
    )
    result = await db.execute(q)
    props = result.scalars().all()

    # Ajoute cover_photo_url manuellement (champ calculé)
    summaries = []
    for p in props:
        data = PropertySummary.model_validate(p)
        data.cover_photo_url = _cover_url(p)
        summaries.append(data)

    return summaries


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    body: PropertyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_bailleur),
):
    """Crée un bien + inventaire initial optionnel."""
    rooms_data = body.rooms
    prop_data = body.model_dump(exclude={"rooms"})

    prop = Property(**prop_data, owner_id=current_user.id)
    db.add(prop)
    await db.flush()  # pour avoir prop.id avant d'ajouter les rooms

    for room_in in rooms_data:
        room = PropertyRoom(
            property_id=prop.id,
            **room_in.model_dump(exclude={"items"}),
            items=[item.model_dump() for item in room_in.items],
        )
        db.add(room)

    await db.commit()

    # Recharge avec relations
    result = await db.execute(
        select(Property)
        .where(Property.id == prop.id)
        .options(selectinload(Property.photos), selectinload(Property.rooms))
    )
    prop = result.scalar_one()
    resp = PropertyResponse.model_validate(prop)
    resp.cover_photo_url = _cover_url(prop)
    return resp


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_bailleur),
):
    prop = await get_property_or_404(property_id, db, owner=current_user)
    resp = PropertyResponse.model_validate(prop)
    resp.cover_photo_url = _cover_url(prop)
    return resp


@router.patch("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: int,
    body: PropertyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_bailleur),
):
    prop = await get_property_or_404(property_id, db, owner=current_user)

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(prop, field, value)

    await db.commit()
    await db.refresh(prop)

    result = await db.execute(
        select(Property)
        .where(Property.id == prop.id)
        .options(selectinload(Property.photos), selectinload(Property.rooms))
    )
    prop = result.scalar_one()
    resp = PropertyResponse.model_validate(prop)
    resp.cover_photo_url = _cover_url(prop)
    return resp


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_bailleur),
):
    prop = await get_property_or_404(property_id, db, owner=current_user, load_relations=True)

    # Supprime les fichiers photos
    for photo in prop.photos:
        await delete_photo_files(photo.filename)

    await db.delete(prop)
    await db.commit()


# ── Photos ────────────────────────────────────────────────────────────────────

@router.post("/{property_id}/photos", response_model=PropertyPhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    property_id: int,
    file: UploadFile = File(...),
    caption: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_bailleur),
):
    """Upload une photo pour un bien (max 10 MB, JPEG/PNG/WebP)."""
    prop = await get_property_or_404(property_id, db, owner=current_user, load_relations=True)

    filename, url, thumb_url = await upload_property_photo(file, property_id)

    # La première photo devient cover automatiquement
    is_cover = len(prop.photos) == 0
    order = len(prop.photos)

    photo = PropertyPhoto(
        property_id=property_id,
        filename=filename,
        original_filename=file.filename,
        url=url,
        thumbnail_url=thumb_url,
        caption=caption,
        order=order,
        is_cover=is_cover,
    )
    db.add(photo)
    await db.commit()
    await db.refresh(photo)
    return photo


@router.patch("/{property_id}/photos/{photo_id}/cover", response_model=PropertyPhotoResponse)
async def set_cover_photo(
    property_id: int,
    photo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_bailleur),
):
    """Définit une photo comme photo de couverture."""
    await get_property_or_404(property_id, db, owner=current_user, load_relations=False)

    # Retire is_cover de toutes les photos du bien
    result = await db.execute(select(PropertyPhoto).where(PropertyPhoto.property_id == property_id))
    photos = result.scalars().all()
    for p in photos:
        p.is_cover = p.id == photo_id

    await db.commit()

    result = await db.execute(select(PropertyPhoto).where(PropertyPhoto.id == photo_id))
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo introuvable")
    return photo


@router.delete("/{property_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    property_id: int,
    photo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_bailleur),
):
    await get_property_or_404(property_id, db, owner=current_user, load_relations=False)

    result = await db.execute(
        select(PropertyPhoto).where(
            PropertyPhoto.id == photo_id,
            PropertyPhoto.property_id == property_id,
        )
    )
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo introuvable")

    await delete_photo_files(photo.filename)
    await db.delete(photo)
    await db.commit()


# ── Inventaire (Rooms) ────────────────────────────────────────────────────────

@router.get("/{property_id}/rooms", response_model=List[PropertyRoomResponse])
async def list_rooms(
    property_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_bailleur),
):
    await get_property_or_404(property_id, db, owner=current_user, load_relations=False)
    result = await db.execute(
        select(PropertyRoom).where(PropertyRoom.property_id == property_id)
    )
    return result.scalars().all()


@router.post("/{property_id}/rooms", response_model=PropertyRoomResponse, status_code=status.HTTP_201_CREATED)
async def add_room(
    property_id: int,
    body: PropertyRoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_bailleur),
):
    await get_property_or_404(property_id, db, owner=current_user, load_relations=False)

    room = PropertyRoom(
        property_id=property_id,
        **body.model_dump(exclude={"items"}),
        items=[item.model_dump() for item in body.items],
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return room


@router.patch("/{property_id}/rooms/{room_id}", response_model=PropertyRoomResponse)
async def update_room(
    property_id: int,
    room_id: int,
    body: PropertyRoomUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_bailleur),
):
    await get_property_or_404(property_id, db, owner=current_user, load_relations=False)

    result = await db.execute(
        select(PropertyRoom).where(
            PropertyRoom.id == room_id,
            PropertyRoom.property_id == property_id,
        )
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pièce introuvable")

    update_data = body.model_dump(exclude_none=True)
    if "items" in update_data:
        update_data["items"] = [i.model_dump() if hasattr(i, "model_dump") else i for i in body.items]

    for field, value in update_data.items():
        setattr(room, field, value)

    await db.commit()
    await db.refresh(room)
    return room


@router.delete("/{property_id}/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    property_id: int,
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_bailleur),
):
    await get_property_or_404(property_id, db, owner=current_user, load_relations=False)

    result = await db.execute(
        select(PropertyRoom).where(
            PropertyRoom.id == room_id,
            PropertyRoom.property_id == property_id,
        )
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pièce introuvable")

    await db.delete(room)
    await db.commit()
