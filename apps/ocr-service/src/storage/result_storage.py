"""
OCR 결과 저장 모듈
OCR 처리 결과 및 썸네일 저장/조회
"""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
import structlog

logger = structlog.get_logger()


class OCRResultStorage:
    """
    OCR 결과 저장소

    파일 기반 OCR 결과 저장 및 관리
    (향후 데이터베이스로 마이그레이션 가능)
    """

    def __init__(self, storage_dir: str = "/app/storage"):
        """
        저장소 초기화

        Args:
            storage_dir: 저장 디렉토리 경로
        """
        self.storage_dir = Path(storage_dir)
        self.results_dir = self.storage_dir / "results"
        self.thumbnails_dir = self.storage_dir / "thumbnails"
        self.images_dir = self.storage_dir / "images"

        # 디렉토리 생성
        self._init_directories()

    def _init_directories(self) -> None:
        """저장 디렉토리 초기화"""
        for directory in [self.results_dir, self.thumbnails_dir, self.images_dir]:
            directory.mkdir(parents=True, exist_ok=True)

        logger.info("storage_directories_initialized", storage_dir=str(self.storage_dir))

    def save_result(
        self,
        ocr_result: Dict[str, Any],
        original_filename: str,
        image_bytes: Optional[bytes] = None,
        thumbnails: Optional[Dict[str, bytes]] = None,
    ) -> str:
        """
        OCR 결과 저장

        Args:
            ocr_result: OCR 처리 결과
            original_filename: 원본 파일명
            image_bytes: 원본 이미지 바이트 (선택)
            thumbnails: 썸네일 딕셔너리 (선택)

        Returns:
            str: 결과 ID (UUID)
        """
        try:
            # UUID 생성
            result_id = str(uuid.uuid4())

            # 메타데이터 구성
            metadata = {
                "id": result_id,
                "original_filename": original_filename,
                "created_at": datetime.utcnow().isoformat(),
                "ocr_result": ocr_result,
                "has_image": image_bytes is not None,
                "has_thumbnails": thumbnails is not None and len(thumbnails) > 0,
            }

            # JSON 파일로 저장
            result_file = self.results_dir / f"{result_id}.json"
            with open(result_file, "w", encoding="utf-8") as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)

            # 원본 이미지 저장 (선택)
            if image_bytes:
                image_file = self.images_dir / f"{result_id}.jpg"
                with open(image_file, "wb") as f:
                    f.write(image_bytes)

            # 썸네일 저장 (선택)
            if thumbnails:
                for size, thumbnail_bytes in thumbnails.items():
                    if thumbnail_bytes:
                        thumbnail_file = self.thumbnails_dir / f"{result_id}_{size}.jpg"
                        with open(thumbnail_file, "wb") as f:
                            f.write(thumbnail_bytes)

            logger.info(
                "ocr_result_saved",
                result_id=result_id,
                filename=original_filename,
                has_image=metadata["has_image"],
                has_thumbnails=metadata["has_thumbnails"],
            )

            return result_id

        except Exception as e:
            logger.error("ocr_result_save_failed", filename=original_filename, error=str(e))
            raise

    def get_result(self, result_id: str) -> Optional[Dict[str, Any]]:
        """
        OCR 결과 조회

        Args:
            result_id: 결과 ID

        Returns:
            Optional[Dict[str, Any]]: OCR 결과 메타데이터
        """
        try:
            result_file = self.results_dir / f"{result_id}.json"

            if not result_file.exists():
                logger.warning("result_not_found", result_id=result_id)
                return None

            with open(result_file, "r", encoding="utf-8") as f:
                metadata = json.load(f)

            logger.debug("ocr_result_retrieved", result_id=result_id)
            return metadata

        except Exception as e:
            logger.error("ocr_result_retrieval_failed", result_id=result_id, error=str(e))
            return None

    def get_image(self, result_id: str) -> Optional[bytes]:
        """
        원본 이미지 조회

        Args:
            result_id: 결과 ID

        Returns:
            Optional[bytes]: 이미지 바이트
        """
        try:
            image_file = self.images_dir / f"{result_id}.jpg"

            if not image_file.exists():
                logger.debug("image_not_found", result_id=result_id)
                return None

            with open(image_file, "rb") as f:
                image_bytes = f.read()

            logger.debug("image_retrieved", result_id=result_id, size=len(image_bytes))
            return image_bytes

        except Exception as e:
            logger.error("image_retrieval_failed", result_id=result_id, error=str(e))
            return None

    def get_thumbnail(self, result_id: str, size: str = "medium") -> Optional[bytes]:
        """
        썸네일 조회

        Args:
            result_id: 결과 ID
            size: 썸네일 크기

        Returns:
            Optional[bytes]: 썸네일 바이트
        """
        try:
            thumbnail_file = self.thumbnails_dir / f"{result_id}_{size}.jpg"

            if not thumbnail_file.exists():
                logger.debug("thumbnail_not_found", result_id=result_id, size=size)
                return None

            with open(thumbnail_file, "rb") as f:
                thumbnail_bytes = f.read()

            logger.debug(
                "thumbnail_retrieved",
                result_id=result_id,
                size=size,
                bytes=len(thumbnail_bytes),
            )
            return thumbnail_bytes

        except Exception as e:
            logger.error(
                "thumbnail_retrieval_failed", result_id=result_id, size=size, error=str(e)
            )
            return None

    def update_result(self, result_id: str, updates: Dict[str, Any]) -> bool:
        """
        OCR 결과 업데이트 (사용자 피드백)

        Args:
            result_id: 결과 ID
            updates: 업데이트할 데이터

        Returns:
            bool: 업데이트 성공 여부
        """
        try:
            metadata = self.get_result(result_id)

            if not metadata:
                logger.warning("result_not_found_for_update", result_id=result_id)
                return False

            # 업데이트 적용
            metadata["updated_at"] = datetime.utcnow().isoformat()
            metadata["user_feedback"] = updates

            # 저장
            result_file = self.results_dir / f"{result_id}.json"
            with open(result_file, "w", encoding="utf-8") as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)

            logger.info("ocr_result_updated", result_id=result_id)
            return True

        except Exception as e:
            logger.error("ocr_result_update_failed", result_id=result_id, error=str(e))
            return False

    def delete_result(self, result_id: str) -> bool:
        """
        OCR 결과 삭제

        Args:
            result_id: 결과 ID

        Returns:
            bool: 삭제 성공 여부
        """
        try:
            deleted_files = 0

            # JSON 파일 삭제
            result_file = self.results_dir / f"{result_id}.json"
            if result_file.exists():
                result_file.unlink()
                deleted_files += 1

            # 이미지 파일 삭제
            image_file = self.images_dir / f"{result_id}.jpg"
            if image_file.exists():
                image_file.unlink()
                deleted_files += 1

            # 썸네일 파일 삭제
            for thumbnail_file in self.thumbnails_dir.glob(f"{result_id}_*.jpg"):
                thumbnail_file.unlink()
                deleted_files += 1

            logger.info(
                "ocr_result_deleted", result_id=result_id, deleted_files=deleted_files
            )
            return deleted_files > 0

        except Exception as e:
            logger.error("ocr_result_deletion_failed", result_id=result_id, error=str(e))
            return False

    def list_results(
        self, limit: int = 100, offset: int = 0, order_by: str = "created_at"
    ) -> List[Dict[str, Any]]:
        """
        OCR 결과 목록 조회

        Args:
            limit: 조회 개수
            offset: 시작 오프셋
            order_by: 정렬 기준

        Returns:
            List[Dict[str, Any]]: 결과 목록
        """
        try:
            results = []

            # 모든 JSON 파일 읽기
            for result_file in self.results_dir.glob("*.json"):
                try:
                    with open(result_file, "r", encoding="utf-8") as f:
                        metadata = json.load(f)
                        results.append(metadata)
                except Exception as e:
                    logger.warning(
                        "result_file_read_failed", file=str(result_file), error=str(e)
                    )

            # 정렬
            if order_by == "created_at":
                results.sort(key=lambda x: x.get("created_at", ""), reverse=True)

            # 페이지네이션
            paginated_results = results[offset : offset + limit]

            logger.debug(
                "results_listed",
                total=len(results),
                returned=len(paginated_results),
                limit=limit,
                offset=offset,
            )

            return paginated_results

        except Exception as e:
            logger.error("results_listing_failed", error=str(e))
            return []

    def get_statistics(self) -> Dict[str, Any]:
        """
        저장소 통계 조회

        Returns:
            Dict[str, Any]: 통계 정보
        """
        try:
            total_results = len(list(self.results_dir.glob("*.json")))
            total_images = len(list(self.images_dir.glob("*.jpg")))
            total_thumbnails = len(list(self.thumbnails_dir.glob("*.jpg")))

            # 디스크 사용량 계산
            def get_dir_size(directory: Path) -> int:
                return sum(f.stat().st_size for f in directory.rglob("*") if f.is_file())

            storage_size = {
                "results": get_dir_size(self.results_dir),
                "images": get_dir_size(self.images_dir),
                "thumbnails": get_dir_size(self.thumbnails_dir),
            }

            stats = {
                "total_results": total_results,
                "total_images": total_images,
                "total_thumbnails": total_thumbnails,
                "storage_size_bytes": storage_size,
                "storage_size_mb": {
                    k: round(v / (1024 * 1024), 2) for k, v in storage_size.items()
                },
            }

            logger.debug("storage_statistics_retrieved", stats=stats)
            return stats

        except Exception as e:
            logger.error("statistics_retrieval_failed", error=str(e))
            return {}
