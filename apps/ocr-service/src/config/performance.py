"""
성능 최적화 설정
OCR 처리 성능 및 리소스 관리 설정
"""

import os
import multiprocessing
from typing import Dict, Any
from pydantic import BaseModel, Field


class PerformanceConfig(BaseModel):
    """성능 최적화 설정"""

    # 병렬 처리 설정
    max_workers: int = Field(
        default_factory=lambda: max(1, multiprocessing.cpu_count() - 1),
        description="최대 워커 프로세스 수 (기본값: CPU 코어 수 - 1)",
    )
    max_concurrent_tasks: int = Field(
        default=10, description="동시 처리 가능한 최대 작업 수"
    )
    task_timeout: int = Field(default=30, description="작업 타임아웃 (초)")

    # 이미지 크기 최적화
    max_image_dimension: int = Field(
        default=2048, description="처리할 이미지 최대 크기 (픽셀)"
    )
    min_image_dimension: int = Field(
        default=300, description="처리할 이미지 최소 크기 (픽셀)"
    )
    image_quality: int = Field(default=85, description="JPEG 압축 품질 (1-100)")

    # 메모리 관리
    max_memory_per_task_mb: int = Field(
        default=512, description="작업당 최대 메모리 사용량 (MB)"
    )
    enable_memory_optimization: bool = Field(
        default=True, description="메모리 최적화 활성화"
    )

    # GPU 설정
    enable_gpu: bool = Field(default=False, description="GPU 가속 사용 (EasyOCR)")
    gpu_memory_limit_mb: int = Field(
        default=2048, description="GPU 메모리 제한 (MB)"
    )

    # 프로세스 풀 설정
    process_start_method: str = Field(
        default="spawn", description="프로세스 시작 방법 (spawn/fork/forkserver)"
    )
    enable_process_pool: bool = Field(
        default=True, description="프로세스 풀 사용 여부"
    )

    # 배치 처리 설정
    batch_size: int = Field(default=10, description="배치 처리 크기")
    batch_timeout: int = Field(default=60, description="배치 타임아웃 (초)")

    # 최적화 전략
    optimization_level: str = Field(
        default="balanced",
        description="최적화 레벨 (speed/balanced/quality)",
    )

    class Config:
        arbitrary_types_allowed = True


def get_performance_config() -> PerformanceConfig:
    """환경 변수 기반 성능 설정 로드"""
    return PerformanceConfig(
        max_workers=int(os.getenv("OCR_MAX_WORKERS", PerformanceConfig().max_workers)),
        max_concurrent_tasks=int(
            os.getenv("OCR_MAX_CONCURRENT_TASKS", PerformanceConfig().max_concurrent_tasks)
        ),
        task_timeout=int(os.getenv("OCR_TASK_TIMEOUT", PerformanceConfig().task_timeout)),
        max_image_dimension=int(
            os.getenv("OCR_MAX_IMAGE_DIMENSION", PerformanceConfig().max_image_dimension)
        ),
        enable_gpu=os.getenv("OCR_ENABLE_GPU", "false").lower() == "true",
        optimization_level=os.getenv(
            "OCR_OPTIMIZATION_LEVEL", PerformanceConfig().optimization_level
        ),
    )


def get_optimization_params(level: str = "balanced") -> Dict[str, Any]:
    """최적화 레벨별 파라미터 반환"""
    optimization_params = {
        "speed": {
            # 속도 우선 - 최소한의 전처리
            "preprocessing": {
                "resize": True,
                "denoise": False,
                "binarize": False,
                "morphology": False,
            },
            "ocr_engines": ["tesseract"],  # 가장 빠른 엔진만 사용
            "confidence_threshold": 0.6,
            "max_retries": 0,
        },
        "balanced": {
            # 균형 - 적절한 전처리 + 다단계 엔진
            "preprocessing": {
                "resize": True,
                "denoise": True,
                "binarize": True,
                "morphology": False,
            },
            "ocr_engines": ["tesseract", "easyocr"],
            "confidence_threshold": 0.7,
            "max_retries": 1,
        },
        "quality": {
            # 품질 우선 - 전체 전처리 + 모든 엔진
            "preprocessing": {
                "resize": True,
                "denoise": True,
                "binarize": True,
                "morphology": True,
                "auto_crop": True,
                "rotation_correction": True,
            },
            "ocr_engines": ["tesseract", "easyocr", "google_vision"],
            "confidence_threshold": 0.8,
            "max_retries": 2,
        },
    }

    return optimization_params.get(level, optimization_params["balanced"])


# 전역 설정 인스턴스
_performance_config = None


def get_global_performance_config() -> PerformanceConfig:
    """전역 성능 설정 인스턴스 반환 (싱글톤)"""
    global _performance_config
    if _performance_config is None:
        _performance_config = get_performance_config()
    return _performance_config
