from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "Agentic AI Avatar Platform"
    database_url: str = f"sqlite:///{BASE_DIR / 'data' / 'app.db'}"
    chroma_persist_dir: str = str(BASE_DIR / "data" / "chroma")

    jwt_secret: str = "dev-secret-change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    ollama_base_url: str = "http://localhost:11434"
    ollama_chat_model: str = "llama3.2"
    ollama_embed_model: str = "nomic-embed-text"

    # Fast open-source avatar video: generates a lip-synced clip per turn using a local
    # Wav2Lip install (CPU-only on this machine, so real per-clip latency, but seconds not
    # minutes). The default video provider.
    enable_wav2lip: bool = True
    wav2lip_timeout_seconds: int = 180

    # Highest-quality open-source option: real head motion + GFPGAN-sharpened video via a
    # local SadTalker install. Extremely slow on CPU (tens of minutes per clip) -- opt-in only
    # (set to true explicitly) since that latency makes it impractical as a live-demo default.
    enable_sadtalker: bool = False
    sadtalker_timeout_seconds: int = 3600

    cors_origins: list[str] = ["http://localhost:3000"]

    rag_relevance_threshold: float = 0.35
    agent_confidence_threshold: float = 0.55

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
