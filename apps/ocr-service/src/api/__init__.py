"""API 라우터 모듈"""

from .ocr import router as ocr_router
from .health import router as health_router

__all__ = ["ocr_router", "health_router"]
