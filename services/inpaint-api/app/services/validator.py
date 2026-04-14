from dataclasses import dataclass
from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError


SUPPORTED_FORMATS = {
    "PNG": "image/png",
    "JPEG": "image/jpeg",
}


class ServiceError(Exception):
    def __init__(self, code: int, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass
class ImageValidationResult:
    image: Image.Image
    mime_type: str
    size_bytes: int


def validate_image_bytes(
    raw_bytes: bytes,
    declared_content_type: str | None,
    max_bytes: int,
    max_width: int,
    max_height: int,
) -> ImageValidationResult:
    if len(raw_bytes) > max_bytes:
        raise ServiceError(4002, "图片体积超限")

    try:
        image = Image.open(BytesIO(raw_bytes))
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ServiceError(4001, "不支持的图片格式") from exc

    normalized = ImageOps.exif_transpose(image)
    actual_mime_type = SUPPORTED_FORMATS.get(image.format or "")
    if actual_mime_type is None:
        raise ServiceError(4001, "不支持的图片格式")

    if declared_content_type and declared_content_type.startswith("image/"):
        if actual_mime_type != declared_content_type and not (
            declared_content_type == "image/jpg" and actual_mime_type == "image/jpeg"
        ):
            raise ServiceError(4001, "不支持的图片格式")

    width, height = normalized.size
    if width > max_width or height > max_height:
        raise ServiceError(4003, "图片尺寸超限")

    return ImageValidationResult(
        image=normalized,
        mime_type=actual_mime_type,
        size_bytes=len(raw_bytes),
    )


def validate_mask_size(source_image: Image.Image, mask_image: Image.Image) -> None:
    if source_image.size != mask_image.size:
        raise ServiceError(4005, "Mask 尺寸必须与原图一致")

