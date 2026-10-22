import io
import wave
from pathlib import Path

from piper import PiperVoice

MAX_TTS_CHARS = 800

VOICES_DIR = Path(__file__).resolve().parent.parent / "piper_voices"

# Maps an avatar's voice_id to a Piper neural voice model. Falls back to a shared default
# for any avatar without a specific mapping, so new avatars still get a natural-sounding voice.
VOICE_MODELS = {
    "maya-en-female": "en_US-amy-medium.onnx",
    "leo-en-male": "en_US-ryan-medium.onnx",
    "default": "en_US-amy-medium.onnx",
}

_voice_cache: dict[str, PiperVoice] = {}


class TTSUnavailable(RuntimeError):
    pass


def _load_voice(model_filename: str) -> PiperVoice:
    if model_filename not in _voice_cache:
        model_path = VOICES_DIR / model_filename
        if not model_path.exists():
            raise TTSUnavailable(f"Piper voice model not found: {model_path}")
        _voice_cache[model_filename] = PiperVoice.load(str(model_path))
    return _voice_cache[model_filename]


def synthesize_wav(text: str, voice_id: str = "default") -> bytes:
    """Local, offline, natural-sounding TTS via Piper (a small neural TTS model, CPU-only,
    no API key) -- produces a standard WAV file used as input to Wav2Lip/SadTalker's own
    audio loaders, which resample internally. voice_id picks which avatar voice to use;
    unrecognized ids fall back to a shared default voice."""
    text = text.strip()[:MAX_TTS_CHARS]
    if not text:
        return b""

    model_filename = VOICE_MODELS.get(voice_id, VOICE_MODELS["default"])
    voice = _load_voice(model_filename)

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav_file:
        voice.synthesize_wav(text, wav_file)
    return buf.getvalue()
