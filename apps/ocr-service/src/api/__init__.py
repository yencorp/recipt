"""API 라우터 모듈"""

from .ocr import router as ocr_router
from .health import router as health_router
from .results import router as results_router
from .feedback import router as feedback_router

__all__ = ["ocr_router", "health_router", "results_router", "feedback_router"]
