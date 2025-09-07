"""
OCR 서비스 설정 관리
환경 변수를 통한 설정 로드 및 검증
"""

import os
from typing import List
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """OCR 서비스 설정"""
    
    # 서버 설정
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    DEBUG: bool = True
    WORKERS: int = 1
    
    # OCR 엔진 설정
    OCR_ENGINE: str = "tesseract"  # tesseract, easyocr
    OCR_LANG: str = "kor+eng"  # 한국어+영어
    OCR_CONFIG: str = "--oem 3 --psm 6"
    
    # 파일 업로드 설정
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    MAX_BATCH_SIZE: int = 10
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "pdf"]
    
    # 이미지 처리 설정
    MAX_IMAGE_WIDTH: int = 2048
    MAX_IMAGE_HEIGHT: int = 2048
    IMAGE_QUALITY: int = 85
    
    # 디렉토리 설정
    UPLOAD_DIR: str = "./uploads"
    LOG_DIR: str = "./logs"
    TEMP_DIR: str = "./temp"
    
    # CORS 설정
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://recipt-frontend-dev:3000",
        "http://recipt-backend-dev:8000"
    ]
    
    # 로깅 설정
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    ENABLE_ACCESS_LOG: bool = True
    
    # 헬스체크 설정
    HEALTH_CHECK_INTERVAL: int = 30
    
    # 데이터베이스 설정 (향후 사용)
    DATABASE_URL: str = ""
    
    # 외부 서비스 설정
    BACKEND_API_URL: str = "http://recipt-backend-dev:8000/api"
    
    # 성능 설정
    OCR_TIMEOUT: int = 30  # 초
    MAX_CONCURRENT_REQUESTS: int = 5
    
    # 보안 설정
    API_KEY_HEADER: str = "X-API-Key"
    ENABLE_API_KEY: bool = False
    
    # 개발 전용 설정
    ENABLE_RELOAD: bool = True
    ENABLE_DEBUG_ENDPOINT: bool = True
    
    class Config:
        env_file = ".env.development"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """설정 인스턴스를 캐시와 함께 반환"""
    return Settings()