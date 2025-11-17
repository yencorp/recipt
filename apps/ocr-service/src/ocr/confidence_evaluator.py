"""
OCR 결과 신뢰도 평가 모듈
다양한 OCR 엔진 결과의 품질을 평가하고 최적의 결과를 선택
"""

from typing import Dict, Any, List, Optional
import re
import structlog

logger = structlog.get_logger()


class ConfidenceEvaluator:
    """
    OCR 결과 신뢰도 평가 클래스

    여러 OCR 엔진의 결과를 비교하고 가장 신뢰할 수 있는 결과를 선택
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        평가기 초기화

        Args:
            config: 평가 설정
        """
        self.config = config or self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """기본 평가 설정 반환"""
        return {
            "min_confidence_threshold": 0.6,  # 최소 신뢰도 임계값
            "min_text_length": 10,  # 최소 텍스트 길이
            "korean_pattern_bonus": 0.1,  # 한글 패턴 발견 시 보너스
            "number_pattern_bonus": 0.05,  # 숫자 패턴 발견 시 보너스
            "engine_weights": {
                # 엔진별 가중치 (기본 신뢰도)
                "Tesseract": 1.0,
                "EasyOCR": 1.1,  # EasyOCR이 일반적으로 더 정확
                "GoogleVision": 1.2,  # Google Vision이 가장 정확
            },
        }

    def evaluate_result(self, result: Dict[str, Any], engine_name: str) -> float:
        """
        단일 OCR 결과의 신뢰도 평가

        Args:
            result: OCR 결과 딕셔너리
            engine_name: 엔진 이름

        Returns:
            float: 조정된 신뢰도 (0.0-1.0)
        """
        try:
            base_confidence = result.get("confidence", 0.0)
            text = result.get("text", "")

            # 엔진별 가중치 적용
            engine_weight = self.config["engine_weights"].get(engine_name, 1.0)
            adjusted_confidence = base_confidence * engine_weight

            # 텍스트 길이 체크
            if len(text.strip()) < self.config["min_text_length"]:
                adjusted_confidence *= 0.5  # 텍스트가 너무 짧으면 신뢰도 감소
                logger.debug(
                    "confidence_penalty_short_text",
                    engine=engine_name,
                    text_length=len(text),
                )

            # 패턴 기반 보너스
            pattern_bonus = self._calculate_pattern_bonus(text)
            adjusted_confidence = min(1.0, adjusted_confidence + pattern_bonus)

            logger.debug(
                "confidence_evaluated",
                engine=engine_name,
                base=base_confidence,
                adjusted=adjusted_confidence,
                pattern_bonus=pattern_bonus,
            )

            return round(adjusted_confidence, 3)

        except Exception as e:
            logger.error(
                "confidence_evaluation_failed", engine=engine_name, error=str(e)
            )
            return 0.0

    def _calculate_pattern_bonus(self, text: str) -> float:
        """
        텍스트 패턴에 따른 신뢰도 보너스 계산

        Args:
            text: OCR 추출 텍스트

        Returns:
            float: 보너스 점수
        """
        bonus = 0.0

        # 한글 패턴 체크 (영수증에 한글이 많이 포함됨)
        korean_pattern = re.compile(r"[가-힣]+")
        korean_matches = korean_pattern.findall(text)
        if korean_matches and len("".join(korean_matches)) > 5:
            bonus += self.config["korean_pattern_bonus"]

        # 숫자 패턴 체크 (영수증에 금액, 날짜 등 숫자 많음)
        number_pattern = re.compile(r"\d+")
        number_matches = number_pattern.findall(text)
        if len(number_matches) >= 3:  # 최소 3개 이상의 숫자
            bonus += self.config["number_pattern_bonus"]

        # 금액 패턴 체크 (원 단위)
        amount_pattern = re.compile(r"[\d,]+\s*원")
        if amount_pattern.search(text):
            bonus += 0.05

        # 날짜 패턴 체크
        date_pattern = re.compile(r"\d{4}[/-]\d{1,2}[/-]\d{1,2}")
        if date_pattern.search(text):
            bonus += 0.05

        return bonus

    def select_best_result(
        self, results: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        여러 OCR 결과 중 가장 좋은 결과 선택

        Args:
            results: OCR 결과 리스트 (각 결과는 'engine', 'result' 키 포함)

        Returns:
            Optional[Dict[str, Any]]: 최적의 결과 또는 None
        """
        if not results:
            logger.warning("no_results_to_evaluate")
            return None

        best_result = None
        best_score = 0.0

        for item in results:
            engine_name = item.get("engine", "Unknown")
            result = item.get("result", {})

            # 결과 평가
            score = self.evaluate_result(result, engine_name)

            logger.debug(
                "result_scored",
                engine=engine_name,
                score=score,
                text_length=len(result.get("text", "")),
            )

            # 최적 결과 업데이트
            if score > best_score:
                best_score = score
                best_result = {
                    "engine": engine_name,
                    "result": result,
                    "score": score,
                }

        # 최소 임계값 체크
        if best_score < self.config["min_confidence_threshold"]:
            logger.warning(
                "best_result_below_threshold",
                best_score=best_score,
                threshold=self.config["min_confidence_threshold"],
            )

        if best_result:
            logger.info(
                "best_result_selected",
                engine=best_result["engine"],
                score=best_result["score"],
            )

        return best_result

    def compare_results(
        self, results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        여러 OCR 결과 비교 분석

        Args:
            results: OCR 결과 리스트

        Returns:
            Dict[str, Any]: 비교 분석 결과
        """
        if not results:
            return {"comparison": [], "best": None, "consensus": None}

        comparison = []

        for item in results:
            engine_name = item.get("engine", "Unknown")
            result = item.get("result", {})
            score = self.evaluate_result(result, engine_name)

            comparison.append(
                {
                    "engine": engine_name,
                    "confidence": result.get("confidence", 0.0),
                    "adjusted_score": score,
                    "text_length": len(result.get("text", "")),
                    "text_preview": result.get("text", "")[:100],
                }
            )

        # 점수순 정렬
        comparison.sort(key=lambda x: x["adjusted_score"], reverse=True)

        # 최적 결과
        best = comparison[0] if comparison else None

        # 합의 체크 (두 개 이상의 엔진이 비슷한 텍스트를 추출했는지)
        consensus = self._check_consensus(results)

        return {
            "comparison": comparison,
            "best": best,
            "consensus": consensus,
        }

    def _check_consensus(self, results: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        여러 엔진 간 합의 여부 체크

        Args:
            results: OCR 결과 리스트

        Returns:
            Optional[Dict[str, Any]]: 합의 정보 또는 None
        """
        if len(results) < 2:
            return None

        # 텍스트 길이 비교 (비슷한 길이면 합의 가능성 높음)
        text_lengths = [
            len(item.get("result", {}).get("text", "")) for item in results
        ]
        avg_length = sum(text_lengths) / len(text_lengths)

        # 길이 편차 계산
        length_variance = sum((l - avg_length) ** 2 for l in text_lengths) / len(
            text_lengths
        )

        # 편차가 작으면 합의로 간주
        if length_variance < (avg_length * 0.1):  # 10% 이내 편차
            return {
                "has_consensus": True,
                "avg_text_length": int(avg_length),
                "variance": round(length_variance, 2),
            }
        else:
            return {
                "has_consensus": False,
                "avg_text_length": int(avg_length),
                "variance": round(length_variance, 2),
            }

    def should_try_next_engine(
        self, current_result: Dict[str, Any], current_engine: str
    ) -> bool:
        """
        다음 OCR 엔진을 시도해야 하는지 판단

        Args:
            current_result: 현재 OCR 결과
            current_engine: 현재 엔진 이름

        Returns:
            bool: 다음 엔진 시도 필요 여부
        """
        score = self.evaluate_result(current_result, current_engine)

        # 신뢰도가 임계값 이상이면 다음 엔진 불필요
        if score >= self.config["min_confidence_threshold"]:
            logger.info(
                "ocr_confidence_sufficient",
                engine=current_engine,
                score=score,
            )
            return False

        # 신뢰도가 낮으면 다음 엔진 시도
        logger.info(
            "ocr_confidence_insufficient",
            engine=current_engine,
            score=score,
            threshold=self.config["min_confidence_threshold"],
        )
        return True

    def get_config(self) -> Dict[str, Any]:
        """현재 평가 설정 반환"""
        return self.config.copy()

    def update_config(self, new_config: Dict[str, Any]) -> None:
        """
        평가 설정 업데이트

        Args:
            new_config: 새로운 설정
        """
        self.config.update(new_config)
        logger.info("confidence_evaluator_config_updated", config=self.config)
