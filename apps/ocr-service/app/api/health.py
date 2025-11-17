"""헬스체크 API"""

from fastapi import APIRouter
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("")
async def health_check():
    """헬스체크 엔드포인트"""
    return {"status": "healthy", "service": "OCR Service"}


@router.get("/live")
async def liveness_probe():
    """Liveness 프로브 (Kubernetes)"""
    return {"status": "alive"}


@router.get("/ready")
async def readiness_probe():
    """Readiness 프로브 (Kubernetes)"""
    # TODO: OCR 엔진 초기화 상태 확인
    return {"status": "ready"}
