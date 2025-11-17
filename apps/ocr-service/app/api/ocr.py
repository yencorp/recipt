"""OCR API 엔드포인트"""

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from typing import List, Optional
import uuid
import logging

from ..services.ocr_service import OCRService
from ..models.ocr_models import OCRJobResponse, OCRResultResponse

router = APIRouter()
logger = logging.getLogger(__name__)


# 의존성 주입을 위한 OCR 서비스 getter
async def get_ocr_service() -> OCRService:
    from ..main import ocr_service

    return ocr_service


@router.post("/process", response_model=OCRJobResponse)
async def process_receipts(
    files: List[UploadFile] = File(...),
    settlement_id: str = None,
    ocr_service: OCRService = Depends(get_ocr_service),
):
    """영수증 업로드 및 OCR 처리"""

    # 파일 수 제한 (최대 100개)
    if len(files) > 100:
        raise HTTPException(status_code=400, detail="최대 100개 파일까지 업로드 가능합니다.")

    # 파일 형식 검증
    allowed_extensions = {".jpg", ".jpeg", ".png", ".pdf", ".bmp", ".tiff"}
    for file in files:
        if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400, detail=f"지원되지 않는 파일 형식: {file.filename}"
            )

    try:
        job_id = str(uuid.uuid4())
        job = await ocr_service.process_receipts(files, job_id, settlement_id)

        return OCRJobResponse(
            job_id=job.id,
            status=job.status,
            total_files=job.total_files,
            processed_files=job.processed_files,
            message="OCR 처리가 시작되었습니다.",
        )

    except Exception as e:
        logger.error(f"OCR 처리 시작 실패: {e}")
        raise HTTPException(status_code=500, detail="OCR 처리를 시작할 수 없습니다.")


@router.get("/jobs/{job_id}", response_model=OCRResultResponse)
async def get_job_status(
    job_id: str, ocr_service: OCRService = Depends(get_ocr_service)
):
    """OCR 작업 상태 및 결과 조회"""

    job = await ocr_service.get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")

    return OCRResultResponse(
        job_id=job.id,
        status=job.status,
        total_files=job.total_files,
        processed_files=job.processed_files,
        success_files=job.success_files,
        failed_files=job.failed_files,
        results=job.results,
        error_message=job.error_message,
    )


@router.delete("/jobs/{job_id}")
async def cancel_job(job_id: str, ocr_service: OCRService = Depends(get_ocr_service)):
    """OCR 작업 취소"""

    job = await ocr_service.get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")

    # 작업 취소 로직 (실제로는 더 복잡한 구현 필요)
    return {"message": "작업이 취소되었습니다."}
