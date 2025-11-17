"""
이미지 처리 유틸리티 함수
OpenCV 기반 이미지 전처리 및 변환 함수 모음
"""

import cv2
import numpy as np
from typing import Tuple, Optional
from PIL import Image
import structlog

logger = structlog.get_logger()


def pil_to_cv2(image: Image.Image) -> np.ndarray:
    """
    PIL Image를 OpenCV 이미지로 변환

    Args:
        image: PIL Image 객체

    Returns:
        np.ndarray: OpenCV 이미지 (BGR)
    """
    # RGB -> BGR 변환
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)


def cv2_to_pil(image: np.ndarray) -> Image.Image:
    """
    OpenCV 이미지를 PIL Image로 변환

    Args:
        image: OpenCV 이미지 (BGR)

    Returns:
        Image.Image: PIL Image 객체
    """
    # BGR -> RGB 변환
    return Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))


def resize_image(
    image: np.ndarray, max_width: int = 2000, max_height: int = 2000
) -> np.ndarray:
    """
    이미지 크기 조정 (비율 유지)

    Args:
        image: OpenCV 이미지
        max_width: 최대 너비
        max_height: 최대 높이

    Returns:
        np.ndarray: 크기 조정된 이미지
    """
    height, width = image.shape[:2]

    if width <= max_width and height <= max_height:
        return image

    # 비율 계산
    ratio = min(max_width / width, max_height / height)
    new_width = int(width * ratio)
    new_height = int(height * ratio)

    return cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)


def detect_document_contour(image: np.ndarray) -> Optional[np.ndarray]:
    """
    문서(영수증) 윤곽선 감지

    Args:
        image: OpenCV 이미지 (BGR)

    Returns:
        Optional[np.ndarray]: 감지된 문서의 4개 모서리 좌표 또는 None
    """
    try:
        # 그레이스케일 변환
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # 가우시안 블러로 노이즈 제거
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # Canny 엣지 검출
        edges = cv2.Canny(blurred, 50, 150)

        # 윤곽선 찾기
        contours, _ = cv2.findContours(
            edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        if not contours:
            return None

        # 가장 큰 윤곽선 찾기
        contours = sorted(contours, key=cv2.contourArea, reverse=True)

        for contour in contours[:5]:  # 상위 5개 윤곽선 검사
            # 윤곽선 근사화
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * peri, True)

            # 4개의 점을 가진 윤곽선이면 문서로 간주
            if len(approx) == 4:
                return approx.reshape(4, 2)

        return None

    except Exception as e:
        logger.warning("document_contour_detection_failed", error=str(e))
        return None


def order_points(pts: np.ndarray) -> np.ndarray:
    """
    4개의 점을 왼쪽 위, 오른쪽 위, 오른쪽 아래, 왼쪽 아래 순서로 정렬

    Args:
        pts: 4개의 점 좌표 배열

    Returns:
        np.ndarray: 정렬된 점 좌표
    """
    rect = np.zeros((4, 2), dtype=np.float32)

    # 합이 가장 작은 점 = 왼쪽 위, 가장 큰 점 = 오른쪽 아래
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    # 차이가 가장 작은 점 = 오른쪽 위, 가장 큰 점 = 왼쪽 아래
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]

    return rect


def four_point_transform(image: np.ndarray, pts: np.ndarray) -> np.ndarray:
    """
    4개의 점을 기준으로 원근 변환 수행 (문서 평면화)

    Args:
        image: OpenCV 이미지
        pts: 4개의 점 좌표

    Returns:
        np.ndarray: 원근 변환된 이미지
    """
    # 점 순서 정렬
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    # 새로운 이미지의 너비 계산
    width_a = np.linalg.norm(br - bl)
    width_b = np.linalg.norm(tr - tl)
    max_width = max(int(width_a), int(width_b))

    # 새로운 이미지의 높이 계산
    height_a = np.linalg.norm(tr - br)
    height_b = np.linalg.norm(tl - bl)
    max_height = max(int(height_a), int(height_b))

    # 목표 좌표
    dst = np.array(
        [[0, 0], [max_width - 1, 0], [max_width - 1, max_height - 1], [0, max_height - 1]],
        dtype=np.float32,
    )

    # 원근 변환 행렬 계산 및 적용
    matrix = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, matrix, (max_width, max_height))

    return warped


def detect_rotation(image: np.ndarray) -> float:
    """
    이미지 회전 각도 감지 (텍스트 방향 기준)

    Args:
        image: OpenCV 이미지 (그레이스케일)

    Returns:
        float: 감지된 회전 각도 (도)
    """
    try:
        # 이진화
        _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # 허프 변환으로 선 검출
        edges = cv2.Canny(binary, 50, 150, apertureSize=3)
        lines = cv2.HoughLines(edges, 1, np.pi / 180, 100)

        if lines is None or len(lines) == 0:
            return 0.0

        # 각도 계산
        angles = []
        for rho, theta in lines[:, 0]:
            angle = np.degrees(theta) - 90
            angles.append(angle)

        # 중간값 사용 (평균보다 노이즈에 강함)
        median_angle = np.median(angles)

        # -45도에서 45도 범위로 정규화
        if median_angle < -45:
            median_angle += 90
        elif median_angle > 45:
            median_angle -= 90

        return median_angle

    except Exception as e:
        logger.warning("rotation_detection_failed", error=str(e))
        return 0.0


def rotate_image(image: np.ndarray, angle: float) -> np.ndarray:
    """
    이미지 회전

    Args:
        image: OpenCV 이미지
        angle: 회전 각도 (도, 시계 반대 방향)

    Returns:
        np.ndarray: 회전된 이미지
    """
    if abs(angle) < 0.5:  # 각도가 너무 작으면 회전하지 않음
        return image

    height, width = image.shape[:2]
    center = (width // 2, height // 2)

    # 회전 행렬 계산
    rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)

    # 회전 후 이미지 크기 계산
    cos = np.abs(rotation_matrix[0, 0])
    sin = np.abs(rotation_matrix[0, 1])

    new_width = int((height * sin) + (width * cos))
    new_height = int((height * cos) + (width * sin))

    # 회전 행렬 조정
    rotation_matrix[0, 2] += (new_width / 2) - center[0]
    rotation_matrix[1, 2] += (new_height / 2) - center[1]

    # 이미지 회전
    rotated = cv2.warpAffine(
        image, rotation_matrix, (new_width, new_height), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
    )

    return rotated


def enhance_contrast(image: np.ndarray) -> np.ndarray:
    """
    이미지 대비 향상 (CLAHE 적용)

    Args:
        image: OpenCV 이미지 (그레이스케일)

    Returns:
        np.ndarray: 대비가 향상된 이미지
    """
    # CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(image)

    return enhanced


def remove_noise(image: np.ndarray, method: str = "bilateral") -> np.ndarray:
    """
    이미지 노이즈 제거

    Args:
        image: OpenCV 이미지
        method: 노이즈 제거 방법 ("bilateral", "median", "gaussian", "nlmeans")

    Returns:
        np.ndarray: 노이즈가 제거된 이미지
    """
    if method == "bilateral":
        # 엣지를 보존하면서 노이즈 제거
        return cv2.bilateralFilter(image, 9, 75, 75)
    elif method == "median":
        # 중간값 필터
        return cv2.medianBlur(image, 5)
    elif method == "gaussian":
        # 가우시안 블러
        return cv2.GaussianBlur(image, (5, 5), 0)
    elif method == "nlmeans":
        # Non-local Means Denoising (가장 느리지만 효과적)
        return cv2.fastNlMeansDenoising(image, None, 10, 7, 21)
    else:
        return image


def binarize_image(image: np.ndarray, method: str = "otsu") -> np.ndarray:
    """
    이미지 이진화

    Args:
        image: OpenCV 이미지 (그레이스케일)
        method: 이진화 방법 ("otsu", "adaptive", "simple")

    Returns:
        np.ndarray: 이진화된 이미지
    """
    if method == "otsu":
        # Otsu's thresholding
        _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return binary
    elif method == "adaptive":
        # Adaptive thresholding
        return cv2.adaptiveThreshold(
            image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
    elif method == "simple":
        # Simple thresholding
        _, binary = cv2.threshold(image, 127, 255, cv2.THRESH_BINARY)
        return binary
    else:
        return image


def morph_operations(
    image: np.ndarray, operation: str = "close", kernel_size: Tuple[int, int] = (2, 2)
) -> np.ndarray:
    """
    모폴로지 연산 (텍스트 개선)

    Args:
        image: OpenCV 이미지 (이진화된 이미지)
        operation: 연산 종류 ("close", "open", "dilate", "erode")
        kernel_size: 커널 크기

    Returns:
        np.ndarray: 모폴로지 연산이 적용된 이미지
    """
    kernel = np.ones(kernel_size, np.uint8)

    if operation == "close":
        # Closing (작은 구멍 제거)
        return cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel)
    elif operation == "open":
        # Opening (작은 노이즈 제거)
        return cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel)
    elif operation == "dilate":
        # Dilation (확장)
        return cv2.dilate(image, kernel, iterations=1)
    elif operation == "erode":
        # Erosion (침식)
        return cv2.erode(image, kernel, iterations=1)
    else:
        return image
