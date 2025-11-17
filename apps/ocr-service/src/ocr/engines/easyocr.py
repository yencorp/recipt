"""
EasyOCR 엔진 구현
딥러닝 기반 OCR로 복잡한 이미지에서 높은 정확도 제공
"""

from typing import Dict, Any, Optional
from PIL import Image
import numpy as np
import structlog

from .base import BaseOCREngine

logger = structlog.get_logger()


class EasyOCREngine(BaseOCREngine):
    """EasyOCR 엔진"""

    def __init__(self):
        super().__init__("EasyOCR")
        self.reader: Optional[Any] = None
        self.languages = ["ko", "en"]  # 한국어, 영어
        self.gpu = False  # Docker 환경에서는 기본적으로 CPU 사용

    async def initialize(self) -> bool:
        """
        EasyOCR 엔진 초기화

        Returns:
            bool: 초기화 성공 여부
        """
        try:
            import easyocr

            # EasyOCR Reader 초기화
            # Docker 환경에서 모델 다운로드 경로 설정
            self.reader = easyocr.Reader(
                self.languages,
                gpu=self.gpu,
                model_storage_directory="/app/.easyocr/model",  # Docker 볼륨 경로
                download_enabled=True,
            )

            self.is_initialized = True
            logger.info(
                "easyocr_initialized",
                engine=self.engine_name,
                languages=self.languages,
                gpu=self.gpu,
            )
            return True

        except Exception as e:
            logger.error(
                "easyocr_initialization_failed",
                engine=self.engine_name,
                error=str(e),
            )
            self.is_initialized = False
            return False

    async def extract_text(self, image: Image.Image, lang: str = "kor") -> Dict[str, Any]:
        """
        EasyOCR로 이미지에서 텍스트 추출

        Args:
            image: PIL Image 객체
            lang: 언어 코드 (기본값: 한국어)

        Returns:
            Dict[str, Any]: {
                "text": str,
                "confidence": float,
                "details": Dict
            }
        """
        if not self.is_initialized or self.reader is None:
            raise RuntimeError("Engine not initialized")

        try:
            # PIL Image를 numpy array로 변환
            image_np = np.array(image)

            # EasyOCR 실행 (paragraph=True로 문단 단위 추출)
            results = self.reader.readtext(
                image_np,
                paragraph=True,  # 문단 단위로 추출
                batch_size=4,
            )

            # 결과 처리
            texts = []
            confidences = []
            bboxes = []

            for bbox, text, confidence in results:
                texts.append(text)
                confidences.append(confidence)
                bboxes.append(bbox)

            # 전체 텍스트 결합
            full_text = "\n".join(texts)

            # 평균 신뢰도 계산
            avg_confidence = (
                round(sum(confidences) / len(confidences), 3) if confidences else 0.0
            )

            logger.info(
                "easyocr_extraction_success",
                engine=self.engine_name,
                text_length=len(full_text),
                confidence=avg_confidence,
                detected_blocks=len(results),
            )

            return {
                "text": full_text,
                "confidence": avg_confidence,
                "details": {
                    "detected_blocks": len(results),
                    "individual_confidences": confidences,
                    "bounding_boxes": bboxes,
                    "languages": self.languages,
                },
            }

        except Exception as e:
            logger.error(
                "easyocr_extraction_failed",
                engine=self.engine_name,
                error=str(e),
            )
            return {
                "text": "",
                "confidence": 0.0,
                "details": {"error": str(e)},
            }

    def get_engine_info(self) -> Dict[str, Any]:
        """
        EasyOCR 엔진 정보 반환

        Returns:
            Dict[str, Any]: 엔진 정보
        """
        base_info = super().get_engine_info()
        base_info.update(
            {
                "languages": self.languages,
                "gpu_enabled": self.gpu,
                "model_type": "deep_learning",
            }
        )
        return base_info
