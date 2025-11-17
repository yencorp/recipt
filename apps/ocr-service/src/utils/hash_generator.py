"""
이미지 해시 생성 모듈
중복 이미지 감지 및 캐시 키 생성
"""

import hashlib
import io
from typing import Union
from PIL import Image
import imagehash
import structlog

logger = structlog.get_logger()


class ImageHashGenerator:
    """
    이미지 해시 생성기

    다양한 해시 알고리즘을 사용하여 이미지 고유 식별자 생성
    """

    @staticmethod
    def generate_content_hash(image_bytes: bytes) -> str:
        """
        이미지 바이트 기반 콘텐츠 해시 생성 (MD5)

        동일한 파일은 동일한 해시 반환

        Args:
            image_bytes: 이미지 바이트

        Returns:
            str: MD5 해시 (hex)
        """
        try:
            md5_hash = hashlib.md5(image_bytes)
            return md5_hash.hexdigest()

        except Exception as e:
            logger.error("content_hash_generation_failed", error=str(e))
            raise

    @staticmethod
    def generate_perceptual_hash(
        image: Union[Image.Image, bytes], hash_size: int = 8
    ) -> str:
        """
        지각적 해시 생성 (pHash)

        시각적으로 유사한 이미지는 유사한 해시 반환
        - 약간의 크기 변경, 압축, 밝기 조정에도 동일한 해시
        - 회전, 크롭에는 다른 해시

        Args:
            image: PIL Image 또는 이미지 바이트
            hash_size: 해시 크기 (기본값: 8)

        Returns:
            str: pHash (hex)
        """
        try:
            # bytes인 경우 PIL Image로 변환
            if isinstance(image, bytes):
                image = Image.open(io.BytesIO(image))

            # pHash 생성
            phash = imagehash.phash(image, hash_size=hash_size)
            return str(phash)

        except Exception as e:
            logger.error("perceptual_hash_generation_failed", error=str(e))
            raise

    @staticmethod
    def generate_average_hash(image: Union[Image.Image, bytes], hash_size: int = 8) -> str:
        """
        평균 해시 생성 (aHash)

        간단하고 빠른 해시 알고리즘
        - 이미지를 작은 그레이스케일로 변환 후 평균 밝기 기준 비트 생성

        Args:
            image: PIL Image 또는 이미지 바이트
            hash_size: 해시 크기 (기본값: 8)

        Returns:
            str: aHash (hex)
        """
        try:
            if isinstance(image, bytes):
                image = Image.open(io.BytesIO(image))

            ahash = imagehash.average_hash(image, hash_size=hash_size)
            return str(ahash)

        except Exception as e:
            logger.error("average_hash_generation_failed", error=str(e))
            raise

    @staticmethod
    def generate_difference_hash(
        image: Union[Image.Image, bytes], hash_size: int = 8
    ) -> str:
        """
        차이 해시 생성 (dHash)

        인접 픽셀 간 밝기 차이 기반 해시
        - 이미지 그레디언트 패턴 캡처
        - 압축, 색상 변화에 강함

        Args:
            image: PIL Image 또는 이미지 바이트
            hash_size: 해시 크기 (기본값: 8)

        Returns:
            str: dHash (hex)
        """
        try:
            if isinstance(image, bytes):
                image = Image.open(io.BytesIO(image))

            dhash = imagehash.dhash(image, hash_size=hash_size)
            return str(dhash)

        except Exception as e:
            logger.error("difference_hash_generation_failed", error=str(e))
            raise

    @staticmethod
    def generate_wavelet_hash(
        image: Union[Image.Image, bytes], hash_size: int = 8
    ) -> str:
        """
        웨이블릿 해시 생성 (wHash)

        이산 웨이블릿 변환 기반 해시
        - 회전, 크기 변경에 강함
        - 계산 비용이 높지만 정확도 우수

        Args:
            image: PIL Image 또는 이미지 바이트
            hash_size: 해시 크기 (기본값: 8)

        Returns:
            str: wHash (hex)
        """
        try:
            if isinstance(image, bytes):
                image = Image.open(io.BytesIO(image))

            whash = imagehash.whash(image, hash_size=hash_size)
            return str(whash)

        except Exception as e:
            logger.error("wavelet_hash_generation_failed", error=str(e))
            raise

    @staticmethod
    def generate_cache_key(
        image_bytes: bytes,
        lang: str = "kor",
        preprocessing_config: dict = None,
    ) -> str:
        """
        캐시 키 생성

        이미지 콘텐츠 + 처리 파라미터를 조합한 고유 키 생성

        Args:
            image_bytes: 이미지 바이트
            lang: 언어 코드
            preprocessing_config: 전처리 설정

        Returns:
            str: 캐시 키
        """
        try:
            # 콘텐츠 해시
            content_hash = ImageHashGenerator.generate_content_hash(image_bytes)

            # 파라미터 해시 (언어 + 전처리 설정)
            param_string = f"{lang}"
            if preprocessing_config:
                # 설정을 정렬된 문자열로 변환
                config_str = str(sorted(preprocessing_config.items()))
                param_string += config_str

            param_hash = hashlib.md5(param_string.encode()).hexdigest()[:8]

            # 최종 캐시 키
            cache_key = f"ocr:{content_hash}:{param_hash}"

            logger.debug(
                "cache_key_generated",
                content_hash=content_hash[:8],
                param_hash=param_hash,
                lang=lang,
            )

            return cache_key

        except Exception as e:
            logger.error("cache_key_generation_failed", error=str(e))
            raise

    @staticmethod
    def calculate_hamming_distance(hash1: str, hash2: str) -> int:
        """
        해밍 거리 계산 (두 해시의 차이)

        낮을수록 유사한 이미지

        Args:
            hash1: 첫 번째 해시
            hash2: 두 번째 해시

        Returns:
            int: 해밍 거리 (0 = 동일)
        """
        try:
            # imagehash 객체로 변환 후 거리 계산
            h1 = imagehash.hex_to_hash(hash1)
            h2 = imagehash.hex_to_hash(hash2)

            return h1 - h2

        except Exception as e:
            logger.error("hamming_distance_calculation_failed", error=str(e))
            return 999  # 에러 시 큰 값 반환 (유사하지 않음)

    @staticmethod
    def is_duplicate(
        image_bytes1: bytes,
        image_bytes2: bytes,
        threshold: int = 5,
        method: str = "perceptual",
    ) -> bool:
        """
        두 이미지가 중복인지 판단

        Args:
            image_bytes1: 첫 번째 이미지 바이트
            image_bytes2: 두 번째 이미지 바이트
            threshold: 해밍 거리 임계값 (기본값: 5)
            method: 해시 방법 (perceptual/average/difference/wavelet)

        Returns:
            bool: 중복 여부
        """
        try:
            # 해시 생성 메서드 선택
            hash_methods = {
                "perceptual": ImageHashGenerator.generate_perceptual_hash,
                "average": ImageHashGenerator.generate_average_hash,
                "difference": ImageHashGenerator.generate_difference_hash,
                "wavelet": ImageHashGenerator.generate_wavelet_hash,
            }

            hash_func = hash_methods.get(method, hash_methods["perceptual"])

            # 해시 생성
            hash1 = hash_func(image_bytes1)
            hash2 = hash_func(image_bytes2)

            # 해밍 거리 계산
            distance = ImageHashGenerator.calculate_hamming_distance(hash1, hash2)

            is_dup = distance <= threshold

            logger.debug(
                "duplicate_check",
                method=method,
                distance=distance,
                threshold=threshold,
                is_duplicate=is_dup,
            )

            return is_dup

        except Exception as e:
            logger.error("duplicate_check_failed", error=str(e))
            return False
