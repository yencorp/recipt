"""
OCR 피드백 API 라우터
사용자 피드백 수집 및 학습 데이터 관리
"""

from typing import Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
import structlog

from ..storage.result_storage import OCRResultStorage

logger = structlog.get_logger()
router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

# 저장소 초기화
storage = OCRResultStorage()


class FeedbackRequest(BaseModel):
    """피드백 요청"""

    corrected_text: Optional[str] = Field(None, description="수정된 텍스트")
    corrected_data: Optional[Dict[str, Any]] = Field(
        None, description="수정된 구조화 데이터"
    )
    rating: Optional[int] = Field(None, ge=1, le=5, description="평점 (1-5)")
    comment: Optional[str] = Field(None, description="사용자 코멘트")
    issues: Optional[list] = Field(None, description="발견된 문제점 목록")


class FeedbackResponse(BaseModel):
    """피드백 응답"""

    success: bool = Field(description="처리 성공 여부")
    message: str = Field(description="처리 메시지")
    result_id: str = Field(description="결과 ID")
    feedback_id: str = Field(description="피드백 ID")


class TrainingDataRequest(BaseModel):
    """학습 데이터 생성 요청"""

    result_id: str = Field(description="OCR 결과 ID")
    ground_truth: Dict[str, Any] = Field(description="정답 데이터")
    data_type: str = Field(description="데이터 타입 (receipt, document 등)")
    tags: Optional[list] = Field(None, description="데이터 태그")


@router.post("/{result_id}", response_model=FeedbackResponse)
async def submit_feedback(
    result_id: str,
    feedback: FeedbackRequest = Body(..., description="피드백 데이터"),
):
    """
    OCR 결과에 대한 피드백 제출

    사용자가 OCR 결과를 검토하고 수정/평가한 내용을 저장합니다.
    이 데이터는 향후 모델 개선에 활용됩니다.

    Args:
        result_id: OCR 결과 ID
        feedback: 피드백 데이터

    Returns:
        FeedbackResponse: 피드백 처리 결과
    """
    try:
        # 결과 존재 확인
        result = storage.get_result(result_id)
        if not result:
            raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다.")

        # 피드백 데이터 구성
        feedback_data = {
            "submitted_at": datetime.utcnow().isoformat(),
            "corrected_text": feedback.corrected_text,
            "corrected_data": feedback.corrected_data,
            "rating": feedback.rating,
            "comment": feedback.comment,
            "issues": feedback.issues or [],
            "original_result": result.get("ocr_result"),
        }

        # 피드백 저장
        success = storage.update_result(result_id, feedback_data)

        if not success:
            raise HTTPException(
                status_code=500, detail="피드백 저장에 실패했습니다."
            )

        # 피드백 ID 생성 (타임스탬프 기반)
        feedback_id = f"{result_id}_{int(datetime.utcnow().timestamp())}"

        logger.info(
            "feedback_submitted",
            result_id=result_id,
            feedback_id=feedback_id,
            has_correction=feedback.corrected_text is not None,
            has_rating=feedback.rating is not None,
        )

        return FeedbackResponse(
            success=True,
            message="피드백이 성공적으로 제출되었습니다.",
            result_id=result_id,
            feedback_id=feedback_id,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("feedback_submission_failed", result_id=result_id, error=str(e))
        raise HTTPException(
            status_code=500, detail="피드백 제출 중 오류가 발생했습니다."
        )


@router.get("/{result_id}")
async def get_feedback(result_id: str):
    """
    OCR 결과의 피드백 조회

    Args:
        result_id: OCR 결과 ID

    Returns:
        dict: 피드백 데이터
    """
    try:
        result = storage.get_result(result_id)

        if not result:
            raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다.")

        feedback = result.get("user_feedback")

        if not feedback:
            return {
                "result_id": result_id,
                "has_feedback": False,
                "message": "피드백이 없습니다.",
            }

        logger.debug("feedback_retrieved", result_id=result_id)

        return {
            "result_id": result_id,
            "has_feedback": True,
            "feedback": feedback,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("feedback_retrieval_failed", result_id=result_id, error=str(e))
        raise HTTPException(
            status_code=500, detail="피드백 조회 중 오류가 발생했습니다."
        )


@router.post("/training-data")
async def create_training_data(
    request: TrainingDataRequest = Body(..., description="학습 데이터 요청"),
):
    """
    학습 데이터 생성

    사용자가 검증한 정답 데이터를 학습용으로 저장합니다.

    Args:
        request: 학습 데이터 생성 요청

    Returns:
        dict: 학습 데이터 생성 결과
    """
    try:
        # OCR 결과 조회
        result = storage.get_result(request.result_id)

        if not result:
            raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다.")

        # 학습 데이터 구성
        training_data = {
            "type": "training_data",
            "created_at": datetime.utcnow().isoformat(),
            "result_id": request.result_id,
            "original_filename": result.get("original_filename"),
            "data_type": request.data_type,
            "tags": request.tags or [],
            "ocr_output": result.get("ocr_result"),
            "ground_truth": request.ground_truth,
        }

        # 학습 데이터로 저장 (피드백에 추가)
        feedback_data = result.get("user_feedback", {})
        feedback_data["training_data"] = training_data

        success = storage.update_result(request.result_id, feedback_data)

        if not success:
            raise HTTPException(
                status_code=500, detail="학습 데이터 저장에 실패했습니다."
            )

        logger.info(
            "training_data_created",
            result_id=request.result_id,
            data_type=request.data_type,
            tags=request.tags,
        )

        return {
            "success": True,
            "message": "학습 데이터가 생성되었습니다.",
            "result_id": request.result_id,
            "data_type": request.data_type,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "training_data_creation_failed",
            result_id=request.result_id,
            error=str(e),
        )
        raise HTTPException(
            status_code=500, detail="학습 데이터 생성 중 오류가 발생했습니다."
        )


@router.get("/stats/summary")
async def get_feedback_statistics():
    """
    피드백 통계 조회

    Returns:
        dict: 피드백 통계
    """
    try:
        # 모든 결과 조회
        all_results = storage.list_results(limit=10000)

        total_results = len(all_results)
        with_feedback = sum(
            1 for r in all_results if r.get("user_feedback") is not None
        )
        with_training_data = sum(
            1
            for r in all_results
            if r.get("user_feedback", {}).get("training_data") is not None
        )

        # 평점 통계
        ratings = [
            r.get("user_feedback", {}).get("rating")
            for r in all_results
            if r.get("user_feedback", {}).get("rating") is not None
        ]

        avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0

        stats = {
            "total_results": total_results,
            "with_feedback": with_feedback,
            "with_training_data": with_training_data,
            "feedback_rate": (
                round(with_feedback / total_results * 100, 2) if total_results > 0 else 0
            ),
            "average_rating": avg_rating,
            "rating_distribution": {
                str(i): ratings.count(i) for i in range(1, 6)
            },
        }

        logger.debug("feedback_statistics_retrieved", stats=stats)
        return stats

    except Exception as e:
        logger.error("feedback_statistics_retrieval_failed", error=str(e))
        raise HTTPException(
            status_code=500, detail="피드백 통계 조회 중 오류가 발생했습니다."
        )
