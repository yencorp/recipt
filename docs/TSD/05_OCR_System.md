# OCR 시스템 기술명세서

## 개요

Python 기반 OCR 시스템으로 TesseractOCR과 easyOCR을 통합하여 한글 영수증 인식률을 최대화합니다. FastAPI를 사용한 독립적인 마이크로서비스로 구현됩니다.

## 기술 스택

- **언어**: Python 3.11
- **웹 프레임워크**: FastAPI 0.100+
- **OCR 엔진**: TesseractOCR 5.3, easyOCR 1.7
- **이미지 처리**: OpenCV 4.8, Pillow 9.5
- **자연어 처리**: PyKoSpacing, symspellpy
- **머신러닝**: scikit-learn, numpy, pandas
- **HTTP 클라이언트**: httpx

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────┐
│                OCR Service                      │
├─────────────────┬───────────────────────────────┤
│   FastAPI       │         Processing Pipeline   │
│   ├─ Upload     │         ┌─ Image Preprocessing│
│   ├─ Process    │         ├─ OCR Engines        │
│   ├─ Result     │         ├─ Text Processing    │
│   └─ Status     │         └─ ML Enhancement     │
└─────────────────┴───────────────────────────────┘
          │                           │
          ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│   File Storage  │         │   PostgreSQL    │
│   ├─ Original   │         │   ├─ OCR Jobs   │
│   ├─ Processed  │         │   ├─ Results    │
│   └─ Thumbnails │         │   └─ ML Data    │
└─────────────────┘         └─────────────────┘
```

## 프로젝트 구조

```
ocr_service/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 애플리케이션
│   ├── config.py               # 설정
│   ├── models/                 # 데이터 모델
│   │   ├── __init__.py
│   │   ├── ocr_models.py
│   │   └── ml_models.py
│   ├── services/               # 비즈니스 로직
│   │   ├── __init__.py
│   │   ├── ocr_service.py
│   │   ├── image_service.py
│   │   ├── text_service.py
│   │   └── ml_service.py
│   ├── api/                    # API 엔드포인트
│   │   ├── __init__.py
│   │   ├── ocr.py
│   │   └── health.py
│   ├── core/                   # 핵심 기능
│   │   ├── __init__.py
│   │   ├── engines/           # OCR 엔진
│   │   │   ├── tesseract.py
│   │   │   ├── easyocr.py
│   │   │   └── base.py
│   │   ├── processors/        # 이미지/텍스트 처리
│   │   │   ├── image_processor.py
│   │   │   ├── text_processor.py
│   │   │   └── receipt_parser.py
│   │   └── ml/               # 머신러닝
│   │       ├── feature_extractor.py
│   │       ├── classifier.py
│   │       └── trainer.py
│   └── utils/
│       ├── __init__.py
│       ├── file_utils.py
│       └── validation.py
├── tests/
├── docker/
├── requirements.txt
└── Dockerfile
```

## 핵심 구현

### 1. FastAPI 메인 애플리케이션

```python
# app/main.py
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uuid
import asyncio
from contextlib import asynccontextmanager

from .config import settings
from .services.ocr_service import OCRService
from .models.ocr_models import OCRJobResponse, OCRResult
from .api import ocr, health

# 글로벌 OCR 서비스 인스턴스
ocr_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시
    global ocr_service
    ocr_service = OCRService()
    await ocr_service.initialize()
    yield
    # 종료 시
    await ocr_service.cleanup()

app = FastAPI(
    title="광남동성당 OCR 서비스",
    description="영수증 OCR 처리를 위한 마이크로서비스",
    version="1.0.0",
    lifespan=lifespan
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
    return {"message": "광남동성당 OCR 서비스", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 2. OCR 서비스 핵심 클래스

```python
# app/services/ocr_service.py
import asyncio
import logging
from typing import List, Dict, Optional
from pathlib import Path
import aiofiles
from PIL import Image

from ..core.engines.tesseract import TesseractEngine
from ..core.engines.easyocr import EasyOCREngine
from ..core.processors.image_processor import ImageProcessor
from ..core.processors.receipt_parser import ReceiptParser
from ..core.ml.classifier import EngineClassifier
from ..models.ocr_models import OCRJob, OCRResult, ProcessingStatus

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        self.tesseract = TesseractEngine()
        self.easyocr = EasyOCREngine()
        self.image_processor = ImageProcessor()
        self.receipt_parser = ReceiptParser()
        self.classifier = EngineClassifier()
        self.jobs: Dict[str, OCRJob] = {}

    async def initialize(self):
        """OCR 엔진 초기화"""
        await asyncio.gather(
            self.tesseract.initialize(),
            self.easyocr.initialize(),
            self.classifier.load_model()
        )
        logger.info("OCR Service 초기화 완료")

    async def process_receipts(
        self, 
        files: List[UploadFile], 
        job_id: str,
        settlement_id: str
    ) -> OCRJob:
        """영수증 일괄 처리"""
        job = OCRJob(
            id=job_id,
            settlement_id=settlement_id,
            status=ProcessingStatus.PROCESSING,
            total_files=len(files),
            processed_files=0,
            results=[]
        )
        self.jobs[job_id] = job

        try:
            # 백그라운드에서 비동기 처리
            asyncio.create_task(self._process_files_async(job, files))
            return job
        except Exception as e:
            job.status = ProcessingStatus.FAILED
            job.error_message = str(e)
            logger.error(f"Job {job_id} 처리 실패: {e}")
            raise

    async def _process_files_async(self, job: OCRJob, files: List[UploadFile]):
        """파일들을 비동기로 처리"""
        tasks = []
        for i, file in enumerate(files):
            task = self._process_single_file(job, file, i)
            tasks.append(task)

        # 동시에 최대 3개 파일 처리
        semaphore = asyncio.Semaphore(3)
        
        async def bounded_task(task):
            async with semaphore:
                return await task

        results = await asyncio.gather(
            *[bounded_task(task) for task in tasks],
            return_exceptions=True
        )

        # 결과 집계
        job.processed_files = len([r for r in results if not isinstance(r, Exception)])
        job.success_files = len([r for r in results if isinstance(r, OCRResult)])
        job.failed_files = job.total_files - job.success_files

        job.status = ProcessingStatus.COMPLETED if job.failed_files == 0 else ProcessingStatus.PARTIAL
        logger.info(f"Job {job.id} 처리 완료: {job.success_files}/{job.total_files} 성공")

    async def _process_single_file(
        self, 
        job: OCRJob, 
        file: UploadFile, 
        index: int
    ) -> Optional[OCRResult]:
        """단일 파일 처리"""
        try:
            # 파일 저장
            file_path = await self._save_uploaded_file(file, job.id, index)
            
            # 이미지 전처리
            processed_path = await self.image_processor.process_receipt_image(file_path)
            
            # OCR 엔진 선택 (ML 분류기 사용)
            engine_choice = await self.classifier.select_best_engine(processed_path)
            
            # OCR 처리
            if engine_choice == 'tesseract':
                ocr_text = await self.tesseract.extract_text(processed_path)
                confidence = await self.tesseract.get_confidence(processed_path)
            else:
                ocr_text, confidence = await self.easyocr.extract_text_with_confidence(processed_path)
            
            # 영수증 데이터 파싱
            receipt_data = await self.receipt_parser.parse_receipt_text(ocr_text)
            
            # 결과 생성
            result = OCRResult(
                filename=file.filename,
                success=True,
                confidence=confidence,
                engine_used=engine_choice,
                extracted_data=receipt_data,
                processing_time=0.0  # 실제 처리 시간 계산
            )
            
            job.results.append(result)
            job.processed_files += 1
            
            return result
            
        except Exception as e:
            error_result = OCRResult(
                filename=file.filename,
                success=False,
                confidence=0.0,
                error=str(e)
            )
            job.results.append(error_result)
            job.processed_files += 1
            logger.error(f"파일 {file.filename} 처리 실패: {e}")
            return None

    async def _save_uploaded_file(self, file: UploadFile, job_id: str, index: int) -> Path:
        """업로드된 파일 저장"""
        upload_dir = Path("storage/uploads") / job_id
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_extension = Path(file.filename).suffix
        file_path = upload_dir / f"receipt_{index:03d}{file_extension}"
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        return file_path

    async def get_job_status(self, job_id: str) -> Optional[OCRJob]:
        """작업 상태 조회"""
        return self.jobs.get(job_id)

    async def cleanup(self):
        """리소스 정리"""
        await asyncio.gather(
            self.tesseract.cleanup(),
            self.easyocr.cleanup()
        )
        logger.info("OCR Service 정리 완료")
```

### 3. 이미지 전처리 프로세서

```python
# app/core/processors/image_processor.py
import cv2
import numpy as np
from PIL import Image, ImageEnhance
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class ImageProcessor:
    def __init__(self):
        self.target_width = 800
        self.target_dpi = 300

    async def process_receipt_image(self, image_path: Path) -> Path:
        """영수증 이미지 종합 처리"""
        try:
            # 이미지 로드
            image = cv2.imread(str(image_path))
            if image is None:
                raise ValueError(f"이미지를 로드할 수 없습니다: {image_path}")

            # 처리 파이프라인
            processed = await self._preprocessing_pipeline(image)
            
            # 처리된 이미지 저장
            processed_path = image_path.parent / f"processed_{image_path.name}"
            cv2.imwrite(str(processed_path), processed)
            
            logger.info(f"이미지 전처리 완료: {processed_path}")
            return processed_path

        except Exception as e:
            logger.error(f"이미지 처리 실패 {image_path}: {e}")
            raise

    async def _preprocessing_pipeline(self, image: np.ndarray) -> np.ndarray:
        """이미지 전처리 파이프라인"""
        # 1. 노이즈 제거
        denoised = cv2.fastNlMeansDenoising(image)
        
        # 2. 영수증 영역 감지 및 크로핑
        cropped = await self._detect_and_crop_receipt(denoised)
        
        # 3. 기울기 보정
        rotated = await self._correct_skew(cropped)
        
        # 4. 크기 조정
        resized = await self._resize_image(rotated)
        
        # 5. 대비 향상
        enhanced = await self._enhance_contrast(resized)
        
        # 6. 이진화
        binary = await self._apply_binarization(enhanced)
        
        return binary

    async def _detect_and_crop_receipt(self, image: np.ndarray) -> np.ndarray:
        """영수증 영역 자동 감지 및 크로핑"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 가우시안 블러 적용
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # 캐니 엣지 감지
        edged = cv2.Canny(blurred, 50, 200, apertureSize=3)
        
        # 컨투어 찾기
        contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            # 가장 큰 사각형 컨투어 찾기
            largest_contour = max(contours, key=cv2.contourArea)
            
            # 컨투어 근사화
            epsilon = 0.02 * cv2.arcLength(largest_contour, True)
            approx = cv2.approxPolyDP(largest_contour, epsilon, True)
            
            if len(approx) == 4:
                # 원근 변환으로 영수증 영역 추출
                return await self._perspective_transform(image, approx)
        
        # 감지 실패 시 원본 이미지 반환
        return image

    async def _perspective_transform(self, image: np.ndarray, corners: np.ndarray) -> np.ndarray:
        """원근 변환"""
        # 코너 점들을 정렬
        rect = self._order_points(corners.reshape(4, 2))
        
        # 목표 사각형 크기 계산
        (tl, tr, br, bl) = rect
        width_a = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        width_b = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        max_width = max(int(width_a), int(width_b))
        
        height_a = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        height_b = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        max_height = max(int(height_a), int(height_b))
        
        # 목표 좌표
        dst = np.array([
            [0, 0],
            [max_width - 1, 0],
            [max_width - 1, max_height - 1],
            [0, max_height - 1]
        ], dtype=np.float32)
        
        # 변환 행렬 계산 및 적용
        matrix = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(image, matrix, (max_width, max_height))
        
        return warped

    def _order_points(self, pts: np.ndarray) -> np.ndarray:
        """점들을 시계방향 순서로 정렬"""
        rect = np.zeros((4, 2), dtype=np.float32)
        
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]  # 좌상단
        rect[2] = pts[np.argmax(s)]  # 우하단
        
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]  # 우상단
        rect[3] = pts[np.argmax(diff)]  # 좌하단
        
        return rect

    async def _correct_skew(self, image: np.ndarray) -> np.ndarray:
        """기울기 보정"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=100, maxLineGap=10)
        
        if lines is not None:
            angles = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                angle = np.arctan2(y2 - y1, x2 - x1)
                angles.append(angle)
            
            if angles:
                median_angle = np.median(angles)
                angle_degrees = np.degrees(median_angle)
                
                # 작은 각도만 보정 (5도 이내)
                if abs(angle_degrees) < 5:
                    center = tuple(np.array(image.shape[1::-1]) / 2)
                    rotation_matrix = cv2.getRotationMatrix2D(center, angle_degrees, 1.0)
                    return cv2.warpAffine(image, rotation_matrix, image.shape[1::-1])
        
        return image

    async def _resize_image(self, image: np.ndarray) -> np.ndarray:
        """이미지 크기 조정"""
        height, width = image.shape[:2]
        if width > self.target_width:
            scale = self.target_width / width
            new_width = self.target_width
            new_height = int(height * scale)
            return cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
        return image

    async def _enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """대비 향상"""
        # CLAHE (Contrast Limited Adaptive Histogram Equalization) 적용
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        return cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)

    async def _apply_binarization(self, image: np.ndarray) -> np.ndarray:
        """이진화 적용"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Otsu 임계값 적용
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # 모폴로지 연산으로 노이즈 제거
        kernel = np.ones((2, 2), np.uint8)
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        
        return cv2.cvtColor(cleaned, cv2.COLOR_GRAY2BGR)
```

### 4. OCR 엔진 구현

```python
# app/core/engines/tesseract.py
import pytesseract
import cv2
import numpy as np
from pathlib import Path
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class TesseractEngine:
    def __init__(self):
        self.config = '--oem 3 --psm 6 -l kor+eng'
        
    async def initialize(self):
        """Tesseract 초기화"""
        try:
            # Tesseract 설치 확인
            version = pytesseract.get_tesseract_version()
            logger.info(f"Tesseract 버전: {version}")
            
            # 한글 언어팩 확인
            langs = pytesseract.get_languages()
            if 'kor' not in langs:
                logger.warning("한글 언어팩이 설치되지 않았습니다.")
            
        except Exception as e:
            logger.error(f"Tesseract 초기화 실패: {e}")
            raise

    async def extract_text(self, image_path: Path) -> str:
        """텍스트 추출"""
        try:
            image = cv2.imread(str(image_path))
            text = pytesseract.image_to_string(image, config=self.config)
            return text.strip()
        except Exception as e:
            logger.error(f"Tesseract 텍스트 추출 실패 {image_path}: {e}")
            raise

    async def get_confidence(self, image_path: Path) -> float:
        """신뢰도 계산"""
        try:
            image = cv2.imread(str(image_path))
            data = pytesseract.image_to_data(image, config=self.config, output_type=pytesseract.Output.DICT)
            
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            if confidences:
                return sum(confidences) / len(confidences) / 100.0
            return 0.0
            
        except Exception as e:
            logger.error(f"신뢰도 계산 실패 {image_path}: {e}")
            return 0.0

    async def cleanup(self):
        """리소스 정리"""
        pass
```

### 5. API 엔드포인트

```python
# app/api/ocr.py
from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
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
    ocr_service: OCRService = Depends(get_ocr_service)
):
    """영수증 업로드 및 OCR 처리"""
    
    # 파일 수 제한 (최대 100개)
    if len(files) > 100:
        raise HTTPException(status_code=400, detail="최대 100개 파일까지 업로드 가능합니다.")
    
    # 파일 형식 검증
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.pdf', '.bmp', '.tiff'}
    for file in files:
        if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400, 
                detail=f"지원되지 않는 파일 형식: {file.filename}"
            )
    
    try:
        job_id = str(uuid.uuid4())
        job = await ocr_service.process_receipts(files, job_id, settlement_id)
        
        return OCRJobResponse(
            job_id=job.id,
            status=job.status,
            total_files=job.total_files,
            processed_files=job.processed_files,
            message="OCR 처리가 시작되었습니다."
        )
        
    except Exception as e:
        logger.error(f"OCR 처리 시작 실패: {e}")
        raise HTTPException(status_code=500, detail="OCR 처리를 시작할 수 없습니다.")

@router.get("/jobs/{job_id}", response_model=OCRResultResponse)
async def get_job_status(
    job_id: str,
    ocr_service: OCRService = Depends(get_ocr_service)
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
        error_message=job.error_message
    )

@router.delete("/jobs/{job_id}")
async def cancel_job(
    job_id: str,
    ocr_service: OCRService = Depends(get_ocr_service)
):
    """OCR 작업 취소"""
    
    job = await ocr_service.get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다.")
    
    # 작업 취소 로직 (실제로는 더 복잡한 구현 필요)
    return {"message": "작업이 취소되었습니다."}
```

### 6. 데이터 모델

```python
# app/models/ocr_models.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class ProcessingStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING" 
    COMPLETED = "COMPLETED"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"

class ReceiptData(BaseModel):
    receipt_date: Optional[str] = None
    merchant_name: Optional[str] = None
    total_amount: Optional[float] = None
    business_number: Optional[str] = None
    payment_method: Optional[str] = None
    items: List[Dict[str, Any]] = []

class OCRResult(BaseModel):
    filename: str
    success: bool
    confidence: float = 0.0
    engine_used: Optional[str] = None
    extracted_data: Optional[ReceiptData] = None
    processing_time: float = 0.0
    error: Optional[str] = None

class OCRJob(BaseModel):
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
    job_id: str
    status: ProcessingStatus
    total_files: int
    processed_files: int
    message: str

class OCRResultResponse(BaseModel):
    job_id: str
    status: ProcessingStatus
    total_files: int
    processed_files: int
    success_files: int
    failed_files: int
    results: List[OCRResult]
    error_message: Optional[str] = None
```

### 7. Docker 설정

```dockerfile
# Dockerfile
FROM python:3.11-slim

# 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-kor \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 복사
COPY . .

# 포트 노출
EXPOSE 8000

# 애플리케이션 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```txt
# requirements.txt
fastapi==0.100.1
uvicorn[standard]==0.23.2
python-multipart==0.0.6
aiofiles==23.1.0
Pillow==9.5.0
opencv-python==4.8.0.74
pytesseract==0.3.10
easyocr==1.7.0
numpy==1.24.3
scikit-learn==1.3.0
symspellpy==6.7.7
PyKoSpacing==0.5
httpx==0.24.1
pydantic==2.1.1
python-dotenv==1.0.0
```

---

*이 OCR 시스템은 높은 인식률과 확장성을 제공하며, 독립적인 마이크로서비스로 운영됩니다.*