from typing import Any

from app.avatar_providers.base import AvatarProvider, AvatarSession


class StaticAvatarProvider(AvatarProvider):
    """Fallback: no video, frontend animates a static portrait with CSS visemes driven by
    TTS speech synthesis events. Used automatically when no open-source video provider
    (SadTalker/Wav2Lip) is configured for an avatar."""

    name = "static"

    def create_session(self, avatar_config: dict[str, Any]) -> AvatarSession:
        return AvatarSession(
            provider=self.name,
            ready=True,
            session_config={"image_url": avatar_config.get("appearance_image_url")},
        )
