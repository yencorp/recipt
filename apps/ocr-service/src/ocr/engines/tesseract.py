"""
Tesseract OCR 엔진 구현
기존 processor.py의 Tesseract 로직을 모듈화
"""

from typing import Dict, Any
from PIL import Image
import pytesseract
import structlog

from .base import BaseOCREngine

logger = structlog.get_logger()


class TesseractEngine(BaseOCREngine):
    """Tesseract OCR 엔진"""

    def __init__(self):
        super().__init__("Tesseract")
        self.tesseract_path = "/usr/bin/tesseract"  # Docker 환경 경로
        self.default_lang = "kor+eng"
        self.default_config = r"--oem 3 --psm 6"

    async def initialize(self) -> bool:
        """
        Tesseract 엔진 초기화

        Returns:
            bool: 초기화 성공 여부
        """
        try:
            # Tesseract 경로 설정
            pytesseract.pytesseract.tesseract_cmd = self.tesseract_path

            # 초기화 테스트 (간단한 이미지로 테스트)
            test_image = Image.new("RGB", (100, 50), color="white")
            test_result = pytesseract.image_to_string(test_image, lang="eng")

            self.is_initialized = True
            logger.info(
                "tesseract_initialized",
                engine=self.engine_name,
                path=self.tesseract_path,
            )
            return True

        except Exception as e:
            logger.error(
                "tesseract_initialization_failed",
                engine=self.engine_name,
                error=str(e),
            )
            self.is_initialized = False
            return False

    async def extract_text(self, image: Image.Image, lang: str = "kor") -> Dict[str, Any]:
        """
        Tesseract로 이미지에서 텍스트 추출

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
        if not self.is_initialized:
            raise RuntimeError("Engine not initialized")

        try:
            # 언어 설정 (한국어+영어)
            tesseract_lang = "kor+eng" if lang == "kor" else lang

            # OCR 실행
            text = pytesseract.image_to_string(
                image, lang=tesseract_lang, config=self.default_config
            )

            # 텍스트 정리
            cleaned_text = self._clean_text(text)

            # 신뢰도 계산
            confidence = await self._calculate_confidence(image, tesseract_lang)

            # 상세 정보 수집
            details = await self._get_detailed_data(image, tesseract_lang)

            logger.info(
                "tesseract_extraction_success",
                engine=self.engine_name,
                text_length=len(cleaned_text),
                confidence=confidence,
            )

            return {
                "text": cleaned_text,
                "confidence": confidence,
                "details": details,
            }

        except Exception as e:
            logger.error(
                "tesseract_extraction_failed",
                engine=self.engine_name,
                error=str(e),
            )
            return {
                "text": "",
                "confidence": 0.0,
                "details": {"error": str(e)},
            }

    def _clean_text(self, text: str) -> str:
        """
        추출된 텍스트 정리

        Args:
            text: 원본 텍스트

        Returns:
            str: 정리된 텍스트
        """
        if not text:
            return ""

        # 기본 정리
        lines = []
        for line in text.split("\n"):
            # 공백 정리
            cleaned_line = " ".join(line.split())
            if cleaned_line:  # 빈 줄 제거
                lines.append(cleaned_line)

        return "\n".join(lines)

    async def _calculate_confidence(self, image: Image.Image, lang: str) -> float:
        """
        OCR 결과 신뢰도 계산

        Args:
            image: PIL Image 객체
            lang: 언어 코드

        Returns:
            float: 신뢰도 (0.0-1.0)
        """
        try:
            # Tesseract의 상세 데이터 사용
            data = pytesseract.image_to_data(
                image,
                lang=lang,
                config=self.default_config,
                output_type=pytesseract.Output.DICT,
            )

            # 신뢰도 점수들 수집
            confidences = []
            for conf in data["conf"]:
                if int(conf) > 0:  # 유효한 신뢰도만
                    confidences.append(int(conf))

            if not confidences:
                return 0.0

            # 평균 신뢰도 계산 (0-100 -> 0-1)
            avg_confidence = sum(confidences) / len(confidences) / 100.0

            return round(avg_confidence, 3)

        except Exception as e:
            logger.warning(
                "confidence_calculation_failed",
                engine=self.engine_name,
                error=str(e),
            )
            return 0.0

    async def _get_detailed_data(
        self, image: Image.Image, lang: str
    ) -> Dict[str, Any]:
        """
        Tesseract 상세 데이터 수집

        Args:
            image: PIL Image 객체
            lang: 언어 코드

        Returns:
            Dict[str, Any]: 상세 정보
        """
        try:
            data = pytesseract.image_to_data(
                image,
                lang=lang,
                config=self.default_config,
                output_type=pytesseract.Output.DICT,
            )

            # 단어 수, 줄 수 계산
            word_count = sum(1 for text in data["text"] if text.strip())
            line_count = len(set(data["line_num"]))

            return {
                "word_count": word_count,
                "line_count": line_count,
                "language": lang,
                "config": self.default_config,
            }

        except Exception as e:
            logger.warning(
                "detailed_data_collection_failed",
                engine=self.engine_name,
                error=str(e),
            )
            return {}
