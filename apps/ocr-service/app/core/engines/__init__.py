"""OCR 엔진"""

from .base import BaseOCREngine
from .tesseract import TesseractEngine
from .easyocr import EasyOCREngine

__all__ = ["BaseOCREngine", "TesseractEngine", "EasyOCREngine"]
