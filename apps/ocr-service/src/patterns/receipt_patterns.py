"""
영수증 패턴 정의
정규표현식 기반 데이터 추출 패턴 모음
"""

import re
from typing import Dict, List


class ReceiptPatterns:
    """영수증 데이터 추출 패턴"""

    # ========== 날짜 패턴 ==========
    DATE_PATTERNS = [
        # YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
        r"(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})",
        # YY-MM-DD, YY/MM/DD, YY.MM.DD
        r"(\d{2})[-/.](\d{1,2})[-/.](\d{1,2})",
        # MM-DD-YYYY, MM/DD/YYYY
        r"(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})",
        # 한글 포함: 2024년 11월 17일
        r"(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일",
        # 한글 포함: 24년 11월 17일
        r"(\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일",
    ]

    # ========== 시간 패턴 ==========
    TIME_PATTERNS = [
        # HH:MM:SS
        r"(\d{1,2}):(\d{2}):(\d{2})",
        # HH:MM
        r"(\d{1,2}):(\d{2})",
        # 오전/오후 포함: 오후 3:45
        r"(오전|오후)\s*(\d{1,2}):(\d{2})",
    ]

    # ========== 금액 패턴 ==========
    AMOUNT_PATTERNS = [
        # 콤마 구분 금액 + 원: 12,345원
        r"(\d{1,3}(?:,\d{3})+)\s*원",
        # 일반 금액 + 원: 12345원
        r"(\d+)\s*원",
        # 콤마 구분 금액만: 12,345
        r"(\d{1,3}(?:,\d{3})+)",
        # 금액 키워드 뒤 숫자: 합계 12,345
        r"(합계|총액|결제|금액|총계|지불)\s*[:：]?\s*([\d,]+)\s*원?",
        # 달러 표시: $12.34
        r"\$\s*(\d+(?:\.\d{2})?)",
    ]

    # ========== 총액 관련 키워드 ==========
    TOTAL_AMOUNT_KEYWORDS = [
        "합계",
        "총액",
        "총계",
        "결제금액",
        "결제",
        "지불금액",
        "지불",
        "받을금액",
        "Grand Total",
        "Total",
        "Sum",
    ]

    # ========== 전화번호 패턴 ==========
    PHONE_PATTERNS = [
        # 하이픈 포함: 02-1234-5678, 010-1234-5678
        r"(\d{2,3})[-\s]?(\d{3,4})[-\s]?(\d{4})",
        # 괄호 포함: (02)1234-5678
        r"\((\d{2,3})\)\s*(\d{3,4})[-\s]?(\d{4})",
    ]

    # ========== 사업자등록번호 패턴 ==========
    BUSINESS_NUMBER_PATTERNS = [
        # 하이픈 포함: 123-45-67890
        r"(\d{3})[-\s]?(\d{2})[-\s]?(\d{5})",
        # 연속 숫자: 1234567890
        r"(\d{10})",
    ]

    # ========== 주소 패턴 ==========
    ADDRESS_PATTERNS = [
        # 도로명 주소
        r"([가-힣]+(?:시|도))\s+([가-힣]+(?:구|군))\s+([가-힣]+(?:로|길))\s+(\d+)",
        # 지번 주소
        r"([가-힣]+(?:시|도))\s+([가-힣]+(?:구|군))\s+([가-힣]+동)\s+(\d+(?:-\d+)?)",
    ]

    # ========== 이메일 패턴 ==========
    EMAIL_PATTERN = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

    # ========== 카드 관련 패턴 ==========
    CARD_PATTERNS = {
        "card_number": r"(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})",  # 마스킹된 카드번호
        "card_type": r"(신용|체크|기업|법인)\s*카드",
        "card_company": r"(삼성|현대|신한|KB|하나|우리|NH|롯데|BC|비씨|Master|Visa)",
    }

    # ========== 결제 방법 키워드 ==========
    PAYMENT_METHOD_KEYWORDS = {
        "card": ["카드", "신용카드", "체크카드", "Card"],
        "cash": ["현금", "Cash"],
        "transfer": ["계좌이체", "이체", "Transfer"],
        "point": ["포인트", "Point"],
        "mobile": ["간편결제", "페이", "Pay"],
    }

    # ========== 상품/항목 패턴 ==========
    ITEM_PATTERNS = [
        # 항목명 + 수량 + 금액: 콜라 2개 3,000원
        r"([가-힣a-zA-Z\s]+)\s+(\d+)\s*(?:개|EA|ea)\s+([\d,]+)\s*원?",
        # 항목명 + 금액: 콜라 1,500원
        r"([가-힣a-zA-Z\s]+)\s+([\d,]+)\s*원",
    ]

    # ========== 할인/부가세 패턴 ==========
    DISCOUNT_PATTERNS = [
        r"할인\s*[:：]?\s*([\d,]+)\s*원?",
        r"DC\s*[:：]?\s*([\d,]+)\s*원?",
        r"쿠폰\s*[:：]?\s*([\d,]+)\s*원?",
    ]

    TAX_PATTERNS = [
        r"부가세\s*[:：]?\s*([\d,]+)\s*원?",
        r"VAT\s*[:：]?\s*([\d,]+)\s*원?",
        r"세금\s*[:：]?\s*([\d,]+)\s*원?",
    ]

    # ========== 상호명 추출 키워드 ==========
    STORE_NAME_KEYWORDS = [
        "상호",
        "점포명",
        "매장명",
        "상호명",
        "가맹점",
        "업소명",
    ]

    # 상호명에 자주 포함되는 단어
    STORE_NAME_SUFFIXES = [
        "마트",
        "슈퍼",
        "편의점",
        "카페",
        "음식점",
        "식당",
        "주점",
        "약국",
        "병원",
        "의원",
        "한의원",
        "서점",
        "문구점",
        "점",
        "점포",
        "지점",
        "본점",
        "센터",
    ]

    @classmethod
    def compile_patterns(cls) -> Dict[str, List[re.Pattern]]:
        """
        모든 패턴을 컴파일하여 반환

        Returns:
            Dict[str, List[re.Pattern]]: 컴파일된 패턴들
        """
        return {
            "date": [re.compile(p) for p in cls.DATE_PATTERNS],
            "time": [re.compile(p) for p in cls.TIME_PATTERNS],
            "amount": [re.compile(p) for p in cls.AMOUNT_PATTERNS],
            "phone": [re.compile(p) for p in cls.PHONE_PATTERNS],
            "business_number": [re.compile(p) for p in cls.BUSINESS_NUMBER_PATTERNS],
            "address": [re.compile(p) for p in cls.ADDRESS_PATTERNS],
            "email": [re.compile(cls.EMAIL_PATTERN)],
            "card_number": [re.compile(cls.CARD_PATTERNS["card_number"])],
            "card_type": [re.compile(cls.CARD_PATTERNS["card_type"])],
            "card_company": [re.compile(cls.CARD_PATTERNS["card_company"])],
            "item": [re.compile(p) for p in cls.ITEM_PATTERNS],
            "discount": [re.compile(p) for p in cls.DISCOUNT_PATTERNS],
            "tax": [re.compile(p) for p in cls.TAX_PATTERNS],
        }

    @classmethod
    def get_total_amount_pattern(cls) -> re.Pattern:
        """
        총액 추출 패턴 생성

        Returns:
            re.Pattern: 총액 패턴
        """
        keywords = "|".join(cls.TOTAL_AMOUNT_KEYWORDS)
        pattern = f"({keywords})\s*[:：]?\s*([\d,]+)\s*원?"
        return re.compile(pattern, re.IGNORECASE)

    @classmethod
    def get_store_name_pattern(cls) -> re.Pattern:
        """
        상호명 추출 패턴 생성

        Returns:
            re.Pattern: 상호명 패턴
        """
        keywords = "|".join(cls.STORE_NAME_KEYWORDS)
        pattern = f"({keywords})\s*[:：]?\s*([가-힣a-zA-Z0-9\s]+)"
        return re.compile(pattern)

    @classmethod
    def is_likely_store_name(cls, text: str) -> bool:
        """
        텍스트가 상호명일 가능성 판단

        Args:
            text: 텍스트

        Returns:
            bool: 상호명 가능성
        """
        # 길이 체크 (2-30자)
        if len(text) < 2 or len(text) > 30:
            return False

        # 숫자만 있으면 제외
        if text.isdigit():
            return False

        # 상호명 접미사 포함 여부
        for suffix in cls.STORE_NAME_SUFFIXES:
            if suffix in text:
                return True

        # 한글+영문 조합 (일반적인 상호명 패턴)
        if re.search(r"[가-힣]", text) and re.search(r"[a-zA-Z]", text):
            return True

        # 한글만으로 구성된 경우 (2자 이상)
        if re.fullmatch(r"[가-힣\s]+", text) and len(text.replace(" ", "")) >= 2:
            return True

        return False
