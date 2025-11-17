"""OCR 서비스 핵심 클래스"""

import asyncio
import logging
import time
from typing import List, Dict, Optional
from pathlib import Path
import aiofiles
from PIL import Image
from fastapi import UploadFile

from ..core.engines.tesseract import TesseractEngine
from ..core.engines.easyocr import EasyOCREngine
from ..core.processors.image_processor import ImageProcessor
from ..core.processors.receipt_parser import ReceiptParser
from ..models.ocr_models import OCRJob, OCRResult, ProcessingStatus, ReceiptData

logger = logging.getLogger(__name__)


class OCRService:
    """OCR 서비스"""

    def __init__(self):
        self.tesseract = TesseractEngine()
        self.easyocr = EasyOCREngine()
        self.image_processor = ImageProcessor()
        self.receipt_parser = ReceiptParser()
        self.jobs: Dict[str, OCRJob] = {}

    async def initialize(self):
        """OCR 엔진 초기화"""
        await asyncio.gather(
            self.tesseract.initialize(),
            self.easyocr.initialize(),
        )
        logger.info("OCR Service 초기화 완료")

    async def process_receipts(
        self, files: List[UploadFile], job_id: str, settlement_id: str
    ) -> OCRJob:
        """영수증 일괄 처리"""
        job = OCRJob(
            id=job_id,
            settlement_id=settlement_id,
            status=ProcessingStatus.PROCESSING,
            total_files=len(files),
            processed_files=0,
            results=[],
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
            *[bounded_task(task) for task in tasks], return_exceptions=True
        )

        # 결과 집계
        job.processed_files = len([r for r in results if not isinstance(r, Exception)])
        job.success_files = len([r for r in results if isinstance(r, OCRResult) and r.success])
        job.failed_files = job.total_files - job.success_files

        job.status = (
            ProcessingStatus.COMPLETED
            if job.failed_files == 0
            else ProcessingStatus.PARTIAL
        )
        logger.info(f"Job {job.id} 처리 완료: {job.success_files}/{job.total_files} 성공")

    async def _process_single_file(
        self, job: OCRJob, file: UploadFile, index: int
    ) -> Optional[OCRResult]:
        """단일 파일 처리"""
        start_time = time.time()

        try:
            # 파일 저장
            file_path = await self._save_uploaded_file(file, job.id, index)

            # 이미지 전처리
            processed_path = await self.image_processor.process_receipt_image(file_path)

            # OCR 처리 (Tesseract 우선 사용)
            ocr_text = await self.tesseract.extract_text(processed_path)
            confidence = await self.tesseract.get_confidence(processed_path)

            # 신뢰도가 낮으면 EasyOCR 시도
            if confidence < 0.7:
                try:
                    easyocr_text = await self.easyocr.extract_text(processed_path)
                    easyocr_confidence = 0.8  # EasyOCR은 자체 신뢰도 제공

                    if easyocr_confidence > confidence:
                        ocr_text = easyocr_text
                        confidence = easyocr_confidence
                        engine_used = "easyocr"
                    else:
                        engine_used = "tesseract"
                except Exception as e:
                    logger.warning(f"EasyOCR 처리 실패, Tesseract 결과 사용: {e}")
                    engine_used = "tesseract"
            else:
                engine_used = "tesseract"

            # 영수증 데이터 파싱
            receipt_dict = await self.receipt_parser.parse_receipt_text(ocr_text)
            receipt_data = ReceiptData(**receipt_dict) if receipt_dict else None

            processing_time = time.time() - start_time

            # 결과 생성
            result = OCRResult(
                filename=file.filename,
                success=True,
                confidence=confidence,
                engine_used=engine_used,
                extracted_data=receipt_data,
                processing_time=processing_time,
            )

            job.results.append(result)
            job.processed_files += 1

            return result

        except Exception as e:
            processing_time = time.time() - start_time
            error_result = OCRResult(
                filename=file.filename,
                success=False,
                confidence=0.0,
                processing_time=processing_time,
                error=str(e),
            )
            job.results.append(error_result)
            job.processed_files += 1
            logger.error(f"파일 {file.filename} 처리 실패: {e}")
            return None

    async def _save_uploaded_file(
        self, file: UploadFile, job_id: str, index: int
    ) -> Path:
        """업로드된 파일 저장"""
        upload_dir = Path("storage/uploads") / job_id
        upload_dir.mkdir(parents=True, exist_ok=True)

        file_extension = Path(file.filename).suffix
        file_path = upload_dir / f"receipt_{index:03d}{file_extension}"

        async with aiofiles.open(file_path, "wb") as f:
            content = await file.read()
            await f.write(content)

        return file_path

    async def get_job_status(self, job_id: str) -> Optional[OCRJob]:
        """작업 상태 조회"""
        return self.jobs.get(job_id)

    async def cleanup(self):
        """리소스 정리"""
        await asyncio.gather(self.tesseract.cleanup(), self.easyocr.cleanup())
        logger.info("OCR Service 정리 완료")
