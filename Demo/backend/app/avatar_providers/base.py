from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class AvatarSession:
    provider: str
    ready: bool
    session_config: dict[str, Any]
    error: str | None = None


class AvatarProvider(ABC):
    """Swappable interface for avatar rendering providers.

    Any provider (SadTalker, Wav2Lip, or a static fallback) implements this so the
    rest of the platform never depends on a specific implementation's shape.
    """

    name: str = "base"

    @abstractmethod
    def create_session(self, avatar_config: dict[str, Any]) -> AvatarSession:
        """Return connection details the frontend needs to render/stream the avatar."""
        raise NotImplementedError
