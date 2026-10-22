from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union, Optional
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "Farm Connect"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "change_this_to_a_secure_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "farm_connect"
    DATABASE_URL: Optional[str] = None
    
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Pydantic V2 config
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=True)

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        if self.DATABASE_URL and "asyncpg" in self.DATABASE_URL:
            return self.DATABASE_URL
        
        # Build it safely
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

settings = Settings()
