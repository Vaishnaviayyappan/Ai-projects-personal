import subprocess
import tempfile
import uuid
from pathlib import Path

from app.avatar_providers.base import AvatarProvider, AvatarSession
from app.config import settings
from app.tts import TTSUnavailable, synthesize_wav

WAV2LIP_DIR = Path(__file__).resolve().parent.parent.parent / "wav2lip"
WAV2LIP_VENV_PYTHON = WAV2LIP_DIR / ".venv" / "Scripts" / "python.exe"
CHECKPOINT_PATH = WAV2LIP_DIR / "checkpoints" / "wav2lip_gan.pth"
MOBILENET_PATH = WAV2LIP_DIR / "checkpoints" / "mobilenet.pth"

# Real file sizes, used to detect truncated/incomplete downloads (a partial file with
# .exists() == True would otherwise look "available" and fail at inference time).
MIN_CHECKPOINT_BYTES = 400_000_000
MIN_MOBILENET_BYTES = 1_500_000


def _complete(path: Path, min_bytes: int) -> bool:
    return path.exists() and path.stat().st_size >= min_bytes


def is_available() -> bool:
    return (
        WAV2LIP_VENV_PYTHON.exists()
        and _complete(CHECKPOINT_PATH, MIN_CHECKPOINT_BYTES)
        and _complete(MOBILENET_PATH, MIN_MOBILENET_BYTES)
    )


class Wav2LipUnavailable(RuntimeError):
    pass


def generate_clip(face_image_path: str, text: str, voice_id: str = "default") -> bytes:
    """Generates a lip-synced MP4 clip of the given face speaking the given text,
    using local, offline Wav2Lip + Piper neural TTS. CPU-only; takes real time
    per call (no GPU on this machine) -- this is a batch clip, not a live stream."""
    if not is_available():
        raise Wav2LipUnavailable("Wav2Lip environment/checkpoints not set up")

    face_path = Path(face_image_path)
    if not face_path.exists():
        raise Wav2LipUnavailable(f"Face image not found: {face_image_path}")

    try:
        wav_bytes = synthesize_wav(text, voice_id)
    except TTSUnavailable as exc:
        raise Wav2LipUnavailable(str(exc)) from exc

    work_id = uuid.uuid4().hex
    with tempfile.TemporaryDirectory(prefix=f"wav2lip_{work_id}_") as tmp_dir:
        tmp_path = Path(tmp_dir)
        audio_path = tmp_path / "speech.wav"
        outfile_path = tmp_path / "out.mp4"
        audio_path.write_bytes(wav_bytes)

        cmd = [
            str(WAV2LIP_VENV_PYTHON), "inference.py",
            "--checkpoint_path", str(CHECKPOINT_PATH),
            "--face", str(face_path.resolve()),
            "--audio", str(audio_path.resolve()),
            "--outfile", str(outfile_path.resolve()),
        ]
        try:
            subprocess.run(
                cmd, cwd=str(WAV2LIP_DIR), capture_output=True, text=True,
                timeout=settings.wav2lip_timeout_seconds, check=True,
            )
        except subprocess.CalledProcessError as exc:
            raise Wav2LipUnavailable(f"Wav2Lip inference failed: {exc.stderr[-2000:]}") from exc
        except subprocess.TimeoutExpired as exc:
            raise Wav2LipUnavailable("Wav2Lip inference timed out") from exc

        if not outfile_path.exists():
            raise Wav2LipUnavailable("Wav2Lip did not produce an output file")
        return outfile_path.read_bytes()


class Wav2LipAvatarProvider(AvatarProvider):
    """Fast open-source avatar provider: video is generated per-turn via generate_clip()
    and played back as a regular <video> element."""

    name = "wav2lip"

    def create_session(self, avatar_config: dict) -> AvatarSession:
        face_path = avatar_config.get("face_image_path")
        if not face_path or not Path(face_path).exists():
            return AvatarSession(
                provider=self.name, ready=False, session_config={},
                error="No local face image configured for this avatar; falling back to the static avatar.",
            )
        return AvatarSession(provider=self.name, ready=True, session_config={})
