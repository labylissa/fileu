"""
Service de stockage des photos.
En dev : stockage local dans UPLOAD_DIR.
En prod : S3 / MinIO si USE_LOCAL_STORAGE=False.
"""
import os
import uuid
import io
from pathlib import Path
from typing import Tuple, Optional

from PIL import Image
from fastapi import UploadFile, HTTPException, status

from backend.app.core.config import settings

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024   # 10 MB
THUMBNAIL_SIZE = (400, 300)


def _ensure_upload_dir():
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    photos_dir = Path(settings.UPLOAD_DIR) / "photos"
    photos_dir.mkdir(exist_ok=True)
    thumbs_dir = Path(settings.UPLOAD_DIR) / "thumbnails"
    thumbs_dir.mkdir(exist_ok=True)


def _make_thumbnail(image_bytes: bytes) -> bytes:
    img = Image.open(io.BytesIO(image_bytes))
    img = img.convert("RGB")
    img.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85, optimize=True)
    return buf.getvalue()


def _save_local(filename: str, data: bytes, subdir: str) -> str:
    _ensure_upload_dir()
    path = Path(settings.UPLOAD_DIR) / subdir / filename
    path.write_bytes(data)
    return f"/static/{subdir}/{filename}"


async def _save_s3(filename: str, data: bytes, content_type: str, subdir: str) -> str:
    import boto3
    s3 = boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        region_name=settings.S3_REGION,
    )
    key = f"{subdir}/{filename}"
    s3.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=key,
        Body=data,
        ContentType=content_type,
    )
    base = settings.S3_ENDPOINT_URL or f"https://s3.{settings.S3_REGION}.amazonaws.com"
    return f"{base}/{settings.S3_BUCKET_NAME}/{key}"


async def upload_property_photo(
    file: UploadFile,
    property_id: int,
) -> Tuple[str, str, str]:
    """
    Valide, redimensionne et sauvegarde une photo.
    Retourne (filename, url, thumbnail_url).
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format non supporté. Formats acceptés : {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Fichier trop volumineux (max 10 MB)",
        )

    # Vérifie que c'est bien une image valide
    try:
        Image.open(io.BytesIO(image_bytes)).verify()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fichier image invalide")

    # Génère les noms de fichiers
    ext = "jpg"
    unique_name = f"property_{property_id}_{uuid.uuid4().hex}.{ext}"
    thumb_name = f"thumb_{unique_name}"

    # Génère miniature
    thumb_bytes = _make_thumbnail(image_bytes)

    if settings.USE_LOCAL_STORAGE:
        url = _save_local(unique_name, image_bytes, "photos")
        thumb_url = _save_local(thumb_name, thumb_bytes, "thumbnails")
    else:
        content_type = "image/jpeg"
        url = await _save_s3(unique_name, image_bytes, content_type, "photos")
        thumb_url = await _save_s3(thumb_name, thumb_bytes, content_type, "thumbnails")

    return unique_name, url, thumb_url


async def delete_photo_files(filename: str):
    """Supprime la photo et sa miniature du stockage."""
    if settings.USE_LOCAL_STORAGE:
        for subdir, prefix in [("photos", ""), ("thumbnails", "thumb_")]:
            path = Path(settings.UPLOAD_DIR) / subdir / f"{prefix}{filename}"
            try:
                path.unlink(missing_ok=True)
            except Exception:
                pass
    else:
        import boto3
        s3 = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
        )
        for key in [f"photos/{filename}", f"thumbnails/thumb_{filename}"]:
            try:
                s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
            except Exception:
                pass
