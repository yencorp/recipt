"""
헬스체크 API 라우터
"""

from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
import structlog

from ..utils.health import HealthChecker

logger = structlog.get_logger()
router = APIRouter(prefix="/api/health", tags=["Health"])


class HealthResponse(BaseModel):
    """헬스체크 응답"""

    status: str = Field(description="서비스 상태")
    timestamp: str = Field(description="체크 시간")
    version: str = Field(description="서비스 버전")
    services: Dict[str, Dict[str, Any]] = Field(description="각 서비스 상태")


# 의존성 주입
def get_health_checker() -> HealthChecker:
    """헬스 체커 의존성"""
    return HealthChecker()


@router.get("", response_model=HealthResponse)
async def health_check(
    health_checker: HealthChecker = Depends(get_health_checker),
):
    """
    헬스체크 엔드포인트

    서비스 전반의 상태를 확인합니다.
    """
    try:
        health_status = await health_checker.get_health_status()
        return HealthResponse(**health_status)

    except Exception as e:
        logger.error("health_check_failed", error=str(e))
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.utcnow().isoformat(),
            version="1.0.0",
            services={},
        )


@router.get("/live")
async def liveness_probe():
    """
    Liveness 프로브 (Kubernetes 등에서 사용)

    서비스가 살아있는지 간단히 확인
    """
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}


@router.get("/ready")
async def readiness_probe(
    health_checker: HealthChecker = Depends(get_health_checker),
):
    """
    Readiness 프로브 (Kubernetes 등에서 사용)

    서비스가 요청을 받을 준비가 되었는지 확인
    """
    try:
        health_status = await health_checker.get_health_status()

        if health_status["status"] == "healthy":
            return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}
        else:
            return {"status": "not_ready", "timestamp": datetime.utcnow().isoformat()}

    except Exception as e:
        logger.error("readiness_probe_failed", error=str(e))
        return {"status": "not_ready", "timestamp": datetime.utcnow().isoformat()}
