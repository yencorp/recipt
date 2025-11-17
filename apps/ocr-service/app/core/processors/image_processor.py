"""이미지 전처리 프로세서"""

import cv2
import numpy as np
from PIL import Image, ImageEnhance
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class ImageProcessor:
    """영수증 이미지 전처리"""

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

    async def _perspective_transform(
        self, image: np.ndarray, corners: np.ndarray
    ) -> np.ndarray:
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
        dst = np.array(
            [
                [0, 0],
                [max_width - 1, 0],
                [max_width - 1, max_height - 1],
                [0, max_height - 1],
            ],
            dtype=np.float32,
        )

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
        lines = cv2.HoughLinesP(
            edges, 1, np.pi / 180, 100, minLineLength=100, maxLineGap=10
        )

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
            return cv2.resize(
                image, (new_width, new_height), interpolation=cv2.INTER_AREA
            )
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
