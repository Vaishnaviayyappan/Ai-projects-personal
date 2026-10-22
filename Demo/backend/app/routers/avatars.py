from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.agent.tools import registry
from app.avatar_providers import FACES_DIR, get_avatar_provider, resolve_face_image_path
from app.avatar_providers.sadtalker import SadTalkerUnavailable
from app.avatar_providers.sadtalker import generate_clip as sadtalker_generate_clip
from app.avatar_providers.wav2lip import Wav2LipUnavailable
from app.avatar_providers.wav2lip import generate_clip as wav2lip_generate_clip
from app.database import get_db
from app.models import Avatar, AvatarConfiguration, ToolConfiguration, User
from app.schemas import AvatarCreate, AvatarOut, AvatarUpdate
from app.security import get_current_user
from pydantic import BaseModel
from starlette.responses import Response

router = APIRouter(prefix="/api/avatars", tags=["avatars"])


@router.get("", response_model=list[AvatarOut])
def list_avatars(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Avatar).filter(Avatar.organization_id == user.organization_id).all()


DEMO_ORG_SLUGS = ["aero-retail-co", "prime-realty-group"]


@router.get("/demo", response_model=list[AvatarOut])
def list_demo_avatars(db: Session = Depends(get_db)):
    """Public, unauthenticated listing of the seeded demo avatars for the landing page's
    industry picker. Scoped to a fixed allowlist of demo tenants, not all organizations."""
    from app.models import Organization
    orgs = db.query(Organization).filter(Organization.slug.in_(DEMO_ORG_SLUGS)).all()
    org_ids = [o.id for o in orgs]
    if not org_ids:
        return []
    return db.query(Avatar).filter(Avatar.organization_id.in_(org_ids), Avatar.is_active == True).all()  # noqa: E712


@router.get("/public/{avatar_id}", response_model=AvatarOut)
def get_public_avatar(avatar_id: str, db: Session = Depends(get_db)):
    """Unauthenticated lookup so an embedded widget/demo page can load an avatar's persona."""
    avatar = db.query(Avatar).filter(Avatar.id == avatar_id, Avatar.is_active == True).first()  # noqa: E712
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
    return avatar


@router.post("", response_model=AvatarOut)
def create_avatar(payload: AvatarCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    avatar = Avatar(organization_id=user.organization_id, **payload.model_dump())
    db.add(avatar)
    db.flush()

    for spec in registry.all():
        db.add(ToolConfiguration(
            organization_id=user.organization_id, avatar_id=avatar.id,
            tool_name=spec.name, is_enabled=True, permissions_json={},
        ))
    db.add(AvatarConfiguration(avatar_id=avatar.id, version=1, config_json=payload.model_dump(), updated_by_user_id=user.id))
    db.commit()
    db.refresh(avatar)
    return avatar


@router.get("/{avatar_id}", response_model=AvatarOut)
def get_avatar(avatar_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    avatar = _get_org_avatar(db, avatar_id, user.organization_id)
    return avatar


@router.put("/{avatar_id}", response_model=AvatarOut)
def update_avatar(avatar_id: str, payload: AvatarUpdate, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    avatar = _get_org_avatar(db, avatar_id, user.organization_id)
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(avatar, key, value)
    db.flush()

    last_version = (
        db.query(AvatarConfiguration).filter(AvatarConfiguration.avatar_id == avatar.id)
        .order_by(AvatarConfiguration.version.desc()).first()
    )
    next_version = (last_version.version + 1) if last_version else 1
    db.add(AvatarConfiguration(avatar_id=avatar.id, version=next_version, config_json=updates, updated_by_user_id=user.id))
    db.commit()
    db.refresh(avatar)
    return avatar


@router.delete("/{avatar_id}")
def delete_avatar(avatar_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    avatar = _get_org_avatar(db, avatar_id, user.organization_id)
    db.delete(avatar)
    db.commit()
    return {"status": "deleted"}


@router.post("/{avatar_id}/session")
def create_avatar_session(avatar_id: str, db: Session = Depends(get_db)):
    """Returns connection details for the avatar renderer: open-source SadTalker/Wav2Lip
    (per-turn clips), or the static CSS-animated fallback."""
    avatar = db.query(Avatar).filter(Avatar.id == avatar_id).first()
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
    provider = get_avatar_provider(avatar)
    session = provider.create_session({
        "appearance_image_url": avatar.appearance_image_url,
        "face_image_path": resolve_face_image_path(avatar),
    })
    return {
        "provider": session.provider,
        "ready": session.ready,
        "config": session.session_config,
        "error": session.error,
    }


@router.post("/{avatar_id}/face-image", response_model=AvatarOut)
async def upload_face_image(avatar_id: str, file: UploadFile = File(...), db: Session = Depends(get_db),
                             user: User = Depends(get_current_user)):
    """Uploads the source face photo used by the open-source Wav2Lip avatar provider."""
    avatar = _get_org_avatar(db, avatar_id, user.organization_id)
    suffix = ("." + file.filename.rsplit(".", 1)[-1].lower()) if "." in file.filename else ".jpg"
    if suffix not in (".jpg", ".jpeg", ".png"):
        raise HTTPException(status_code=400, detail="Face image must be .jpg, .jpeg, or .png")

    FACES_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{avatar.id}{suffix}"
    (FACES_DIR / filename).write_bytes(await file.read())

    avatar.face_image_path = filename
    db.commit()
    db.refresh(avatar)
    return avatar


class SpeakClipRequest(BaseModel):
    text: str


@router.post("/{avatar_id}/speak-clip")
def speak_clip(avatar_id: str, payload: SpeakClipRequest, db: Session = Depends(get_db)):
    """Generates a talking-head MP4 clip of this avatar speaking the given text, using
    whichever local, offline clip-based provider (SadTalker or Wav2Lip) is currently active
    for this avatar. CPU-only -- can take real time per call, especially for SadTalker."""
    avatar = db.query(Avatar).filter(Avatar.id == avatar_id).first()
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
    face_path = resolve_face_image_path(avatar)
    if not face_path:
        raise HTTPException(status_code=400, detail="No face image configured for this avatar")

    provider = get_avatar_provider(avatar)
    try:
        if provider.name == "sadtalker":
            clip_bytes = sadtalker_generate_clip(face_path, payload.text, avatar.voice_id)
        elif provider.name == "wav2lip":
            clip_bytes = wav2lip_generate_clip(face_path, payload.text, avatar.voice_id)
        else:
            raise HTTPException(status_code=400, detail=f"Active provider '{provider.name}' does not generate clips")
    except (SadTalkerUnavailable, Wav2LipUnavailable) as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return Response(content=clip_bytes, media_type="video/mp4")


def _get_org_avatar(db: Session, avatar_id: str, org_id: str) -> Avatar:
    avatar = db.query(Avatar).filter(Avatar.id == avatar_id, Avatar.organization_id == org_id).first()
    if not avatar:
        raise HTTPException(status_code=404, detail="Avatar not found")
    return avatar
