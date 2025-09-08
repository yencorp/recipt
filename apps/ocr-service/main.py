"""
OCR 서비스 - 영수증 텍스트 인식 API
광남동성당 청소년위원회 예결산 관리 시스템

FastAPI 기반 OCR 서비스로 영수증 이미지에서 텍스트를 추출합니다.
"""

import asyncio
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import structlog
import uvicorn
from fastapi import (BackgroundTasks, Depends, FastAPI, File, HTTPException,
                     UploadFile)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from src.ocr.processor import OCRProcessor
from src.utils.config import get_settings
from src.utils.health import HealthChecker

# 설정 로드
settings = get_settings()

# 로깅 설정
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# FastAPI 앱 생성
app = FastAPI(
    title="광남동성당 OCR 서비스",
    description="영수증 텍스트 인식 API 서비스",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OCR 프로세서 초기화
ocr_processor = OCRProcessor()
health_checker = HealthChecker()


# 요청/응답 모델
class OCRResult(BaseModel):
    """OCR 처리 결과"""

    success: bool = Field(description="처리 성공 여부")
    text: str = Field(description="추출된 텍스트")
    confidence: float = Field(description="신뢰도 (0.0-1.0)")
    processing_time: float = Field(description="처리 시간(초)")
    image_info: Dict[str, Any] = Field(description="이미지 정보")
    extracted_data: Optional[Dict[str, Any]] = Field(
        None, description="구조화된 데이터"
    )


class HealthResponse(BaseModel):
    """헬스체크 응답"""

    status: str
    timestamp: str
    version: str
    services: Dict[str, Dict[str, Any]]


# API 엔드포인트
@app.get("/", tags=["Root"])
async def root():
    """루트 엔드포인트"""
    return {
        "service": "광남동성당 OCR 서비스",
        "version": "1.0.0",
        "status": "running",
        "docs": "/api/docs",
    }


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """헬스체크 엔드포인트"""
    return await health_checker.get_health_status()


@app.post("/api/ocr/extract", response_model=OCRResult, tags=["OCR"])
async def extract_text(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="영수증 이미지 파일"),
):
    """
    영수증 이미지에서 텍스트 추출

    - **file**: 업로드할 영수증 이미지 (JPG, PNG, PDF 지원)
    """
    try:
        # 파일 검증
        if not file.content_type.startswith(("image/", "application/pdf")):
            raise HTTPException(
                status_code=400,
                detail="지원하지 않는 파일 형식입니다. JPG, PNG, PDF만 지원됩니다.",
            )

        if file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"파일 크기가 너무 큽니다. 최대 {settings.MAX_FILE_SIZE // (1024*1024)}MB까지 지원됩니다.",
            )

        # 파일 읽기
        file_content = await file.read()

        # OCR 처리
        result = await ocr_processor.process_image(
            image_data=file_content, filename=file.filename
        )

        # 백그라운드 작업 - 처리 로그 저장
        background_tasks.add_task(
            log_ocr_processing,
            filename=file.filename,
            success=result["success"],
            processing_time=result["processing_time"],
        )

        logger.info(
            "OCR processing completed",
            filename=file.filename,
            success=result["success"],
            confidence=result.get("confidence", 0.0),
        )

        return OCRResult(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("OCR processing failed", filename=file.filename, error=str(e))
        raise HTTPException(status_code=500, detail="OCR 처리 중 오류가 발생했습니다.")


@app.post("/api/ocr/batch", tags=["OCR"])
async def extract_text_batch(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="영수증 이미지 파일들"),
):
    """
    여러 영수증 이미지에서 일괄 텍스트 추출

    - **files**: 업로드할 영수증 이미지들 (최대 10개)
    """
    if len(files) > settings.MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"최대 {settings.MAX_BATCH_SIZE}개 파일까지 처리 가능합니다.",
        )

    results = []

    for file in files:
        try:
            # 개별 파일 처리 (extract_text와 동일한 로직)
            if not file.content_type.startswith(("image/", "application/pdf")):
                results.append(
                    {
                        "filename": file.filename,
                        "success": False,
                        "error": "지원하지 않는 파일 형식",
                    }
                )
                continue

            file_content = await file.read()
            result = await ocr_processor.process_image(file_content, file.filename)
            results.append({"filename": file.filename, **result})

        except Exception as e:
            logger.error(
                "Batch OCR processing failed", filename=file.filename, error=str(e)
            )
            results.append(
                {"filename": file.filename, "success": False, "error": str(e)}
            )

    return {
        "batch_results": results,
        "total_files": len(files),
        "successful": sum(1 for r in results if r.get("success", False)),
        "failed": sum(1 for r in results if not r.get("success", False)),
    }


async def log_ocr_processing(filename: str, success: bool, processing_time: float):
    """OCR 처리 로그를 기록하는 백그라운드 작업"""
    logger.info(
        "OCR processing logged",
        filename=filename,
        success=success,
        processing_time=processing_time,
    )


# 앱 시작 이벤트
@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 초기화"""
    logger.info("OCR Service starting up", version="1.0.0")

    # 업로드 디렉토리 생성
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.LOG_DIR, exist_ok=True)

    # OCR 엔진 초기화 테스트
    await ocr_processor.initialize()

    logger.info("OCR Service started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 시 정리"""
    logger.info("OCR Service shutting down")


# 메인 실행부
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else settings.WORKERS,
        log_config=None,  # structlog 사용
    )
