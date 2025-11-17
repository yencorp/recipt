"""
API 요청/응답 스키마
"""

from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class OCRRequest(BaseModel):
    """OCR 처리 요청"""

    lang: str = Field(default="kor", description="언어 코드 (kor, eng 등)")
    return_all_results: bool = Field(
        default=False, description="모든 엔진 결과 반환 여부"
    )
    apply_korean_processing: bool = Field(
        default=True, description="한글 텍스트 처리 적용 여부"
    )


class OCRResult(BaseModel):
    """OCR 처리 결과"""

    success: bool = Field(description="처리 성공 여부")
    text: str = Field(description="추출된 텍스트")
    confidence: float = Field(description="신뢰도 (0.0-1.0)")
    adjusted_score: float = Field(description="조정된 신뢰도 점수")
    engine_used: Optional[str] = Field(description="사용된 OCR 엔진")
    processing_time: float = Field(description="처리 시간(초)")
    engines_tried: int = Field(description="시도한 엔진 수")
    structured_data: Optional[Dict[str, Any]] = Field(
        None, description="구조화된 영수증 데이터"
    )
    all_results: Optional[List[Dict[str, Any]]] = Field(
        None, description="모든 엔진 결과 (요청 시)"
    )
    error: Optional[str] = Field(None, description="에러 메시지")


class BatchOCRResult(BaseModel):
    """일괄 OCR 처리 결과"""

    batch_results: List[Dict[str, Any]] = Field(description="각 파일별 결과")
    total_files: int = Field(description="전체 파일 수")
    successful: int = Field(description="성공한 파일 수")
    failed: int = Field(description="실패한 파일 수")
    total_processing_time: float = Field(description="총 처리 시간(초)")


class OCREngineInfo(BaseModel):
    """OCR 엔진 정보"""

    initialized: bool = Field(description="초기화 여부")
    engines: Dict[str, Dict[str, Any]] = Field(description="엔진별 정보")
    config: Dict[str, Any] = Field(description="매니저 설정")


class OCREngineAvailability(BaseModel):
    """OCR 엔진 사용 가능 여부"""

    engines: Dict[str, bool] = Field(description="엔진별 사용 가능 여부")
