"""Tesseract OCR 엔진"""

import pytesseract
import cv2
import numpy as np
from pathlib import Path
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class TesseractEngine:
    """Tesseract OCR 엔진"""

    def __init__(self):
        self.tesseract_path = "/usr/bin/tesseract"  # Docker 환경 경로
        self.config = "--oem 3 --psm 6 -l kor+eng"

    async def initialize(self):
        """Tesseract 초기화"""
        try:
            # Tesseract 경로 설정
            pytesseract.pytesseract.tesseract_cmd = self.tesseract_path

            # Tesseract 설치 확인
            version = pytesseract.get_tesseract_version()
            logger.info(f"Tesseract 버전: {version}")

            # 한글 언어팩 확인
            langs = pytesseract.get_languages()
            if "kor" not in langs:
                logger.warning("한글 언어팩이 설치되지 않았습니다.")

        except Exception as e:
            logger.error(f"Tesseract 초기화 실패: {e}")
            raise

    async def extract_text(self, image_path: Path) -> str:
        """텍스트 추출"""
        try:
            image = cv2.imread(str(image_path))
            text = pytesseract.image_to_string(image, config=self.config)
            return text.strip()
        except Exception as e:
            logger.error(f"Tesseract 텍스트 추출 실패 {image_path}: {e}")
            raise

    async def get_confidence(self, image_path: Path) -> float:
        """신뢰도 계산"""
        try:
            image = cv2.imread(str(image_path))
            data = pytesseract.image_to_data(
                image, config=self.config, output_type=pytesseract.Output.DICT
            )

            confidences = [int(conf) for conf in data["conf"] if int(conf) > 0]
            if confidences:
                return sum(confidences) / len(confidences) / 100.0
            return 0.0

        except Exception as e:
            logger.error(f"신뢰도 계산 실패 {image_path}: {e}")
            return 0.0

    async def cleanup(self):
        """리소스 정리"""
        pass
