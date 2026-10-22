import subprocess
import tempfile
import uuid
from pathlib import Path

from app.avatar_providers.base import AvatarProvider, AvatarSession
from app.config import settings
from app.tts import TTSUnavailable, synthesize_wav

SADTALKER_DIR = Path(__file__).resolve().parent.parent.parent / "sadtalker" / "repo"
SADTALKER_VENV_PYTHON = Path(__file__).resolve().parent.parent.parent / "sadtalker" / ".venv" / "Scripts" / "python.exe"
CHECKPOINT_PATH = SADTALKER_DIR / "checkpoints" / "SadTalker_V0.0.2_256.safetensors"
GFPGAN_WEIGHTS = SADTALKER_DIR / "gfpgan" / "weights" / "GFPGANv1.4.pth"

MIN_CHECKPOINT_BYTES = 700_000_000
MIN_GFPGAN_BYTES = 300_000_000


def _complete(path: Path, min_bytes: int) -> bool:
    return path.exists() and path.stat().st_size >= min_bytes


def is_available() -> bool:
    return (
        SADTALKER_VENV_PYTHON.exists()
        and _complete(CHECKPOINT_PATH, MIN_CHECKPOINT_BYTES)
        and _complete(GFPGAN_WEIGHTS, MIN_GFPGAN_BYTES)
    )


class SadTalkerUnavailable(RuntimeError):
    pass


def generate_clip(face_image_path: str, text: str, voice_id: str = "default") -> bytes:
    """Generates a high-quality talking-head clip (real head motion + GFPGAN-enhanced
    sharpness) using local, offline SadTalker. CPU-only on this machine -- this is
    dramatically slower than Wav2Lip (tens of minutes, not seconds) since SadTalker
    renders every frame through a full neural face-renderer rather than patching a
    small mouth region."""
    if not is_available():
        raise SadTalkerUnavailable("SadTalker environment/checkpoints not set up")

    face_path = Path(face_image_path)
    if not face_path.exists():
        raise SadTalkerUnavailable(f"Face image not found: {face_image_path}")

    try:
        wav_bytes = synthesize_wav(text, voice_id)
    except TTSUnavailable as exc:
        raise SadTalkerUnavailable(str(exc)) from exc

    work_id = uuid.uuid4().hex
    with tempfile.TemporaryDirectory(prefix=f"sadtalker_{work_id}_") as tmp_dir:
        tmp_path = Path(tmp_dir)
        audio_path = tmp_path / "speech.wav"
        result_dir = tmp_path / "result"
        result_dir.mkdir()
        audio_path.write_bytes(wav_bytes)

        cmd = [
            str(SADTALKER_VENV_PYTHON), "inference.py",
            "--driven_audio", str(audio_path.resolve()),
            "--source_image", str(face_path.resolve()),
            "--enhancer", "gfpgan",
            "--cpu",
            "--result_dir", str(result_dir.resolve()),
        ]
        try:
            subprocess.run(
                cmd, cwd=str(SADTALKER_DIR), capture_output=True, text=True,
                timeout=settings.sadtalker_timeout_seconds, check=True,
            )
        except subprocess.CalledProcessError as exc:
            raise SadTalkerUnavailable(f"SadTalker inference failed: {exc.stderr[-2000:]}") from exc
        except subprocess.TimeoutExpired as exc:
            raise SadTalkerUnavailable("SadTalker inference timed out") from exc

        outputs = list(result_dir.glob("*.mp4"))
        if not outputs:
            raise SadTalkerUnavailable("SadTalker did not produce an output file")
        return outputs[0].read_bytes()


class SadTalkerAvatarProvider(AvatarProvider):
    """Highest-quality open-source option: real head motion + GFPGAN-sharpened video,
    generated per-turn. Extremely slow on CPU (tens of minutes per clip) -- opted into
    as the default despite this, per explicit user preference for maximum open-source
    quality over interactivity."""

    name = "sadtalker"

    def create_session(self, avatar_config: dict) -> AvatarSession:
        face_path = avatar_config.get("face_image_path")
        if not face_path or not Path(face_path).exists():
            return AvatarSession(
                provider=self.name, ready=False, session_config={},
                error="No local face image configured for this avatar; falling back.",
            )
        return AvatarSession(provider=self.name, ready=True, session_config={})
