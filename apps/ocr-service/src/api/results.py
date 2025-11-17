"""
OCR 결과 조회 API 라우터
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import io
import structlog

from ..storage.result_storage import OCRResultStorage

logger = structlog.get_logger()
router = APIRouter(prefix="/api/results", tags=["Results"])

# 저장소 초기화
storage = OCRResultStorage()


class ResultResponse(BaseModel):
    """OCR 결과 응답"""

    id: str = Field(description="결과 ID")
    original_filename: str = Field(description="원본 파일명")
    created_at: str = Field(description="생성 시간")
    ocr_result: dict = Field(description="OCR 처리 결과")
    has_image: bool = Field(description="원본 이미지 저장 여부")
    has_thumbnails: bool = Field(description="썸네일 저장 여부")
    updated_at: Optional[str] = Field(None, description="수정 시간")
    user_feedback: Optional[dict] = Field(None, description="사용자 피드백")


class ResultListResponse(BaseModel):
    """OCR 결과 목록 응답"""

    results: List[ResultResponse] = Field(description="결과 목록")
    total: int = Field(description="전체 결과 수")
    limit: int = Field(description="조회 개수")
    offset: int = Field(description="시작 오프셋")


class StorageStatsResponse(BaseModel):
    """저장소 통계 응답"""

    total_results: int = Field(description="전체 결과 수")
    total_images: int = Field(description="전체 이미지 수")
    total_thumbnails: int = Field(description="전체 썸네일 수")
    storage_size_bytes: dict = Field(description="저장 공간 (바이트)")
    storage_size_mb: dict = Field(description="저장 공간 (MB)")


@router.get("/{result_id}", response_model=ResultResponse)
async def get_result(result_id: str):
    """
    OCR 결과 조회

    Args:
        result_id: 결과 ID

    Returns:
        ResultResponse: OCR 결과
    """
    try:
        result = storage.get_result(result_id)

        if not result:
            raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다.")

        logger.info("result_retrieved_via_api", result_id=result_id)
        return ResultResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("result_retrieval_failed", result_id=result_id, error=str(e))
        raise HTTPException(status_code=500, detail="결과 조회 중 오류가 발생했습니다.")


@router.get("", response_model=ResultListResponse)
async def list_results(
    limit: int = Query(default=100, ge=1, le=1000, description="조회 개수"),
    offset: int = Query(default=0, ge=0, description="시작 오프셋"),
    order_by: str = Query(default="created_at", description="정렬 기준"),
):
    """
    OCR 결과 목록 조회

    Args:
        limit: 조회 개수 (1-1000)
        offset: 시작 오프셋
        order_by: 정렬 기준

    Returns:
        ResultListResponse: 결과 목록
    """
    try:
        results = storage.list_results(limit=limit, offset=offset, order_by=order_by)

        # 전체 개수 조회 (통계에서)
        stats = storage.get_statistics()
        total = stats.get("total_results", 0)

        logger.info(
            "results_listed_via_api",
            total=total,
            returned=len(results),
            limit=limit,
            offset=offset,
        )

        return ResultListResponse(
            results=[ResultResponse(**r) for r in results],
            total=total,
            limit=limit,
            offset=offset,
        )

    except Exception as e:
        logger.error("results_listing_failed", error=str(e))
        raise HTTPException(status_code=500, detail="결과 목록 조회 중 오류가 발생했습니다.")


@router.delete("/{result_id}")
async def delete_result(result_id: str):
    """
    OCR 결과 삭제

    Args:
        result_id: 결과 ID

    Returns:
        dict: 삭제 결과
    """
    try:
        success = storage.delete_result(result_id)

        if not success:
            raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다.")

        logger.info("result_deleted_via_api", result_id=result_id)
        return {"success": True, "message": "결과가 삭제되었습니다.", "result_id": result_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("result_deletion_failed", result_id=result_id, error=str(e))
        raise HTTPException(status_code=500, detail="결과 삭제 중 오류가 발생했습니다.")


@router.get("/{result_id}/image")
async def get_result_image(result_id: str):
    """
    OCR 결과의 원본 이미지 조회

    Args:
        result_id: 결과 ID

    Returns:
        StreamingResponse: 이미지 파일
    """
    try:
        image_bytes = storage.get_image(result_id)

        if not image_bytes:
            raise HTTPException(status_code=404, detail="이미지를 찾을 수 없습니다.")

        logger.debug("result_image_retrieved", result_id=result_id, size=len(image_bytes))

        return StreamingResponse(
            io.BytesIO(image_bytes),
            media_type="image/jpeg",
            headers={
                "Content-Disposition": f"inline; filename={result_id}.jpg",
                "Cache-Control": "public, max-age=3600",
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("result_image_retrieval_failed", result_id=result_id, error=str(e))
        raise HTTPException(status_code=500, detail="이미지 조회 중 오류가 발생했습니다.")


@router.get("/{result_id}/thumbnail")
async def get_result_thumbnail(
    result_id: str,
    size: str = Query(default="medium", regex="^(small|medium|large)$", description="썸네일 크기"),
):
    """
    OCR 결과의 썸네일 이미지 조회

    Args:
        result_id: 결과 ID
        size: 썸네일 크기 (small, medium, large)

    Returns:
        StreamingResponse: 썸네일 이미지
    """
    try:
        thumbnail_bytes = storage.get_thumbnail(result_id, size=size)

        if not thumbnail_bytes:
            raise HTTPException(status_code=404, detail="썸네일을 찾을 수 없습니다.")

        logger.debug(
            "result_thumbnail_retrieved",
            result_id=result_id,
            size=size,
            bytes=len(thumbnail_bytes),
        )

        return StreamingResponse(
            io.BytesIO(thumbnail_bytes),
            media_type="image/jpeg",
            headers={
                "Content-Disposition": f"inline; filename={result_id}_{size}.jpg",
                "Cache-Control": "public, max-age=3600",
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "result_thumbnail_retrieval_failed",
            result_id=result_id,
            size=size,
            error=str(e),
        )
        raise HTTPException(status_code=500, detail="썸네일 조회 중 오류가 발생했습니다.")


@router.get("/stats/storage", response_model=StorageStatsResponse)
async def get_storage_statistics():
    """
    저장소 통계 조회

    Returns:
        StorageStatsResponse: 저장소 통계
    """
    try:
        stats = storage.get_statistics()

        logger.debug("storage_statistics_retrieved", stats=stats)
        return StorageStatsResponse(**stats)

    except Exception as e:
        logger.error("storage_statistics_retrieval_failed", error=str(e))
        raise HTTPException(status_code=500, detail="통계 조회 중 오류가 발생했습니다.")
