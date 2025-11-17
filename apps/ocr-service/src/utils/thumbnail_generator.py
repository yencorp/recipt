"""
썸네일 생성 모듈
이미지 썸네일 자동 생성 및 최적화
"""

import io
from typing import Tuple, Optional
from PIL import Image, ImageOps
import structlog

logger = structlog.get_logger()


class ThumbnailGenerator:
    """
    썸네일 생성기

    원본 이미지를 다양한 크기의 썸네일로 변환
    """

    def __init__(self, config: Optional[dict] = None):
        """
        썸네일 생성기 초기화

        Args:
            config: 설정 딕셔너리
        """
        self.config = config or self._get_default_config()

    def _get_default_config(self) -> dict:
        """기본 설정 반환"""
        return {
            "thumbnail_sizes": {
                "small": (150, 150),
                "medium": (300, 300),
                "large": (600, 600),
            },
            "quality": 85,  # JPEG 품질 (1-100)
            "format": "JPEG",  # 출력 포맷
            "maintain_aspect_ratio": True,  # 비율 유지
        }

    def generate_thumbnail(
        self,
        image: Image.Image,
        size: str = "medium",
        custom_size: Optional[Tuple[int, int]] = None,
    ) -> bytes:
        """
        썸네일 생성

        Args:
            image: 원본 PIL Image
            size: 썸네일 크기 ("small", "medium", "large")
            custom_size: 커스텀 크기 (width, height)

        Returns:
            bytes: 썸네일 이미지 바이트
        """
        try:
            # 크기 결정
            if custom_size:
                target_size = custom_size
            else:
                target_size = self.config["thumbnail_sizes"].get(
                    size, self.config["thumbnail_sizes"]["medium"]
                )

            # 썸네일 생성
            thumbnail = image.copy()

            # 비율 유지하면서 리사이즈
            if self.config["maintain_aspect_ratio"]:
                thumbnail.thumbnail(target_size, Image.Resampling.LANCZOS)
            else:
                thumbnail = thumbnail.resize(target_size, Image.Resampling.LANCZOS)

            # 이미지 회전 정보 적용 (EXIF 기반)
            thumbnail = ImageOps.exif_transpose(thumbnail)

            # RGB 변환 (JPEG 저장을 위해)
            if thumbnail.mode in ("RGBA", "LA", "P"):
                # 투명도가 있는 이미지는 흰 배경으로 변환
                background = Image.new("RGB", thumbnail.size, (255, 255, 255))
                if thumbnail.mode == "P":
                    thumbnail = thumbnail.convert("RGBA")
                background.paste(thumbnail, mask=thumbnail.split()[-1] if thumbnail.mode in ("RGBA", "LA") else None)
                thumbnail = background
            elif thumbnail.mode != "RGB":
                thumbnail = thumbnail.convert("RGB")

            # 바이트로 변환
            output = io.BytesIO()
            thumbnail.save(
                output,
                format=self.config["format"],
                quality=self.config["quality"],
                optimize=True,
            )

            thumbnail_bytes = output.getvalue()

            logger.debug(
                "thumbnail_generated",
                size=size,
                target_size=target_size,
                actual_size=thumbnail.size,
                bytes=len(thumbnail_bytes),
            )

            return thumbnail_bytes

        except Exception as e:
            logger.error("thumbnail_generation_failed", size=size, error=str(e))
            raise

    def generate_multiple_sizes(
        self, image: Image.Image, sizes: list = None
    ) -> dict:
        """
        여러 크기의 썸네일 생성

        Args:
            image: 원본 PIL Image
            sizes: 생성할 크기 리스트 (기본값: ["small", "medium", "large"])

        Returns:
            dict: 크기별 썸네일 바이트 딕셔너리
        """
        if sizes is None:
            sizes = ["small", "medium", "large"]

        thumbnails = {}

        for size in sizes:
            try:
                thumbnail_bytes = self.generate_thumbnail(image, size=size)
                thumbnails[size] = thumbnail_bytes

                logger.debug(
                    "multiple_thumbnail_generated",
                    size=size,
                    bytes=len(thumbnail_bytes),
                )

            except Exception as e:
                logger.error(
                    "multiple_thumbnail_generation_failed", size=size, error=str(e)
                )
                thumbnails[size] = None

        logger.info(
            "multiple_thumbnails_completed",
            requested=len(sizes),
            successful=sum(1 for v in thumbnails.values() if v is not None),
        )

        return thumbnails

    def optimize_image(self, image: Image.Image, max_size: int = 1024) -> bytes:
        """
        이미지 최적화 (파일 크기 감소)

        Args:
            image: 원본 PIL Image
            max_size: 최대 너비/높이

        Returns:
            bytes: 최적화된 이미지 바이트
        """
        try:
            optimized = image.copy()

            # 크기 제한
            if max(optimized.size) > max_size:
                ratio = max_size / max(optimized.size)
                new_size = tuple(int(dim * ratio) for dim in optimized.size)
                optimized = optimized.resize(new_size, Image.Resampling.LANCZOS)

            # RGB 변환
            if optimized.mode != "RGB":
                if optimized.mode in ("RGBA", "LA", "P"):
                    background = Image.new("RGB", optimized.size, (255, 255, 255))
                    if optimized.mode == "P":
                        optimized = optimized.convert("RGBA")
                    background.paste(
                        optimized,
                        mask=optimized.split()[-1] if optimized.mode in ("RGBA", "LA") else None,
                    )
                    optimized = background
                else:
                    optimized = optimized.convert("RGB")

            # 최적화하여 저장
            output = io.BytesIO()
            optimized.save(
                output,
                format="JPEG",
                quality=self.config["quality"],
                optimize=True,
                progressive=True,  # 프로그레시브 JPEG
            )

            optimized_bytes = output.getvalue()

            logger.debug(
                "image_optimized",
                original_size=image.size,
                optimized_size=optimized.size,
                bytes=len(optimized_bytes),
            )

            return optimized_bytes

        except Exception as e:
            logger.error("image_optimization_failed", error=str(e))
            raise

    def get_image_info(self, image: Image.Image) -> dict:
        """
        이미지 정보 추출

        Args:
            image: PIL Image

        Returns:
            dict: 이미지 정보
        """
        return {
            "size": image.size,
            "width": image.size[0],
            "height": image.size[1],
            "mode": image.mode,
            "format": image.format,
            "aspect_ratio": round(image.size[0] / image.size[1], 2),
        }

    def update_config(self, new_config: dict) -> None:
        """
        설정 업데이트

        Args:
            new_config: 새로운 설정
        """
        self.config.update(new_config)
        logger.info("thumbnail_generator_config_updated", config=self.config)
