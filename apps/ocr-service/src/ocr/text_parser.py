"""
텍스트 파싱 모듈
OCR 추출 텍스트에서 구조화된 데이터 추출
"""

import re
from typing import Dict, Any, Optional, List
from datetime import datetime
import structlog

from ..patterns.receipt_patterns import ReceiptPatterns

logger = structlog.get_logger()


class TextParser:
    """
    텍스트 파서

    OCR로 추출된 텍스트를 분석하여 영수증 데이터 구조화
    """

    def __init__(self):
        """텍스트 파서 초기화"""
        self.patterns = ReceiptPatterns()
        self.compiled_patterns = self.patterns.compile_patterns()

    def parse(self, text: str) -> Dict[str, Any]:
        """
        텍스트 파싱하여 구조화된 데이터 추출

        Args:
            text: OCR 추출 텍스트

        Returns:
            Dict[str, Any]: 구조화된 영수증 데이터
        """
        try:
            logger.info("parsing_text", text_length=len(text))

            structured_data = {
                "store_name": None,
                "business_number": None,
                "address": None,
                "phone": None,
                "date": None,
                "time": None,
                "items": [],
                "subtotal": None,
                "discount": None,
                "tax": None,
                "total_amount": None,
                "payment_method": None,
                "card_info": {},
                "raw_text": text,
            }

            lines = text.split("\n")

            # 1. 상호명 추출
            structured_data["store_name"] = self._extract_store_name(lines)

            # 2. 사업자등록번호 추출
            structured_data["business_number"] = self._extract_business_number(text)

            # 3. 주소 추출
            structured_data["address"] = self._extract_address(text)

            # 4. 전화번호 추출
            structured_data["phone"] = self._extract_phone(text)

            # 5. 날짜 추출
            structured_data["date"] = self._extract_date(text)

            # 6. 시간 추출
            structured_data["time"] = self._extract_time(text)

            # 7. 항목 추출
            structured_data["items"] = self._extract_items(lines)

            # 8. 금액 정보 추출
            amounts = self._extract_amounts(text, lines)
            structured_data.update(amounts)

            # 9. 결제 방법 추출
            structured_data["payment_method"] = self._extract_payment_method(text)

            # 10. 카드 정보 추출
            if structured_data["payment_method"] in ["card", "신용카드", "체크카드"]:
                structured_data["card_info"] = self._extract_card_info(text)

            # None 값 제거
            structured_data = {k: v for k, v in structured_data.items() if v is not None and v != {} and v != []}

            logger.info(
                "parsing_completed",
                extracted_fields=len(structured_data),
                has_total=structured_data.get("total_amount") is not None,
            )

            return structured_data

        except Exception as e:
            logger.error("parsing_failed", error=str(e))
            return {"raw_text": text, "error": str(e)}

    def _extract_store_name(self, lines: List[str]) -> Optional[str]:
        """
        상호명 추출

        Args:
            lines: 텍스트 라인 리스트

        Returns:
            Optional[str]: 추출된 상호명
        """
        # 1. 키워드로 검색
        pattern = self.patterns.get_store_name_pattern()
        for line in lines:
            match = pattern.search(line)
            if match:
                store_name = match.group(2).strip()
                logger.debug("store_name_found_by_keyword", name=store_name)
                return store_name

        # 2. 첫 번째 줄에서 추출 (보통 상호명이 첫 줄에 옴)
        for line in lines[:5]:  # 상위 5줄 검사
            line = line.strip()
            if self.patterns.is_likely_store_name(line):
                logger.debug("store_name_found_by_heuristic", name=line)
                return line

        logger.debug("store_name_not_found")
        return None

    def _extract_business_number(self, text: str) -> Optional[str]:
        """
        사업자등록번호 추출

        Args:
            text: 전체 텍스트

        Returns:
            Optional[str]: 추출된 사업자등록번호
        """
        for pattern in self.compiled_patterns["business_number"]:
            match = pattern.search(text)
            if match:
                # 하이픈 포함 형식으로 반환
                if len(match.groups()) == 3:
                    number = f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
                else:
                    number = match.group(1)
                    # 10자리 숫자면 하이픈 추가
                    if len(number) == 10:
                        number = f"{number[:3]}-{number[3:5]}-{number[5:]}"

                logger.debug("business_number_found", number=number)
                return number

        logger.debug("business_number_not_found")
        return None

    def _extract_address(self, text: str) -> Optional[str]:
        """
        주소 추출

        Args:
            text: 전체 텍스트

        Returns:
            Optional[str]: 추출된 주소
        """
        for pattern in self.compiled_patterns["address"]:
            match = pattern.search(text)
            if match:
                address = " ".join(match.groups())
                logger.debug("address_found", address=address)
                return address

        logger.debug("address_not_found")
        return None

    def _extract_phone(self, text: str) -> Optional[str]:
        """
        전화번호 추출

        Args:
            text: 전체 텍스트

        Returns:
            Optional[str]: 추출된 전화번호
        """
        for pattern in self.compiled_patterns["phone"]:
            match = pattern.search(text)
            if match:
                # 하이픈 포함 형식으로 반환
                phone = "-".join(match.groups())
                logger.debug("phone_found", phone=phone)
                return phone

        logger.debug("phone_not_found")
        return None

    def _extract_date(self, text: str) -> Optional[str]:
        """
        날짜 추출

        Args:
            text: 전체 텍스트

        Returns:
            Optional[str]: 추출된 날짜 (YYYY-MM-DD 형식)
        """
        for pattern in self.compiled_patterns["date"]:
            match = pattern.search(text)
            if match:
                groups = match.groups()
                try:
                    # 다양한 형식 처리
                    if len(groups) == 3:
                        year, month, day = groups

                        # 2자리 연도를 4자리로 변환
                        if len(year) == 2:
                            year = f"20{year}"

                        # 날짜 검증 및 형식화
                        date_obj = datetime(int(year), int(month), int(day))
                        formatted_date = date_obj.strftime("%Y-%m-%d")

                        logger.debug("date_found", date=formatted_date)
                        return formatted_date

                except (ValueError, IndexError) as e:
                    logger.debug("date_parsing_failed", error=str(e))
                    continue

        logger.debug("date_not_found")
        return None

    def _extract_time(self, text: str) -> Optional[str]:
        """
        시간 추출

        Args:
            text: 전체 텍스트

        Returns:
            Optional[str]: 추출된 시간 (HH:MM 형식)
        """
        for pattern in self.compiled_patterns["time"]:
            match = pattern.search(text)
            if match:
                groups = match.groups()

                # 오전/오후 포함 형식
                if len(groups) == 3 and groups[0] in ["오전", "오후"]:
                    meridiem, hour, minute = groups
                    hour = int(hour)
                    if meridiem == "오후" and hour < 12:
                        hour += 12
                    elif meridiem == "오전" and hour == 12:
                        hour = 0
                    time_str = f"{hour:02d}:{minute}"
                # HH:MM 또는 HH:MM:SS 형식
                elif len(groups) >= 2:
                    time_str = f"{int(groups[0]):02d}:{groups[1]}"

                    logger.debug("time_found", time=time_str)
                    return time_str

        logger.debug("time_not_found")
        return None

    def _extract_items(self, lines: List[str]) -> List[Dict[str, Any]]:
        """
        구매 항목 추출

        Args:
            lines: 텍스트 라인 리스트

        Returns:
            List[Dict[str, Any]]: 추출된 항목 리스트
        """
        items = []

        for pattern in self.compiled_patterns["item"]:
            for line in lines:
                match = pattern.search(line)
                if match:
                    groups = match.groups()

                    # 항목명 + 수량 + 금액 형식
                    if len(groups) == 3:
                        item = {
                            "name": groups[0].strip(),
                            "quantity": int(groups[1]),
                            "price": int(groups[2].replace(",", "")),
                        }
                    # 항목명 + 금액 형식
                    elif len(groups) == 2:
                        item = {
                            "name": groups[0].strip(),
                            "quantity": 1,
                            "price": int(groups[1].replace(",", "")),
                        }
                    else:
                        continue

                    items.append(item)
                    logger.debug("item_found", item=item)

        return items

    def _extract_amounts(self, text: str, lines: List[str]) -> Dict[str, Optional[int]]:
        """
        금액 정보 추출 (총액, 할인, 세금 등)

        Args:
            text: 전체 텍스트
            lines: 텍스트 라인 리스트

        Returns:
            Dict[str, Optional[int]]: 금액 정보
        """
        amounts = {
            "subtotal": None,
            "discount": None,
            "tax": None,
            "total_amount": None,
        }

        # 1. 총액 추출 (키워드 기반)
        total_pattern = self.patterns.get_total_amount_pattern()
        match = total_pattern.search(text)
        if match:
            amount_str = match.group(2).replace(",", "")
            amounts["total_amount"] = int(amount_str)
            logger.debug("total_amount_found", amount=amounts["total_amount"])

        # 2. 총액을 못 찾았을 경우, 가장 큰 금액을 총액으로 간주
        if amounts["total_amount"] is None:
            all_amounts = []
            for pattern in self.compiled_patterns["amount"]:
                for match in pattern.finditer(text):
                    try:
                        # 마지막 그룹이 금액
                        amount_str = match.groups()[-1].replace(",", "")
                        all_amounts.append(int(amount_str))
                    except (ValueError, IndexError):
                        continue

            if all_amounts:
                amounts["total_amount"] = max(all_amounts)
                logger.debug(
                    "total_amount_inferred_from_max",
                    amount=amounts["total_amount"],
                )

        # 3. 할인 금액 추출
        for pattern in self.compiled_patterns["discount"]:
            match = pattern.search(text)
            if match:
                amounts["discount"] = int(match.group(1).replace(",", ""))
                logger.debug("discount_found", amount=amounts["discount"])
                break

        # 4. 세금 금액 추출
        for pattern in self.compiled_patterns["tax"]:
            match = pattern.search(text)
            if match:
                amounts["tax"] = int(match.group(1).replace(",", ""))
                logger.debug("tax_found", amount=amounts["tax"])
                break

        return amounts

    def _extract_payment_method(self, text: str) -> Optional[str]:
        """
        결제 방법 추출

        Args:
            text: 전체 텍스트

        Returns:
            Optional[str]: 결제 방법
        """
        for method, keywords in self.patterns.PAYMENT_METHOD_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    logger.debug("payment_method_found", method=method)
                    return method

        logger.debug("payment_method_not_found")
        return None

    def _extract_card_info(self, text: str) -> Dict[str, Optional[str]]:
        """
        카드 정보 추출

        Args:
            text: 전체 텍스트

        Returns:
            Dict[str, Optional[str]]: 카드 정보
        """
        card_info = {
            "card_number": None,
            "card_type": None,
            "card_company": None,
        }

        # 카드 번호 (마스킹된)
        match = self.compiled_patterns["card_number"][0].search(text)
        if match:
            card_info["card_number"] = "-".join(match.groups())
            logger.debug("card_number_found", number=card_info["card_number"])

        # 카드 종류
        match = self.compiled_patterns["card_type"][0].search(text)
        if match:
            card_info["card_type"] = match.group(0)
            logger.debug("card_type_found", type=card_info["card_type"])

        # 카드사
        match = self.compiled_patterns["card_company"][0].search(text)
        if match:
            card_info["card_company"] = match.group(0)
            logger.debug("card_company_found", company=card_info["card_company"])

        return card_info
