"""
OCR 엔진 베이스 클래스
모든 OCR 엔진의 공통 인터페이스 정의
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from PIL import Image
import structlog

logger = structlog.get_logger()


class BaseOCREngine(ABC):
    """OCR 엔진 베이스 클래스"""

    def __init__(self, engine_name: str):
        self.engine_name = engine_name
        self.is_initialized = False

    @abstractmethod
    async def initialize(self) -> bool:
        """
        OCR 엔진 초기화

        Returns:
            bool: 초기화 성공 여부
        """
        pass

    @abstractmethod
    async def extract_text(self, image: Image.Image, lang: str = "kor") -> Dict[str, Any]:
        """
        이미지에서 텍스트 추출

        Args:
            image: PIL Image 객체
            lang: 언어 코드 (기본값: 한국어)

        Returns:
            Dict[str, Any]: {
                "text": str,  # 추출된 텍스트
                "confidence": float,  # 신뢰도 (0.0-1.0)
                "details": Dict  # 엔진별 상세 정보
            }
        """
        pass

    async def check_availability(self) -> bool:
        """
        엔진 사용 가능 여부 확인

        Returns:
            bool: 사용 가능 여부
        """
        return self.is_initialized

    def get_engine_info(self) -> Dict[str, Any]:
        """
        엔진 정보 반환

        Returns:
            Dict[str, Any]: 엔진 정보
        """
        return {
            "name": self.engine_name,
            "initialized": self.is_initialized,
        }
