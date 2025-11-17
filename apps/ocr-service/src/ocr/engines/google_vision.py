"""
Google Vision API 엔진 구현
클라우드 기반 고정확도 OCR, 복잡한 이미지와 다국어 지원
"""

from typing import Dict, Any, Optional
from PIL import Image
import io
import structlog

from .base import BaseOCREngine

logger = structlog.get_logger()


class GoogleVisionEngine(BaseOCREngine):
    """Google Vision API 엔진"""

    def __init__(self):
        super().__init__("GoogleVision")
        self.client: Optional[Any] = None
        self.credentials_path: Optional[str] = None

    async def initialize(self) -> bool:
        """
        Google Vision API 클라이언트 초기화

        환경 변수 GOOGLE_APPLICATION_CREDENTIALS 필요

        Returns:
            bool: 초기화 성공 여부
        """
        try:
            import os
            from google.cloud import vision

            # 환경 변수에서 credentials 경로 확인
            self.credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

            if not self.credentials_path:
                logger.warning(
                    "google_vision_credentials_not_found",
                    message="GOOGLE_APPLICATION_CREDENTIALS 환경 변수가 설정되지 않았습니다",
                )
                self.is_initialized = False
                return False

            # Vision API 클라이언트 초기화
            self.client = vision.ImageAnnotatorClient()

            # 초기화 테스트 (간단한 이미지로 테스트)
            test_image = Image.new("RGB", (100, 50), color="white")
            test_content = io.BytesIO()
            test_image.save(test_content, format="PNG")

            vision_image = vision.Image(content=test_content.getvalue())
            response = self.client.text_detection(image=vision_image)

            # API 응답 확인
            if response.error.message:
                raise Exception(response.error.message)

            self.is_initialized = True
            logger.info(
                "google_vision_initialized",
                engine=self.engine_name,
                credentials_path=self.credentials_path,
            )
            return True

        except Exception as e:
            logger.error(
                "google_vision_initialization_failed",
                engine=self.engine_name,
                error=str(e),
            )
            self.is_initialized = False
            return False

    async def extract_text(self, image: Image.Image, lang: str = "kor") -> Dict[str, Any]:
        """
        Google Vision API로 이미지에서 텍스트 추출

        Args:
            image: PIL Image 객체
            lang: 언어 코드 (Google Vision은 자동 감지)

        Returns:
            Dict[str, Any]: {
                "text": str,
                "confidence": float,
                "details": Dict
            }
        """
        if not self.is_initialized or self.client is None:
            raise RuntimeError("Engine not initialized")

        try:
            from google.cloud import vision

            # PIL Image를 bytes로 변환
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format="PNG")
            img_byte_arr = img_byte_arr.getvalue()

            # Vision API 이미지 객체 생성
            vision_image = vision.Image(content=img_byte_arr)

            # 텍스트 감지 요청
            response = self.client.text_detection(image=vision_image)

            # 에러 체크
            if response.error.message:
                raise Exception(response.error.message)

            # 텍스트 추출
            texts = response.text_annotations

            if not texts:
                logger.info(
                    "google_vision_no_text_detected",
                    engine=self.engine_name,
                )
                return {
                    "text": "",
                    "confidence": 0.0,
                    "details": {"detected_texts": 0},
                }

            # 첫 번째 항목이 전체 텍스트
            full_text = texts[0].description

            # 신뢰도 계산 (개별 단어들의 평균)
            # Google Vision은 confidence를 제공하지 않으므로,
            # 감지된 텍스트의 개수와 품질로 추정
            confidence = self._estimate_confidence(texts)

            # 상세 정보 수집
            details = self._extract_details(texts)

            logger.info(
                "google_vision_extraction_success",
                engine=self.engine_name,
                text_length=len(full_text),
                confidence=confidence,
                detected_texts=len(texts),
            )

            return {
                "text": full_text.strip(),
                "confidence": confidence,
                "details": details,
            }

        except Exception as e:
            logger.error(
                "google_vision_extraction_failed",
                engine=self.engine_name,
                error=str(e),
            )
            return {
                "text": "",
                "confidence": 0.0,
                "details": {"error": str(e)},
            }

    def _estimate_confidence(self, texts: list) -> float:
        """
        텍스트 감지 결과로부터 신뢰도 추정

        Google Vision은 confidence를 제공하지 않으므로,
        감지된 텍스트의 개수와 바운딩 박스 품질로 추정

        Args:
            texts: Google Vision text annotations

        Returns:
            float: 추정 신뢰도 (0.0-1.0)
        """
        if not texts or len(texts) < 2:
            return 0.0

        # 감지된 단어 개수 기반 (2개 이상이면 높은 신뢰도)
        word_count = len(texts) - 1  # 첫 번째는 전체 텍스트
        word_factor = min(1.0, word_count / 10.0)

        # 바운딩 박스 품질 확인 (vertices가 정확한지)
        bbox_quality = 0.0
        valid_bboxes = 0

        for text in texts[1:]:  # 첫 번째 제외
            if text.bounding_poly and len(text.bounding_poly.vertices) == 4:
                valid_bboxes += 1

        if word_count > 0:
            bbox_quality = valid_bboxes / word_count

        # 전체 텍스트 길이 고려
        full_text = texts[0].description
        length_factor = min(1.0, len(full_text.strip()) / 50.0)

        # 종합 신뢰도 계산
        confidence = (word_factor * 0.4 + bbox_quality * 0.4 + length_factor * 0.2)

        return round(confidence, 3)

    def _extract_details(self, texts: list) -> Dict[str, Any]:
        """
        Google Vision 상세 정보 추출

        Args:
            texts: Google Vision text annotations

        Returns:
            Dict[str, Any]: 상세 정보
        """
        try:
            details = {
                "detected_texts": len(texts),
                "words": [],
                "languages_detected": set(),
            }

            # 개별 단어 정보 수집
            for text in texts[1:]:  # 첫 번째는 전체 텍스트이므로 제외
                word_info = {
                    "text": text.description,
                    "bounding_box": [
                        (vertex.x, vertex.y)
                        for vertex in text.bounding_poly.vertices
                    ]
                    if text.bounding_poly
                    else [],
                }
                details["words"].append(word_info)

                # 언어 감지 정보
                if hasattr(text, "locale") and text.locale:
                    details["languages_detected"].add(text.locale)

            # set을 list로 변환 (JSON 직렬화 가능하도록)
            details["languages_detected"] = list(details["languages_detected"])

            return details

        except Exception as e:
            logger.warning(
                "google_vision_details_extraction_failed",
                engine=self.engine_name,
                error=str(e),
            )
            return {"detected_texts": len(texts) if texts else 0}

    def get_engine_info(self) -> Dict[str, Any]:
        """
        Google Vision 엔진 정보 반환

        Returns:
            Dict[str, Any]: 엔진 정보
        """
        base_info = super().get_engine_info()
        base_info.update(
            {
                "provider": "Google Cloud",
                "api_type": "cloud",
                "supports_languages": "auto-detect",
                "credentials_configured": self.credentials_path is not None,
            }
        )
        return base_info
