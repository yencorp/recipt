"""
OCR 처리 엔진
영수증 이미지에서 텍스트 추출 및 데이터 구조화
"""

import io
import time
import asyncio
from typing import Dict, Any, Optional, List
from pathlib import Path

import numpy as np
import cv2
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract
import structlog

from ..utils.config import get_settings

logger = structlog.get_logger()


class OCRProcessor:
    """OCR 처리 클래스"""
    
    def __init__(self):
        self.settings = get_settings()
        self.is_initialized = False
    
    async def initialize(self) -> bool:
        """OCR 엔진 초기화"""
        try:
            # Tesseract 설정
            pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'
            
            # 초기화 테스트
            test_image = Image.new('RGB', (100, 50), color='white')
            test_result = pytesseract.image_to_string(test_image, lang='eng')
            
            self.is_initialized = True
            logger.info("OCR processor initialized successfully")
            return True
            
        except Exception as e:
            logger.error("OCR processor initialization failed", error=str(e))
            return False
    
    async def process_image(self, image_data: bytes, filename: str) -> Dict[str, Any]:
        """이미지에서 OCR 처리"""
        start_time = time.time()
        
        try:
            if not self.is_initialized:
                await self.initialize()
            
            # 이미지 로드
            image = self._load_image(image_data)
            if image is None:
                raise ValueError("유효하지 않은 이미지 파일입니다.")
            
            # 이미지 전처리
            processed_image = await self._preprocess_image(image)
            
            # OCR 실행
            extracted_text = await self._extract_text(processed_image)
            
            # 신뢰도 계산
            confidence = await self._calculate_confidence(processed_image, extracted_text)
            
            # 구조화된 데이터 추출 (영수증 특화)
            structured_data = await self._extract_structured_data(extracted_text)
            
            processing_time = time.time() - start_time
            
            return {
                "success": True,
                "text": extracted_text,
                "confidence": confidence,
                "processing_time": round(processing_time, 3),
                "image_info": {
                    "filename": filename,
                    "size": image.size,
                    "mode": image.mode,
                    "format": image.format
                },
                "extracted_data": structured_data
            }
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error("OCR processing failed", 
                        filename=filename, 
                        error=str(e),
                        processing_time=processing_time)
            
            return {
                "success": False,
                "text": "",
                "confidence": 0.0,
                "processing_time": round(processing_time, 3),
                "image_info": {"filename": filename},
                "extracted_data": None,
                "error": str(e)
            }
    
    def _load_image(self, image_data: bytes) -> Optional[Image.Image]:
        """이미지 데이터를 PIL Image로 로드"""
        try:
            image = Image.open(io.BytesIO(image_data))
            
            # RGB 변환
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # 크기 제한
            if image.size[0] > self.settings.MAX_IMAGE_WIDTH or image.size[1] > self.settings.MAX_IMAGE_HEIGHT:
                image.thumbnail((self.settings.MAX_IMAGE_WIDTH, self.settings.MAX_IMAGE_HEIGHT), Image.Resampling.LANCZOS)
            
            return image
            
        except Exception as e:
            logger.error("Failed to load image", error=str(e))
            return None
    
    async def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """이미지 전처리 (OCR 품질 향상)"""
        try:
            # PIL을 numpy 배열로 변환
            img_array = np.array(image)
            
            # OpenCV를 사용한 전처리
            # 1. 그레이스케일 변환
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # 2. 노이즈 제거
            denoised = cv2.fastNlMeansDenoising(gray)
            
            # 3. 이진화 (Otsu's thresholding)
            _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # 4. 모폴로지 연산 (텍스트 개선)
            kernel = np.ones((2, 2), np.uint8)
            processed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
            
            # numpy 배열을 PIL Image로 변환
            processed_image = Image.fromarray(processed)
            
            # PIL을 사용한 추가 전처리
            # 선명도 향상
            enhancer = ImageEnhance.Sharpness(processed_image)
            processed_image = enhancer.enhance(1.5)
            
            # 대비 향상
            enhancer = ImageEnhance.Contrast(processed_image)
            processed_image = enhancer.enhance(1.2)
            
            return processed_image
            
        except Exception as e:
            logger.warning("Image preprocessing failed, using original", error=str(e))
            return image
    
    async def _extract_text(self, image: Image.Image) -> str:
        """이미지에서 텍스트 추출"""
        try:
            # Tesseract 설정
            custom_config = self.settings.OCR_CONFIG
            
            # OCR 실행
            text = pytesseract.image_to_string(
                image,
                lang=self.settings.OCR_LANG,
                config=custom_config
            )
            
            # 텍스트 정리
            cleaned_text = self._clean_text(text)
            
            return cleaned_text
            
        except Exception as e:
            logger.error("Text extraction failed", error=str(e))
            return ""
    
    def _clean_text(self, text: str) -> str:
        """추출된 텍스트 정리"""
        if not text:
            return ""
        
        # 기본 정리
        lines = []
        for line in text.split('\n'):
            # 공백 정리
            cleaned_line = ' '.join(line.split())
            if cleaned_line:  # 빈 줄 제거
                lines.append(cleaned_line)
        
        return '\n'.join(lines)
    
    async def _calculate_confidence(self, image: Image.Image, text: str) -> float:
        """OCR 결과 신뢰도 계산"""
        try:
            # Tesseract의 상세 데이터 사용
            data = pytesseract.image_to_data(
                image,
                lang=self.settings.OCR_LANG,
                config=self.settings.OCR_CONFIG,
                output_type=pytesseract.Output.DICT
            )
            
            # 신뢰도 점수들 수집
            confidences = []
            for i, conf in enumerate(data['conf']):
                if int(conf) > 0:  # 유효한 신뢰도만
                    confidences.append(int(conf))
            
            if not confidences:
                return 0.0
            
            # 평균 신뢰도 계산 (0-100 -> 0-1)
            avg_confidence = sum(confidences) / len(confidences) / 100.0
            
            # 텍스트 길이에 따른 보정
            text_length_factor = min(1.0, len(text.strip()) / 50.0)
            
            return round(avg_confidence * text_length_factor, 3)
            
        except Exception as e:
            logger.warning("Confidence calculation failed", error=str(e))
            # 텍스트가 있으면 기본 신뢰도 반환
            return 0.5 if text.strip() else 0.0
    
    async def _extract_structured_data(self, text: str) -> Optional[Dict[str, Any]]:
        """영수증에서 구조화된 데이터 추출"""
        try:
            import re
            from datetime import datetime
            
            structured = {
                "store_name": None,
                "date": None,
                "time": None,
                "items": [],
                "total_amount": None,
                "payment_method": None,
                "phone": None,
                "address": None
            }
            
            lines = text.split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # 날짜 패턴 (YYYY-MM-DD, YYYY/MM/DD, MM-DD, MM/DD 등)
                date_patterns = [
                    r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})',
                    r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})',
                    r'(\d{1,2})[/-](\d{1,2})'
                ]
                
                for pattern in date_patterns:
                    if re.search(pattern, line) and not structured["date"]:
                        structured["date"] = line
                        break
                
                # 시간 패턴 (HH:MM)
                time_pattern = r'(\d{1,2}):(\d{2})'
                if re.search(time_pattern, line) and not structured["time"]:
                    structured["time"] = re.search(time_pattern, line).group()
                
                # 금액 패턴 (숫자 + 원, 숫자,숫자 형태)
                amount_patterns = [
                    r'(\d{1,3}(?:,\d{3})*)\s*원',
                    r'(\d+,\d+)',
                    r'(\d+)\s*원'
                ]
                
                for pattern in amount_patterns:
                    match = re.search(pattern, line)
                    if match:
                        amount_str = match.group(1)
                        # 콤마 제거하고 숫자로 변환
                        try:
                            amount = int(amount_str.replace(',', ''))
                            # 가장 큰 금액을 총액으로 가정
                            if not structured["total_amount"] or amount > structured["total_amount"]:
                                structured["total_amount"] = amount
                        except ValueError:
                            pass
                
                # 전화번호 패턴
                phone_pattern = r'(\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4})'
                if re.search(phone_pattern, line) and not structured["phone"]:
                    structured["phone"] = re.search(phone_pattern, line).group()
                
                # 매장명 추출 (첫 번째 줄이 보통 매장명)
                if not structured["store_name"] and len(line) > 2 and not re.search(r'\d', line):
                    structured["store_name"] = line
            
            # None 값 제거
            return {k: v for k, v in structured.items() if v is not None}
            
        except Exception as e:
            logger.warning("Structured data extraction failed", error=str(e))
            return None