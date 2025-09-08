"""
Test configuration and fixtures for OCR Service
"""

import asyncio
import os
import tempfile
from typing import Generator
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

# Set test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["REDIS_URL"] = "redis://localhost:6379/15"  # Use different DB for tests


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI app."""
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def temp_image():
    """Create a temporary image file for testing."""
    import io

    from PIL import Image

    # Create a simple test image
    image = Image.new("RGB", (100, 100), color="white")
    img_bytes = io.BytesIO()
    image.save(img_bytes, format="PNG")
    img_bytes.seek(0)

    return img_bytes


@pytest.fixture
def mock_tesseract():
    """Mock Tesseract OCR functionality."""
    with pytest.mock.patch("pytesseract.image_to_string") as mock:
        mock.return_value = "Test OCR Result"
        yield mock


@pytest.fixture
def sample_receipt_data():
    """Sample receipt data for testing."""
    return {
        "date": "2024-01-15",
        "store_name": "테스트 상점",
        "total_amount": 15000,
        "items": [
            {"name": "사과", "price": 5000, "quantity": 1},
            {"name": "바나나", "price": 10000, "quantity": 1},
        ],
    }


@pytest.fixture(autouse=True)
def cleanup_test_files():
    """Clean up any temporary files created during tests."""
    yield
    # Clean up temp files
    temp_dir = tempfile.gettempdir()
    for file in os.listdir(temp_dir):
        if file.startswith("test_") and file.endswith((".png", ".jpg", ".pdf")):
            try:
                os.remove(os.path.join(temp_dir, file))
            except:
                pass
