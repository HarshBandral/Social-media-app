from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "SocialMedia API"
    DATABASE_URL: str = "sqlite+aiosqlite:///./social_media.db"
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    RESET_TOKEN_EXPIRE_MINUTES: int = 15
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    STORY_EXPIRE_HOURS: int = 24

    class Config:
        env_file = ".env"


settings = Settings()
