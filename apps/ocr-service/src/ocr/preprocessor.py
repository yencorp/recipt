"""
이미지 전처리 파이프라인
영수증 이미지 최적화 및 OCR 품질 향상
"""

import cv2
import numpy as np
from typing import Dict, Any, Optional
from PIL import Image, ImageEnhance
import structlog

from ..utils import image_utils

logger = structlog.get_logger()


class ImagePreprocessor:
    """
    이미지 전처리 클래스

    영수증 OCR을 위한 이미지 최적화 파이프라인
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        전처리기 초기화

        Args:
            config: 전처리 설정
        """
        self.config = config or self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """기본 전처리 설정 반환"""
        return {
            "auto_crop": True,  # 자동 크로핑 활성화
            "auto_rotate": True,  # 자동 회전 보정 활성화
            "denoise_method": "bilateral",  # 노이즈 제거 방법
            "contrast_enhancement": True,  # 대비 향상 활성화
            "binarization_method": "otsu",  # 이진화 방법
            "morph_operations": True,  # 모폴로지 연산 활성화
            "resize_max_width": 2000,  # 최대 너비
            "resize_max_height": 2000,  # 최대 높이
        }

    def preprocess(
        self, image: Image.Image, return_steps: bool = False
    ) -> Image.Image | Dict[str, Image.Image]:
        """
        이미지 전처리 파이프라인 실행

        Args:
            image: 원본 PIL Image
            return_steps: True일 경우 각 단계별 이미지 반환

        Returns:
            Image.Image 또는 Dict[str, Image.Image]: 전처리된 이미지 또는 단계별 이미지들
        """
        try:
            steps = {"original": image.copy()}

            # 1. PIL -> OpenCV 변환
            cv_image = image_utils.pil_to_cv2(image)
            logger.debug("preprocessing_step", step="pil_to_cv2", shape=cv_image.shape)

            # 2. 이미지 크기 조정 (성능 최적화)
            cv_image = image_utils.resize_image(
                cv_image,
                self.config["resize_max_width"],
                self.config["resize_max_height"],
            )
            if return_steps:
                steps["resized"] = image_utils.cv2_to_pil(cv_image)
            logger.debug("preprocessing_step", step="resize", shape=cv_image.shape)

            # 3. 영수증 영역 자동 감지 및 크로핑
            if self.config["auto_crop"]:
                cv_image = self._auto_crop_document(cv_image)
                if return_steps:
                    steps["cropped"] = image_utils.cv2_to_pil(cv_image)
                logger.debug("preprocessing_step", step="auto_crop", shape=cv_image.shape)

            # 4. 그레이스케일 변환
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            if return_steps:
                steps["grayscale"] = Image.fromarray(gray)
            logger.debug("preprocessing_step", step="grayscale", shape=gray.shape)

            # 5. 회전 보정
            if self.config["auto_rotate"]:
                gray = self._auto_rotate(gray)
                if return_steps:
                    steps["rotated"] = Image.fromarray(gray)
                logger.debug("preprocessing_step", step="auto_rotate", shape=gray.shape)

            # 6. 노이즈 제거
            denoised = image_utils.remove_noise(gray, self.config["denoise_method"])
            if return_steps:
                steps["denoised"] = Image.fromarray(denoised)
            logger.debug("preprocessing_step", step="denoise")

            # 7. 대비 향상
            if self.config["contrast_enhancement"]:
                enhanced = image_utils.enhance_contrast(denoised)
                if return_steps:
                    steps["contrast_enhanced"] = Image.fromarray(enhanced)
                logger.debug("preprocessing_step", step="contrast_enhancement")
            else:
                enhanced = denoised

            # 8. 이진화
            binary = image_utils.binarize_image(
                enhanced, self.config["binarization_method"]
            )
            if return_steps:
                steps["binarized"] = Image.fromarray(binary)
            logger.debug("preprocessing_step", step="binarization")

            # 9. 모폴로지 연산 (텍스트 개선)
            if self.config["morph_operations"]:
                processed = image_utils.morph_operations(binary, "close", (2, 2))
                if return_steps:
                    steps["morphed"] = Image.fromarray(processed)
                logger.debug("preprocessing_step", step="morph_operations")
            else:
                processed = binary

            # 10. PIL 추가 전처리
            pil_image = Image.fromarray(processed)
            pil_image = self._pil_enhancement(pil_image)
            if return_steps:
                steps["final"] = pil_image

            logger.info("preprocessing_completed", steps=len(steps))

            if return_steps:
                return steps
            else:
                return pil_image

        except Exception as e:
            logger.error("preprocessing_failed", error=str(e))
            # 전처리 실패 시 원본 이미지 반환
            return image if not return_steps else {"original": image, "final": image}

    def _auto_crop_document(self, image: np.ndarray) -> np.ndarray:
        """
        영수증 영역 자동 감지 및 크로핑

        Args:
            image: OpenCV 이미지 (BGR)

        Returns:
            np.ndarray: 크로핑된 이미지
        """
        try:
            # 문서 윤곽선 감지
            contour = image_utils.detect_document_contour(image)

            if contour is not None:
                # 원근 변환으로 문서 평면화
                warped = image_utils.four_point_transform(image, contour)
                logger.debug("document_cropped", original_shape=image.shape, cropped_shape=warped.shape)
                return warped
            else:
                logger.debug("no_document_contour_detected")
                return image

        except Exception as e:
            logger.warning("auto_crop_failed", error=str(e))
            return image

    def _auto_rotate(self, image: np.ndarray) -> np.ndarray:
        """
        이미지 회전 자동 보정

        Args:
            image: OpenCV 이미지 (그레이스케일)

        Returns:
            np.ndarray: 회전 보정된 이미지
        """
        try:
            # 회전 각도 감지
            angle = image_utils.detect_rotation(image)

            if abs(angle) > 0.5:  # 0.5도 이상일 때만 회전
                rotated = image_utils.rotate_image(image, angle)
                logger.debug("image_rotated", angle=angle)
                return rotated
            else:
                logger.debug("no_rotation_needed", angle=angle)
                return image

        except Exception as e:
            logger.warning("auto_rotate_failed", error=str(e))
            return image

    def _pil_enhancement(self, image: Image.Image) -> Image.Image:
        """
        PIL 기반 추가 전처리

        Args:
            image: PIL Image

        Returns:
            Image.Image: 향상된 이미지
        """
        try:
            # 선명도 향상
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(1.5)

            # 대비 향상
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)

            logger.debug("pil_enhancement_applied")
            return image

        except Exception as e:
            logger.warning("pil_enhancement_failed", error=str(e))
            return image

    def get_config(self) -> Dict[str, Any]:
        """현재 전처리 설정 반환"""
        return self.config.copy()

    def update_config(self, new_config: Dict[str, Any]) -> None:
        """
        전처리 설정 업데이트

        Args:
            new_config: 새로운 설정 (일부만 업데이트 가능)
        """
        self.config.update(new_config)
        logger.info("preprocessing_config_updated", config=self.config)
