"""영수증 텍스트 파싱"""

import re
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


class ReceiptParser:
    """영수증 텍스트 파싱기"""

    def __init__(self):
        # 날짜 패턴
        self.date_patterns = [
            r"(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})",
            r"(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일",
            r"(\d{2})[-/.](\d{1,2})[-/.](\d{1,2})",
        ]

        # 금액 패턴
        self.amount_patterns = [
            r"(\d{1,3}(?:,\d{3})+)\s*원",
            r"(합계|총액|결제|금액|총계|지불)\s*[:：]?\s*([\d,]+)\s*원?",
            r"(\d{1,3}(?:,\d{3})+)",
        ]

        # 전화번호 패턴
        self.phone_patterns = [
            r"(\d{2,3})[-.]?(\d{3,4})[-.]?(\d{4})",
        ]

        # 사업자번호 패턴
        self.business_number_patterns = [
            r"(\d{3})[-.]?(\d{2})[-.]?(\d{5})",
        ]

    async def parse_receipt_text(self, text: str) -> Dict[str, Any]:
        """영수증 텍스트를 파싱하여 구조화된 데이터로 변환"""
        try:
            lines = text.split("\n")

            # 각 필드 추출
            receipt_data = {
                "receipt_date": self._extract_date(text),
                "merchant_name": self._extract_merchant_name(lines),
                "total_amount": self._extract_total_amount(text),
                "business_number": self._extract_business_number(text),
                "payment_method": self._extract_payment_method(text),
                "items": self._extract_items(lines),
            }

            logger.debug("receipt_parsed", data=receipt_data)
            return receipt_data

        except Exception as e:
            logger.error(f"영수증 파싱 실패: {e}")
            return {}

    def _extract_date(self, text: str) -> Optional[str]:
        """날짜 추출"""
        for pattern in self.date_patterns:
            match = re.search(pattern, text)
            if match:
                groups = match.groups()
                if len(groups) == 3:
                    year, month, day = groups
                    # 2자리 연도를 4자리로 변환
                    if len(year) == 2:
                        year = "20" + year
                    return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        return None

    def _extract_merchant_name(self, lines: List[str]) -> Optional[str]:
        """상호명 추출 (보통 첫 줄)"""
        if lines:
            # 첫 3줄 중 가장 긴 줄을 상호명으로 추정
            candidates = [line.strip() for line in lines[:3] if line.strip()]
            if candidates:
                return max(candidates, key=len)
        return None

    def _extract_total_amount(self, text: str) -> Optional[float]:
        """총액 추출"""
        amounts = []

        for pattern in self.amount_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                if isinstance(match, tuple):
                    # '합계 10,000' 형태
                    amount_str = match[-1]
                else:
                    amount_str = match

                # 쉼표 제거 후 숫자로 변환
                try:
                    amount = float(amount_str.replace(",", ""))
                    amounts.append(amount)
                except ValueError:
                    continue

        # 가장 큰 금액을 총액으로 추정
        return max(amounts) if amounts else None

    def _extract_business_number(self, text: str) -> Optional[str]:
        """사업자번호 추출"""
        for pattern in self.business_number_patterns:
            match = re.search(pattern, text)
            if match:
                return "-".join(match.groups())
        return None

    def _extract_payment_method(self, text: str) -> Optional[str]:
        """결제 방법 추출"""
        payment_keywords = {
            "신용카드": ["신용카드", "카드", "CARD"],
            "현금": ["현금", "CASH"],
            "계좌이체": ["계좌이체", "이체"],
        }

        text_upper = text.upper()
        for method, keywords in payment_keywords.items():
            for keyword in keywords:
                if keyword.upper() in text_upper:
                    return method

        return None

    def _extract_items(self, lines: List[str]) -> List[Dict[str, Any]]:
        """항목 추출 (상품명, 단가, 수량)"""
        items = []

        # 항목 패턴: 상품명 + 금액
        item_pattern = r"(.+?)\s+([\d,]+)\s*원?"

        for line in lines:
            match = re.match(item_pattern, line.strip())
            if match:
                name, price_str = match.groups()

                # 상품명이 너무 짧거나, 키워드만 있는 경우 제외
                if len(name.strip()) < 2:
                    continue

                skip_keywords = [
                    "합계",
                    "총액",
                    "받은금액",
                    "거스름돈",
                    "부가세",
                    "부가가치세",
                ]
                if any(keyword in name for keyword in skip_keywords):
                    continue

                try:
                    price = float(price_str.replace(",", ""))
                    items.append({"name": name.strip(), "price": price, "quantity": 1})
                except ValueError:
                    continue

        return items
