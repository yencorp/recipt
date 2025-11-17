"""
병렬 OCR 처리 모듈
다중 프로세스 기반 병렬 이미지 처리
"""

import asyncio
import multiprocessing
from concurrent.futures import ProcessPoolExecutor, TimeoutError as FuturesTimeoutError
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image
import io
import structlog

from ..config.performance import get_global_performance_config, get_optimization_params

logger = structlog.get_logger()


def _process_single_image(
    image_bytes: bytes,
    filename: str,
    lang: str,
    optimization_level: str,
    task_id: int,
) -> Dict[str, Any]:
    """
    단일 이미지 처리 (워커 프로세스에서 실행)

    Note: 이 함수는 별도 프로세스에서 실행되므로 pickle 가능한 객체만 사용

    Args:
        image_bytes: 이미지 바이트
        filename: 파일명
        lang: 언어 코드
        optimization_level: 최적화 레벨
        task_id: 작업 ID

    Returns:
        Dict: OCR 처리 결과
    """
    try:
        # 프로세스 내부에서 필요한 모듈 임포트 (pickle 이슈 방지)
        from ..ocr.ocr_manager import OCRManager
        from ..ocr.preprocessor import ImagePreprocessor
        import structlog

        logger = structlog.get_logger()

        # 이미지 로드
        image = Image.open(io.BytesIO(image_bytes))

        # OCR 매니저 초기화 (각 워커 프로세스마다 독립적으로 초기화)
        ocr_manager = OCRManager()

        # 비동기 초기화를 동기 방식으로 실행
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(ocr_manager.initialize())

        # 최적화 파라미터 적용
        opt_params = get_optimization_params(optimization_level)

        # 전처리 설정 적용
        preprocessor = ImagePreprocessor(config=opt_params["preprocessing"])
        preprocessed_image = preprocessor.preprocess(image)

        # OCR 처리
        result = loop.run_until_complete(
            ocr_manager.process_image(
                preprocessed_image,
                lang=lang,
                return_all_results=False,
            )
        )

        loop.close()

        logger.info(
            "parallel_task_completed",
            task_id=task_id,
            filename=filename,
            success=result.get("success", False),
        )

        return {
            "success": True,
            "task_id": task_id,
            "filename": filename,
            "result": result,
        }

    except Exception as e:
        logger.error(
            "parallel_task_failed",
            task_id=task_id,
            filename=filename,
            error=str(e),
        )
        return {
            "success": False,
            "task_id": task_id,
            "filename": filename,
            "error": str(e),
        }


class ParallelOCRProcessor:
    """
    병렬 OCR 처리기

    다중 프로세스 풀을 사용하여 여러 이미지를 동시 처리
    """

    def __init__(self):
        """병렬 처리기 초기화"""
        self.config = get_global_performance_config()
        self.executor: Optional[ProcessPoolExecutor] = None
        self.is_initialized = False

        logger.info(
            "parallel_processor_config",
            max_workers=self.config.max_workers,
            max_concurrent_tasks=self.config.max_concurrent_tasks,
            process_start_method=self.config.process_start_method,
        )

    def initialize(self):
        """프로세스 풀 초기화"""
        if self.is_initialized:
            return

        if not self.config.enable_process_pool:
            logger.info("process_pool_disabled")
            self.is_initialized = True
            return

        try:
            # 멀티프로세싱 컨텍스트 설정
            ctx = multiprocessing.get_context(self.config.process_start_method)

            # ProcessPoolExecutor 생성
            self.executor = ProcessPoolExecutor(
                max_workers=self.config.max_workers,
                mp_context=ctx,
            )

            self.is_initialized = True
            logger.info(
                "process_pool_initialized",
                max_workers=self.config.max_workers,
                start_method=self.config.process_start_method,
            )

        except Exception as e:
            logger.error("process_pool_initialization_failed", error=str(e))
            raise

    def shutdown(self, wait: bool = True):
        """프로세스 풀 종료"""
        if self.executor:
            self.executor.shutdown(wait=wait)
            self.executor = None
            self.is_initialized = False
            logger.info("process_pool_shutdown")

    async def process_batch(
        self,
        images_data: List[Tuple[bytes, str]],
        lang: str = "kor",
        optimization_level: str = "balanced",
    ) -> List[Dict[str, Any]]:
        """
        이미지 배치 병렬 처리

        Args:
            images_data: (이미지 바이트, 파일명) 튜플 리스트
            lang: 언어 코드
            optimization_level: 최적화 레벨

        Returns:
            List[Dict]: 처리 결과 리스트
        """
        if not self.is_initialized:
            self.initialize()

        # 프로세스 풀이 비활성화된 경우 순차 처리
        if not self.config.enable_process_pool or self.executor is None:
            return await self._process_sequential(images_data, lang, optimization_level)

        # 배치 크기 제한
        if len(images_data) > self.config.max_concurrent_tasks:
            logger.warning(
                "batch_size_exceeded",
                requested=len(images_data),
                max_allowed=self.config.max_concurrent_tasks,
            )
            # 배치를 청크로 분할하여 처리
            return await self._process_in_chunks(images_data, lang, optimization_level)

        logger.info(
            "parallel_batch_processing_started",
            batch_size=len(images_data),
            workers=self.config.max_workers,
        )

        try:
            # 병렬 작업 제출
            loop = asyncio.get_event_loop()
            futures = []

            for task_id, (image_bytes, filename) in enumerate(images_data):
                future = loop.run_in_executor(
                    self.executor,
                    _process_single_image,
                    image_bytes,
                    filename,
                    lang,
                    optimization_level,
                    task_id,
                )
                futures.append(future)

            # 모든 작업 완료 대기 (타임아웃 포함)
            try:
                results = await asyncio.wait_for(
                    asyncio.gather(*futures, return_exceptions=True),
                    timeout=self.config.batch_timeout,
                )
            except asyncio.TimeoutError:
                logger.error(
                    "parallel_batch_timeout",
                    batch_size=len(images_data),
                    timeout=self.config.batch_timeout,
                )
                # 타임아웃된 작업들도 결과에 포함
                results = [
                    {
                        "success": False,
                        "task_id": i,
                        "filename": images_data[i][1],
                        "error": "Processing timeout",
                    }
                    for i in range(len(images_data))
                ]

            # Exception 결과 처리
            processed_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    processed_results.append(
                        {
                            "success": False,
                            "task_id": i,
                            "filename": images_data[i][1],
                            "error": str(result),
                        }
                    )
                else:
                    processed_results.append(result)

            # 성공/실패 통계
            success_count = sum(1 for r in processed_results if r.get("success", False))
            logger.info(
                "parallel_batch_processing_completed",
                total=len(processed_results),
                success=success_count,
                failed=len(processed_results) - success_count,
            )

            return processed_results

        except Exception as e:
            logger.error("parallel_batch_processing_failed", error=str(e))
            raise

    async def _process_sequential(
        self,
        images_data: List[Tuple[bytes, str]],
        lang: str,
        optimization_level: str,
    ) -> List[Dict[str, Any]]:
        """
        순차 처리 (프로세스 풀 비활성화 시)

        Args:
            images_data: (이미지 바이트, 파일명) 튜플 리스트
            lang: 언어 코드
            optimization_level: 최적화 레벨

        Returns:
            List[Dict]: 처리 결과 리스트
        """
        logger.info("sequential_processing_started", count=len(images_data))

        results = []
        for task_id, (image_bytes, filename) in enumerate(images_data):
            result = _process_single_image(
                image_bytes, filename, lang, optimization_level, task_id
            )
            results.append(result)

        logger.info("sequential_processing_completed", count=len(results))
        return results

    async def _process_in_chunks(
        self,
        images_data: List[Tuple[bytes, str]],
        lang: str,
        optimization_level: str,
    ) -> List[Dict[str, Any]]:
        """
        배치를 청크로 분할하여 처리

        Args:
            images_data: (이미지 바이트, 파일명) 튜플 리스트
            lang: 언어 코드
            optimization_level: 최적화 레벨

        Returns:
            List[Dict]: 처리 결과 리스트
        """
        chunk_size = self.config.max_concurrent_tasks
        all_results = []

        logger.info(
            "chunked_processing_started",
            total_images=len(images_data),
            chunk_size=chunk_size,
            total_chunks=(len(images_data) + chunk_size - 1) // chunk_size,
        )

        for i in range(0, len(images_data), chunk_size):
            chunk = images_data[i : i + chunk_size]
            logger.info(
                "processing_chunk",
                chunk_index=i // chunk_size + 1,
                chunk_size=len(chunk),
            )

            chunk_results = await self.process_batch(chunk, lang, optimization_level)
            all_results.extend(chunk_results)

        logger.info("chunked_processing_completed", total_results=len(all_results))
        return all_results


# 전역 병렬 처리기 인스턴스
_parallel_processor = None


def get_parallel_processor() -> ParallelOCRProcessor:
    """전역 병렬 처리기 인스턴스 반환 (싱글톤)"""
    global _parallel_processor
    if _parallel_processor is None:
        _parallel_processor = ParallelOCRProcessor()
        _parallel_processor.initialize()
    return _parallel_processor
