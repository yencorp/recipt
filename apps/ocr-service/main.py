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

from src.utils.config import get_settings
from src.api import ocr_router, health_router, results_router, feedback_router

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

# API 라우터 등록
app.include_router(ocr_router)
app.include_router(health_router)
app.include_router(results_router)
app.include_router(feedback_router)


# 루트 엔드포인트
@app.get("/", tags=["Root"])
async def root():
    """루트 엔드포인트"""
    return {
        "service": "광남동성당 OCR 서비스",
        "version": "1.0.0",
        "status": "running",
        "docs": "/api/docs",
    }


# 앱 시작 이벤트
@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 초기화"""
    logger.info("OCR Service starting up", version="1.0.0")

    # 업로드 디렉토리 생성
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.LOG_DIR, exist_ok=True)

    # OCR 매니저 초기화 (라우터에서 사용하는 ocr_manager)
    from src.api.ocr import ocr_manager
    await ocr_manager.initialize()

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
