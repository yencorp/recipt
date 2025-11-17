"""OCR 데이터 모델"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class ProcessingStatus(str, Enum):
    """OCR 작업 상태"""

    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"


class ReceiptData(BaseModel):
    """영수증 데이터"""

    receipt_date: Optional[str] = None
    merchant_name: Optional[str] = None
    total_amount: Optional[float] = None
    business_number: Optional[str] = None
    payment_method: Optional[str] = None
    items: List[Dict[str, Any]] = []


class OCRResult(BaseModel):
    """OCR 처리 결과"""

    filename: str
    success: bool
    confidence: float = 0.0
    engine_used: Optional[str] = None
    extracted_data: Optional[ReceiptData] = None
    processing_time: float = 0.0
    error: Optional[str] = None


class OCRJob(BaseModel):
    """OCR 작업"""

    id: str
    settlement_id: Optional[str] = None
    status: ProcessingStatus
    total_files: int
    processed_files: int = 0
    success_files: int = 0
    failed_files: int = 0
    results: List[OCRResult] = []
    error_message: Optional[str] = None
    created_at: datetime = datetime.now()


class OCRJobResponse(BaseModel):
    """OCR 작업 응답"""

    job_id: str
    status: ProcessingStatus
    total_files: int
    processed_files: int
    message: str


class OCRResultResponse(BaseModel):
    """OCR 결과 응답"""

    job_id: str
    status: ProcessingStatus
    total_files: int
    processed_files: int
    success_files: int
    failed_files: int
    results: List[OCRResult]
    error_message: Optional[str] = None
