from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    MAX_IMAGE_BYTES: int = 10 * 1024 * 1024
    MAX_IMAGE_WIDTH: int = 4096
    MAX_IMAGE_HEIGHT: int = 4096
    REQUEST_TIMEOUT_SECONDS: float = 20.0
    INPAINT_RADIUS: int = 3
    OUTPUT_FORMAT: str = "png"


settings = Settings()

