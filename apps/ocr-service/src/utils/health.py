"""
OCR 서비스 헬스체크 유틸리티
시스템 상태 모니터링 및 진단
"""

import os
import time
import psutil
import platform
from datetime import datetime
from typing import Dict, Any
from pathlib import Path

import pytesseract
from PIL import Image
import cv2


class HealthChecker:
    """헬스체크 관리 클래스"""
    
    def __init__(self):
        self.start_time = time.time()
    
    async def get_health_status(self) -> Dict[str, Any]:
        """전체 시스템 헬스 상태 반환"""
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "uptime": time.time() - self.start_time,
            "services": {
                "ocr_engine": await self._check_ocr_engine(),
                "system": await self._check_system_resources(),
                "storage": await self._check_storage(),
                "dependencies": await self._check_dependencies()
            }
        }
    
    async def _check_ocr_engine(self) -> Dict[str, Any]:
        """OCR 엔진 상태 확인"""
        try:
            # Tesseract 버전 확인
            tesseract_version = pytesseract.get_tesseract_version()
            
            # 테스트 이미지로 OCR 테스트
            test_result = await self._test_ocr_functionality()
            
            return {
                "status": "healthy" if test_result["success"] else "degraded",
                "tesseract_version": str(tesseract_version),
                "test_result": test_result,
                "available_languages": self._get_available_languages()
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "tesseract_version": None,
                "test_result": {"success": False, "error": str(e)}
            }
    
    async def _test_ocr_functionality(self) -> Dict[str, Any]:
        """OCR 기능 테스트"""
        try:
            # 간단한 테스트 이미지 생성 (PIL 사용)
            from PIL import Image, ImageDraw, ImageFont
            import io
            
            # 테스트 이미지 생성
            img = Image.new('RGB', (200, 50), color='white')
            draw = ImageDraw.Draw(img)
            draw.text((10, 10), "TEST 123", fill='black')
            
            # OCR 테스트
            start_time = time.time()
            text = pytesseract.image_to_string(img, lang='eng')
            processing_time = time.time() - start_time
            
            success = "TEST" in text or "123" in text
            
            return {
                "success": success,
                "extracted_text": text.strip(),
                "processing_time": round(processing_time, 3)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "processing_time": 0
            }
    
    def _get_available_languages(self) -> list:
        """사용 가능한 OCR 언어 목록"""
        try:
            langs = pytesseract.get_languages(config='')
            return sorted(langs)
        except:
            return ["eng"]  # 기본값
    
    async def _check_system_resources(self) -> Dict[str, Any]:
        """시스템 리소스 상태 확인"""
        try:
            # CPU 사용률
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # 메모리 사용률
            memory = psutil.virtual_memory()
            
            # 디스크 사용률
            disk = psutil.disk_usage('/')
            
            # 시스템 정보
            system_info = {
                "platform": platform.platform(),
                "python_version": platform.python_version(),
                "cpu_count": psutil.cpu_count()
            }
            
            # 상태 판정
            status = "healthy"
            if cpu_percent > 80 or memory.percent > 85 or disk.percent > 90:
                status = "degraded"
            if cpu_percent > 95 or memory.percent > 95 or disk.percent > 98:
                status = "unhealthy"
            
            return {
                "status": status,
                "cpu_percent": round(cpu_percent, 2),
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": round(memory.percent, 2),
                    "used": memory.used
                },
                "disk": {
                    "total": disk.total,
                    "free": disk.free,
                    "percent": round(disk.percent, 2),
                    "used": disk.used
                },
                "system": system_info
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    async def _check_storage(self) -> Dict[str, Any]:
        """스토리지 상태 확인"""
        try:
            from .config import get_settings
            settings = get_settings()
            
            # 필요한 디렉토리 확인
            directories = {
                "upload_dir": settings.UPLOAD_DIR,
                "log_dir": settings.LOG_DIR,
                "temp_dir": settings.TEMP_DIR
            }
            
            status = "healthy"
            directory_status = {}
            
            for name, path in directories.items():
                try:
                    Path(path).mkdir(parents=True, exist_ok=True)
                    
                    # 쓰기 테스트
                    test_file = Path(path) / ".health_check"
                    test_file.write_text("health check")
                    test_file.unlink()  # 삭제
                    
                    directory_status[name] = {
                        "status": "healthy",
                        "path": str(path),
                        "exists": True,
                        "writable": True
                    }
                    
                except Exception as e:
                    directory_status[name] = {
                        "status": "unhealthy",
                        "path": str(path),
                        "exists": Path(path).exists(),
                        "writable": False,
                        "error": str(e)
                    }
                    status = "unhealthy"
            
            return {
                "status": status,
                "directories": directory_status
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    async def _check_dependencies(self) -> Dict[str, Any]:
        """의존성 패키지 상태 확인"""
        try:
            dependencies = {}
            
            # 주요 의존성 확인
            import_tests = {
                "pytesseract": lambda: pytesseract.__version__,
                "cv2": lambda: cv2.__version__,
                "PIL": lambda: Image.__version__ if hasattr(Image, '__version__') else "unknown",
                "numpy": lambda: __import__("numpy").__version__,
                "fastapi": lambda: __import__("fastapi").__version__,
                "uvicorn": lambda: __import__("uvicorn").__version__
            }
            
            status = "healthy"
            
            for name, version_func in import_tests.items():
                try:
                    version = version_func()
                    dependencies[name] = {
                        "status": "available",
                        "version": version
                    }
                except Exception as e:
                    dependencies[name] = {
                        "status": "unavailable",
                        "error": str(e)
                    }
                    status = "degraded"
            
            return {
                "status": status,
                "packages": dependencies
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }