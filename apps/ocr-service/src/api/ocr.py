"""
OCR API 라우터
영수증 이미지 텍스트 추출 API
"""

import time
import io
from typing import List
from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Form
from PIL import Image
import structlog

from .schemas import OCRRequest, OCRResult, BatchOCRResult, OCREngineInfo, OCREngineAvailability
from ..ocr.ocr_manager import OCRManager
from ..ocr.text_parser import TextParser
from ..ocr.korean_processor import KoreanProcessor
from ..utils.config import get_settings

logger = structlog.get_logger()
router = APIRouter(prefix="/api/ocr", tags=["OCR"])

# 설정 및 컴포넌트 초기화
settings = get_settings()
ocr_manager = OCRManager()
text_parser = TextParser()
korean_processor = KoreanProcessor()


async def log_ocr_processing(
    filename: str, success: bool, processing_time: float, engine_used: str = None
):
    """OCR 처리 로그를 기록하는 백그라운드 작업"""
    logger.info(
        "ocr_processing_logged",
        filename=filename,
        success=success,
        processing_time=processing_time,
        engine_used=engine_used,
    )


@router.post("/extract", response_model=OCRResult)
async def extract_text(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="영수증 이미지 파일"),
    lang: str = Form(default="kor", description="언어 코드"),
    return_all_results: bool = Form(default=False, description="모든 엔진 결과 반환"),
    apply_korean_processing: bool = Form(
        default=True, description="한글 텍스트 처리 적용"
    ),
):
    """
    영수증 이미지에서 텍스트 추출

    다단계 OCR 처리:
    1. 이미지 전처리 (자동 크로핑, 회전 보정, 노이즈 제거)
    2. OCR 엔진 순차 실행 (Tesseract → EasyOCR → Google Vision)
    3. 신뢰도 기반 최적 결과 선택
    4. 텍스트 파싱 및 구조화

    Args:
        file: 업로드할 영수증 이미지 (JPG, PNG 지원)
        lang: 언어 코드 (kor, eng 등)
        return_all_results: 모든 엔진 결과 반환 여부
        apply_korean_processing: 한글 텍스트 처리 적용 여부

    Returns:
        OCRResult: OCR 처리 결과
    """
    try:
        # 파일 검증
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="지원하지 않는 파일 형식입니다. JPG, PNG만 지원됩니다.",
            )

        if file.size and file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"파일 크기가 너무 큽니다. 최대 {settings.MAX_FILE_SIZE // (1024*1024)}MB까지 지원됩니다.",
            )

        # 파일 읽기 및 PIL Image 변환
        file_content = await file.read()
        image = Image.open(io.BytesIO(file_content))

        # OCR 처리
        logger.info("ocr_processing_started", filename=file.filename, lang=lang)
        ocr_result = await ocr_manager.process_image(
            image=image, lang=lang, return_all_results=return_all_results
        )

        if not ocr_result["success"]:
            raise HTTPException(
                status_code=500,
                detail=ocr_result.get("error", "OCR 처리에 실패했습니다."),
            )

        # 한글 텍스트 처리 (선택적)
        processed_text = ocr_result["text"]
        if apply_korean_processing and korean_processor.is_korean_text(processed_text):
            processed_text = korean_processor.process(processed_text)
            logger.debug(
                "korean_processing_applied",
                original_length=len(ocr_result["text"]),
                processed_length=len(processed_text),
            )

        # 텍스트 파싱 (구조화)
        structured_data = text_parser.parse(processed_text)

        # 백그라운드 작업 - 처리 로그 저장
        background_tasks.add_task(
            log_ocr_processing,
            filename=file.filename,
            success=True,
            processing_time=ocr_result["processing_time"],
            engine_used=ocr_result.get("engine_used"),
        )

        logger.info(
            "ocr_processing_completed",
            filename=file.filename,
            engine=ocr_result.get("engine_used"),
            confidence=ocr_result.get("confidence"),
            has_structured_data=len(structured_data) > 1,  # raw_text 제외
        )

        return OCRResult(
            success=True,
            text=processed_text,
            confidence=ocr_result["confidence"],
            adjusted_score=ocr_result["adjusted_score"],
            engine_used=ocr_result.get("engine_used"),
            processing_time=ocr_result["processing_time"],
            engines_tried=ocr_result.get("engines_tried", 0),
            structured_data=structured_data,
            all_results=ocr_result.get("all_results"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("ocr_processing_failed", filename=file.filename, error=str(e))
        raise HTTPException(
            status_code=500, detail=f"OCR 처리 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/batch", response_model=BatchOCRResult)
async def extract_text_batch(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="영수증 이미지 파일들"),
    lang: str = Form(default="kor", description="언어 코드"),
    apply_korean_processing: bool = Form(
        default=True, description="한글 텍스트 처리 적용"
    ),
):
    """
    여러 영수증 이미지에서 일괄 텍스트 추출

    Args:
        files: 업로드할 영수증 이미지들 (최대 100개)
        lang: 언어 코드
        apply_korean_processing: 한글 텍스트 처리 적용 여부

    Returns:
        BatchOCRResult: 일괄 처리 결과
    """
    max_batch = 100  # 최대 100개
    if len(files) > max_batch:
        raise HTTPException(
            status_code=400,
            detail=f"최대 {max_batch}개 파일까지 처리 가능합니다.",
        )

    start_time = time.time()
    results = []
    successful = 0
    failed = 0

    for file in files:
        try:
            # 파일 검증
            if not file.content_type.startswith("image/"):
                results.append(
                    {
                        "filename": file.filename,
                        "success": False,
                        "error": "지원하지 않는 파일 형식",
                    }
                )
                failed += 1
                continue

            # 파일 읽기 및 PIL Image 변환
            file_content = await file.read()
            image = Image.open(io.BytesIO(file_content))

            # OCR 처리
            ocr_result = await ocr_manager.process_image(image=image, lang=lang)

            if ocr_result["success"]:
                # 한글 텍스트 처리
                processed_text = ocr_result["text"]
                if apply_korean_processing and korean_processor.is_korean_text(
                    processed_text
                ):
                    processed_text = korean_processor.process(processed_text)

                # 텍스트 파싱
                structured_data = text_parser.parse(processed_text)

                results.append(
                    {
                        "filename": file.filename,
                        "success": True,
                        "text": processed_text,
                        "confidence": ocr_result["confidence"],
                        "engine_used": ocr_result.get("engine_used"),
                        "processing_time": ocr_result["processing_time"],
                        "structured_data": structured_data,
                    }
                )
                successful += 1
            else:
                results.append(
                    {
                        "filename": file.filename,
                        "success": False,
                        "error": ocr_result.get("error", "OCR 처리 실패"),
                    }
                )
                failed += 1

        except Exception as e:
            logger.error(
                "batch_ocr_processing_failed", filename=file.filename, error=str(e)
            )
            results.append(
                {"filename": file.filename, "success": False, "error": str(e)}
            )
            failed += 1

    total_time = time.time() - start_time

    logger.info(
        "batch_ocr_completed",
        total_files=len(files),
        successful=successful,
        failed=failed,
        total_time=total_time,
    )

    return BatchOCRResult(
        batch_results=results,
        total_files=len(files),
        successful=successful,
        failed=failed,
        total_processing_time=round(total_time, 3),
    )


@router.get("/engines/info", response_model=OCREngineInfo)
async def get_engine_info():
    """
    OCR 엔진 정보 조회

    Returns:
        OCREngineInfo: 초기화된 엔진 정보
    """
    try:
        engine_info = ocr_manager.get_engine_info()
        return OCREngineInfo(**engine_info)

    except Exception as e:
        logger.error("get_engine_info_failed", error=str(e))
        raise HTTPException(
            status_code=500, detail="엔진 정보 조회 중 오류가 발생했습니다."
        )


@router.get("/engines/availability", response_model=OCREngineAvailability)
async def check_engine_availability():
    """
    OCR 엔진 사용 가능 여부 확인

    Returns:
        OCREngineAvailability: 엔진별 사용 가능 여부
    """
    try:
        availability = await ocr_manager.check_availability()
        return OCREngineAvailability(engines=availability)

    except Exception as e:
        logger.error("check_availability_failed", error=str(e))
        raise HTTPException(
            status_code=500, detail="엔진 가용성 확인 중 오류가 발생했습니다."
        )


@router.post("/engines/compare")
async def compare_engines(
    file: UploadFile = File(..., description="영수증 이미지 파일"),
    lang: str = Form(default="kor", description="언어 코드"),
):
    """
    모든 OCR 엔진 결과 비교

    모든 엔진으로 OCR을 수행하고 결과를 비교 분석합니다.

    Args:
        file: 업로드할 영수증 이미지
        lang: 언어 코드

    Returns:
        Dict: 엔진별 결과 비교
    """
    try:
        # 파일 검증
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="지원하지 않는 파일 형식입니다.",
            )

        # 파일 읽기 및 PIL Image 변환
        file_content = await file.read()
        image = Image.open(io.BytesIO(file_content))

        # 모든 엔진으로 비교 수행
        comparison_result = await ocr_manager.compare_engines(image=image, lang=lang)

        return comparison_result

    except HTTPException:
        raise
    except Exception as e:
        logger.error("engine_comparison_failed", filename=file.filename, error=str(e))
        raise HTTPException(
            status_code=500, detail="엔진 비교 중 오류가 발생했습니다."
        )
