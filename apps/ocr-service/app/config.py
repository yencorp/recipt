"""애플리케이션 설정"""

import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # 기본 설정
    APP_NAME: str = "OCR Service"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # CORS 설정
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ]

    # 파일 업로드 설정
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".pdf", ".bmp", ".tiff"}

    # 저장 경로
    UPLOAD_DIR: str = "storage/uploads"
    RESULT_DIR: str = "storage/results"

    # OCR 엔진 설정
    TESSERACT_PATH: str = "/usr/bin/tesseract"
    EASYOCR_MODEL_DIR: str = "/app/.easyocr/model"

    # 성능 설정
    MAX_CONCURRENT_JOBS: int = 3
    JOB_TIMEOUT: int = 300  # 5분

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
