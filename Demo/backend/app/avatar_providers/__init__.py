from pathlib import Path

from app.avatar_providers.base import AvatarProvider
from app.avatar_providers.sadtalker import SadTalkerAvatarProvider, is_available as sadtalker_is_available
from app.avatar_providers.static import StaticAvatarProvider
from app.avatar_providers.wav2lip import Wav2LipAvatarProvider, is_available as wav2lip_is_available
from app.config import settings
from app.models import Avatar

FACES_DIR = Path(__file__).resolve().parent.parent.parent / "static" / "avatar_faces"


def resolve_face_image_path(avatar: Avatar) -> str | None:
    if not avatar.face_image_path:
        return None
    path = FACES_DIR / avatar.face_image_path
    return str(path) if path.exists() else None


def get_avatar_provider(avatar: Avatar) -> AvatarProvider:
    """Provider precedence, both fully open-source: SadTalker (if explicitly enabled via
    ENABLE_SADTALKER=true and this avatar has a face image -- highest visual quality, real
    head motion, but tens of minutes per clip on a CPU-only machine) > Wav2Lip (fast fallback,
    seconds per clip, visibly blurrier) > static CSS-animated fallback."""
    if settings.enable_sadtalker and sadtalker_is_available() and resolve_face_image_path(avatar):
        return SadTalkerAvatarProvider()
    if settings.enable_wav2lip and wav2lip_is_available() and resolve_face_image_path(avatar):
        return Wav2LipAvatarProvider()
    return StaticAvatarProvider()
