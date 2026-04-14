from pathlib import Path

import pytest
from PIL import Image

from app.services.validator import ServiceError, validate_image_bytes, validate_mask_size


FIXTURE_DIR = Path(__file__).parent / "fixtures"


def read_fixture(name: str) -> bytes:
    return (FIXTURE_DIR / name).read_bytes()


def test_validate_image_bytes_accepts_png() -> None:
    result = validate_image_bytes(
        read_fixture("source_with_small_logo.png"),
        declared_content_type="image/png",
        max_bytes=10 * 1024 * 1024,
        max_width=4096,
        max_height=4096,
    )

    assert result.mime_type == "image/png"
    assert result.image.size == (320, 240)


def test_validate_image_bytes_rejects_unsupported_format() -> None:
    with pytest.raises(ServiceError) as error:
        validate_image_bytes(
            b"not-an-image",
            declared_content_type="text/plain",
            max_bytes=10 * 1024 * 1024,
            max_width=4096,
            max_height=4096,
        )

    assert error.value.code == 4001
    assert error.value.message == "不支持的图片格式"


def test_validate_mask_size_rejects_mismatched_dimensions() -> None:
    source = Image.open(FIXTURE_DIR / "source_with_small_logo.png")
    invalid_mask = Image.open(FIXTURE_DIR / "mask_invalid_size.png")

    with pytest.raises(ServiceError) as error:
        validate_mask_size(source, invalid_mask)

    assert error.value.code == 4005
    assert error.value.message == "Mask 尺寸必须与原图一致"

