"""
한국어 텍스트 처리 모듈
OCR 추출 한글 텍스트의 품질 개선
"""

import re
from typing import Optional
import structlog

logger = structlog.get_logger()


class KoreanProcessor:
    """
    한국어 텍스트 처리기

    OCR로 추출된 한글 텍스트의 띄어쓰기 교정 및 정규화
    """

    def __init__(self):
        """한국어 처리기 초기화"""
        self.spacing_model = None
        self._try_load_spacing_model()

    def _try_load_spacing_model(self) -> None:
        """
        PyKoSpacing 모델 로드 시도

        Note: PyKoSpacing은 선택적 의존성
        """
        try:
            from pykospacing import Spacing

            self.spacing_model = Spacing()
            logger.info("pykospacing_model_loaded")

        except ImportError:
            logger.warning(
                "pykospacing_not_available",
                message="PyKoSpacing이 설치되지 않았습니다. 띄어쓰기 교정 기능이 비활성화됩니다.",
            )
            self.spacing_model = None

        except Exception as e:
            logger.error("pykospacing_load_failed", error=str(e))
            self.spacing_model = None

    def process(self, text: str, apply_spacing: bool = True) -> str:
        """
        한국어 텍스트 처리

        Args:
            text: 원본 텍스트
            apply_spacing: 띄어쓰기 교정 적용 여부

        Returns:
            str: 처리된 텍스트
        """
        if not text:
            return text

        try:
            logger.debug("processing_korean_text", length=len(text))

            # 1. 텍스트 정규화
            processed_text = self._normalize_text(text)

            # 2. 불완전한 한글 문자 제거 (자음/모음만 있는 문자)
            processed_text = self._remove_incomplete_korean(processed_text)

            # 3. 띄어쓰기 교정 (PyKoSpacing 사용)
            if apply_spacing and self.spacing_model is not None:
                processed_text = self._apply_spacing(processed_text)

            # 4. 중복 공백 제거
            processed_text = self._clean_whitespace(processed_text)

            logger.debug(
                "korean_processing_completed",
                original_length=len(text),
                processed_length=len(processed_text),
            )

            return processed_text

        except Exception as e:
            logger.error("korean_processing_failed", error=str(e))
            return text  # 실패 시 원본 반환

    def _normalize_text(self, text: str) -> str:
        """
        텍스트 정규화

        Args:
            text: 원본 텍스트

        Returns:
            str: 정규화된 텍스트
        """
        # 전각 문자를 반각 문자로 변환
        text = self._convert_fullwidth_to_halfwidth(text)

        # 특수문자 정리
        # OCR 오류로 생긴 이상한 문자 제거
        text = re.sub(r"[​‌‍]", "", text)  # Zero-width 문자 제거

        # 연속된 특수문자 정리
        text = re.sub(r"[-_]{3,}", "-", text)  # 연속된 하이픈/언더스코어
        text = re.sub(r"[=]{3,}", "=", text)  # 연속된 등호

        return text

    def _convert_fullwidth_to_halfwidth(self, text: str) -> str:
        """
        전각 문자를 반각 문자로 변환

        Args:
            text: 원본 텍스트

        Returns:
            str: 변환된 텍스트
        """
        # 전각 숫자를 반각 숫자로
        fullwidth_numbers = "０１２３４５６７８９"
        halfwidth_numbers = "0123456789"
        trans_table = str.maketrans(fullwidth_numbers, halfwidth_numbers)
        text = text.translate(trans_table)

        # 전각 알파벳을 반각 알파벳으로
        fullwidth_alpha = "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ"
        halfwidth_alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        trans_table = str.maketrans(fullwidth_alpha, halfwidth_alpha)
        text = text.translate(trans_table)

        return text

    def _remove_incomplete_korean(self, text: str) -> str:
        """
        불완전한 한글 문자 제거

        OCR 오류로 생긴 자음/모음만 있는 문자 제거

        Args:
            text: 원본 텍스트

        Returns:
            str: 정리된 텍스트
        """
        # 단독 자음 제거 (ㄱ-ㅎ)
        text = re.sub(r"[ㄱ-ㅎ](?![ㄱ-ㅎㅏ-ㅣ가-힣])", "", text)

        # 단독 모음 제거 (ㅏ-ㅣ)
        text = re.sub(r"[ㅏ-ㅣ](?![ㄱ-ㅎㅏ-ㅣ가-힣])", "", text)

        return text

    def _apply_spacing(self, text: str) -> str:
        """
        띄어쓰기 교정 적용 (PyKoSpacing)

        Args:
            text: 원본 텍스트

        Returns:
            str: 띄어쓰기가 교정된 텍스트
        """
        if self.spacing_model is None:
            return text

        try:
            # 줄 단위로 처리 (모델 성능 향상)
            lines = text.split("\n")
            processed_lines = []

            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # 한글이 포함된 줄만 처리
                if re.search(r"[가-힣]", line):
                    try:
                        # PyKoSpacing 적용
                        spaced_line = self.spacing_model(line)
                        processed_lines.append(spaced_line)
                    except Exception as e:
                        logger.debug("spacing_failed_for_line", error=str(e))
                        processed_lines.append(line)  # 실패 시 원본 사용
                else:
                    processed_lines.append(line)

            return "\n".join(processed_lines)

        except Exception as e:
            logger.warning("spacing_application_failed", error=str(e))
            return text  # 실패 시 원본 반환

    def _clean_whitespace(self, text: str) -> str:
        """
        공백 정리

        Args:
            text: 원본 텍스트

        Returns:
            str: 공백이 정리된 텍스트
        """
        # 중복 공백을 단일 공백으로
        text = re.sub(r" {2,}", " ", text)

        # 줄바꿈 주변 공백 제거
        text = re.sub(r" *\n *", "\n", text)

        # 연속된 줄바꿈 정리 (최대 2개)
        text = re.sub(r"\n{3,}", "\n\n", text)

        # 앞뒤 공백 제거
        text = text.strip()

        return text

    def correct_common_errors(self, text: str) -> str:
        """
        흔한 OCR 오류 교정

        Args:
            text: 원본 텍스트

        Returns:
            str: 오류가 교정된 텍스트
        """
        corrections = {
            # 숫자 오인
            "o": "0",  # 알파벳 o를 숫자 0으로
            "O": "0",  # 알파벳 O를 숫자 0으로
            "l": "1",  # 알파벳 l을 숫자 1로 (맥락에 따라)
            "I": "1",  # 알파벳 I를 숫자 1로 (맥락에 따라)
            # 한글 오인
            "숫": "숫자",
            "갈": "각",
        }

        # 금액 패턴에서만 적용 (맥락 고려)
        # 예: "1o,ooo원" → "10,000원"
        def replace_in_amount(match):
            amount = match.group(0)
            for wrong, correct in corrections.items():
                if wrong in ["o", "O", "l", "I"]:  # 숫자 관련만
                    amount = amount.replace(wrong, correct)
            return amount

        # 금액 패턴 찾기 및 교정
        text = re.sub(r"[\d,oOlI]+\s*원", replace_in_amount, text)

        return text

    def extract_korean_words(self, text: str) -> list:
        """
        텍스트에서 한글 단어 추출

        Args:
            text: 원본 텍스트

        Returns:
            list: 한글 단어 리스트
        """
        # 한글 단어 패턴 (2자 이상)
        korean_words = re.findall(r"[가-힣]{2,}", text)

        return korean_words

    def is_korean_text(self, text: str, threshold: float = 0.3) -> bool:
        """
        텍스트가 한글 텍스트인지 판단

        Args:
            text: 텍스트
            threshold: 한글 비율 임계값 (0.0-1.0)

        Returns:
            bool: 한글 텍스트 여부
        """
        if not text:
            return False

        # 공백 제외
        text_no_space = text.replace(" ", "").replace("\n", "")

        if not text_no_space:
            return False

        # 한글 문자 개수
        korean_chars = len(re.findall(r"[가-힣]", text_no_space))

        # 한글 비율 계산
        korean_ratio = korean_chars / len(text_no_space)

        return korean_ratio >= threshold

    def get_model_status(self) -> dict:
        """
        모델 상태 반환

        Returns:
            dict: 모델 상태 정보
        """
        return {
            "spacing_model_loaded": self.spacing_model is not None,
            "spacing_available": self.spacing_model is not None,
        }
