"""광남동성당 OCR 서비스 - FastAPI 메인 애플리케이션"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .config import settings
from .services.ocr_service import OCRService
from .api import ocr, health

# 로깅 설정
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# 글로벌 OCR 서비스 인스턴스
ocr_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    # 시작 시
    global ocr_service
    logger.info("OCR Service 시작 중...")
    ocr_service = OCRService()
    await ocr_service.initialize()
    logger.info("OCR Service 시작 완료")
    yield
    # 종료 시
    logger.info("OCR Service 종료 중...")
    await ocr_service.cleanup()
    logger.info("OCR Service 종료 완료")


app = FastAPI(
    title="광남동성당 OCR 서비스",
    description="영수증 OCR 처리를 위한 마이크로서비스",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(ocr.router, prefix="/api/v1/ocr", tags=["OCR"])
app.include_router(health.router, prefix="/health", tags=["Health"])


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {"message": "광남동성당 OCR 서비스", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
