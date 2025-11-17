"""
OCR 처리 오케스트레이터
다단계 OCR 처리 시스템 - Tesseract → EasyOCR → Google Vision
"""

import time
from typing import Dict, Any, Optional, List
from PIL import Image
import structlog

from .engines.base import BaseOCREngine
from .engines.tesseract import TesseractEngine
from .engines.easyocr import EasyOCREngine
from .engines.google_vision import GoogleVisionEngine
from .preprocessor import ImagePreprocessor
from .confidence_evaluator import ConfidenceEvaluator

logger = structlog.get_logger()


class OCRManager:
    """
    OCR 처리 매니저

    여러 OCR 엔진을 순차적으로 사용하여 최적의 텍스트 추출
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        OCR 매니저 초기화

        Args:
            config: 매니저 설정
        """
        self.config = config or self._get_default_config()

        # 컴포넌트 초기화
        self.preprocessor = ImagePreprocessor(self.config.get("preprocessing"))
        self.evaluator = ConfidenceEvaluator(self.config.get("confidence_evaluation"))

        # OCR 엔진 초기화
        self.engines: Dict[str, BaseOCREngine] = {}
        self.is_initialized = False

    def _get_default_config(self) -> Dict[str, Any]:
        """기본 설정 반환"""
        return {
            "engine_sequence": ["Tesseract", "EasyOCR", "GoogleVision"],  # 엔진 순서
            "stop_on_sufficient_confidence": True,  # 신뢰도 충분하면 중단
            "save_intermediate_results": False,  # 중간 결과 저장 여부
            "preprocessing": None,  # ImagePreprocessor 설정
            "confidence_evaluation": None,  # ConfidenceEvaluator 설정
        }

    async def initialize(self) -> bool:
        """
        OCR 매니저 및 모든 엔진 초기화

        Returns:
            bool: 초기화 성공 여부
        """
        try:
            logger.info("ocr_manager_initializing")

            # 엔진 인스턴스 생성
            self.engines = {
                "Tesseract": TesseractEngine(),
                "EasyOCR": EasyOCREngine(),
                "GoogleVision": GoogleVisionEngine(),
            }

            # 엔진별 초기화
            initialized_engines = []
            for name, engine in self.engines.items():
                success = await engine.initialize()
                if success:
                    initialized_engines.append(name)
                    logger.info("engine_initialized", engine=name)
                else:
                    logger.warning("engine_initialization_failed", engine=name)

            # 최소 1개 이상의 엔진이 초기화되어야 함
            if not initialized_engines:
                logger.error("no_engines_initialized")
                self.is_initialized = False
                return False

            self.is_initialized = True
            logger.info(
                "ocr_manager_initialized",
                engines=initialized_engines,
            )
            return True

        except Exception as e:
            logger.error("ocr_manager_initialization_failed", error=str(e))
            self.is_initialized = False
            return False

    async def process_image(
        self, image: Image.Image, lang: str = "kor", return_all_results: bool = False
    ) -> Dict[str, Any]:
        """
        이미지 OCR 처리 (다단계 파이프라인)

        Args:
            image: PIL Image 객체
            lang: 언어 코드 (기본값: 한국어)
            return_all_results: True일 경우 모든 엔진 결과 반환

        Returns:
            Dict[str, Any]: OCR 처리 결과
        """
        start_time = time.time()

        try:
            if not self.is_initialized:
                await self.initialize()

            if not self.is_initialized:
                return self._error_result("Manager not initialized", start_time)

            # 1. 이미지 전처리
            logger.info("preprocessing_image")
            preprocessed_image = self.preprocessor.preprocess(image)

            # 2. 다단계 OCR 처리
            all_results: List[Dict[str, Any]] = []
            best_result: Optional[Dict[str, Any]] = None

            for engine_name in self.config["engine_sequence"]:
                engine = self.engines.get(engine_name)

                if not engine or not engine.is_initialized:
                    logger.warning("engine_not_available", engine=engine_name)
                    continue

                # OCR 실행
                logger.info("running_ocr_engine", engine=engine_name)
                result = await engine.extract_text(preprocessed_image, lang)

                # 결과 저장
                all_results.append({"engine": engine_name, "result": result})

                # 신뢰도 평가
                should_continue = self.evaluator.should_try_next_engine(
                    result, engine_name
                )

                # 충분한 신뢰도이고 설정이 활성화되어 있으면 중단
                if (
                    not should_continue
                    and self.config["stop_on_sufficient_confidence"]
                ):
                    logger.info(
                        "stopping_ocr_sufficient_confidence",
                        engine=engine_name,
                        confidence=result.get("confidence"),
                    )
                    best_result = {
                        "engine": engine_name,
                        "result": result,
                        "score": self.evaluator.evaluate_result(result, engine_name),
                    }
                    break

            # 3. 최적 결과 선택 (중단하지 않았을 경우)
            if best_result is None:
                best_result = self.evaluator.select_best_result(all_results)

            # 4. 결과 반환
            processing_time = time.time() - start_time

            if best_result is None:
                return self._error_result("No valid OCR result", start_time)

            response = {
                "success": True,
                "text": best_result["result"].get("text", ""),
                "confidence": best_result["result"].get("confidence", 0.0),
                "adjusted_score": best_result.get("score", 0.0),
                "engine_used": best_result.get("engine", "Unknown"),
                "processing_time": round(processing_time, 3),
                "engines_tried": len(all_results),
            }

            # 모든 결과 포함 (요청 시)
            if return_all_results:
                response["all_results"] = all_results

            logger.info(
                "ocr_processing_completed",
                engine=response["engine_used"],
                confidence=response["confidence"],
                adjusted_score=response["adjusted_score"],
                processing_time=response["processing_time"],
            )

            return response

        except Exception as e:
            logger.error("ocr_processing_failed", error=str(e))
            return self._error_result(str(e), start_time)

    async def compare_engines(
        self, image: Image.Image, lang: str = "kor"
    ) -> Dict[str, Any]:
        """
        모든 엔진으로 OCR 수행 후 결과 비교

        Args:
            image: PIL Image 객체
            lang: 언어 코드

        Returns:
            Dict[str, Any]: 비교 결과
        """
        start_time = time.time()

        try:
            if not self.is_initialized:
                await self.initialize()

            # 이미지 전처리
            preprocessed_image = self.preprocessor.preprocess(image)

            # 모든 엔진으로 OCR 실행
            all_results = []

            for engine_name, engine in self.engines.items():
                if not engine.is_initialized:
                    logger.warning("engine_not_initialized", engine=engine_name)
                    continue

                logger.info("comparing_engine", engine=engine_name)
                result = await engine.extract_text(preprocessed_image, lang)

                all_results.append({"engine": engine_name, "result": result})

            # 결과 비교 분석
            comparison = self.evaluator.compare_results(all_results)

            processing_time = time.time() - start_time

            return {
                "success": True,
                "comparison": comparison,
                "processing_time": round(processing_time, 3),
                "engines_compared": len(all_results),
            }

        except Exception as e:
            logger.error("engine_comparison_failed", error=str(e))
            return self._error_result(str(e), start_time)

    def _error_result(self, error_message: str, start_time: float) -> Dict[str, Any]:
        """
        에러 결과 생성

        Args:
            error_message: 에러 메시지
            start_time: 시작 시간

        Returns:
            Dict[str, Any]: 에러 결과
        """
        processing_time = time.time() - start_time

        return {
            "success": False,
            "text": "",
            "confidence": 0.0,
            "adjusted_score": 0.0,
            "engine_used": None,
            "processing_time": round(processing_time, 3),
            "error": error_message,
        }

    def get_engine_info(self) -> Dict[str, Any]:
        """
        초기화된 엔진 정보 반환

        Returns:
            Dict[str, Any]: 엔진 정보
        """
        return {
            "initialized": self.is_initialized,
            "engines": {
                name: engine.get_engine_info()
                for name, engine in self.engines.items()
            },
            "config": self.config,
        }

    async def check_availability(self) -> Dict[str, bool]:
        """
        각 엔진의 사용 가능 여부 확인

        Returns:
            Dict[str, bool]: 엔진별 사용 가능 여부
        """
        availability = {}

        for name, engine in self.engines.items():
            availability[name] = await engine.check_availability()

        return availability

    def update_config(self, new_config: Dict[str, Any]) -> None:
        """
        매니저 설정 업데이트

        Args:
            new_config: 새로운 설정
        """
        self.config.update(new_config)

        # 하위 컴포넌트 설정도 업데이트
        if "preprocessing" in new_config:
            self.preprocessor.update_config(new_config["preprocessing"])

        if "confidence_evaluation" in new_config:
            self.evaluator.update_config(new_config["confidence_evaluation"])

        logger.info("ocr_manager_config_updated", config=self.config)
