import asyncio
import logging
import time

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.services.inpaint_engine import OpenCvInpaintEngine
from app.services.preprocess import normalize_mask_image, normalize_source_image
from app.services.response_builder import build_error_response, build_success_response
from app.services.validator import ServiceError, validate_image_bytes, validate_mask_size


router = APIRouter()
logger = logging.getLogger(__name__)


def get_inpaint_engine() -> OpenCvInpaintEngine:
    return OpenCvInpaintEngine(radius=settings.INPAINT_RADIUS)


def _process_request(
    image_bytes: bytes,
    image_content_type: str | None,
    mask_bytes: bytes,
    mask_content_type: str | None,
    output_format: str,
    request_id: str,
) -> JSONResponse:
    started_at = time.perf_counter()
    source_result = validate_image_bytes(
        image_bytes,
        image_content_type,
        settings.MAX_IMAGE_BYTES,
        settings.MAX_IMAGE_WIDTH,
        settings.MAX_IMAGE_HEIGHT,
    )
    mask_result = validate_image_bytes(
        mask_bytes,
        mask_content_type,
        settings.MAX_IMAGE_BYTES,
        settings.MAX_IMAGE_WIDTH,
        settings.MAX_IMAGE_HEIGHT,
    )
    validate_mask_size(source_result.image, mask_result.image)

    source_array = normalize_source_image(source_result.image)
    mask_array = normalize_mask_image(mask_result.image)

    try:
        processed = get_inpaint_engine().inpaint(source_array, mask_array)
    except Exception as exc:
        raise ServiceError(5002, "去水印处理失败") from exc

    try:
        process_time_ms = int((time.perf_counter() - started_at) * 1000)
        return build_success_response(
            image=processed,
            request_id=request_id,
            process_time_ms=process_time_ms,
            output_format=output_format,
        )
    except Exception as exc:
        raise ServiceError(5003, "结果编码失败") from exc


@router.post("/inpaint")
async def inpaint(
    image: UploadFile = File(...),
    mask: UploadFile | None = File(None),
    output_format: str = Form(settings.OUTPUT_FORMAT),
    request_id: str = Form(...),
) -> JSONResponse:
    if mask is None:
        return build_error_response(4004, "缺少 mask")

    if output_format not in {"png", "jpeg"}:
        return build_error_response(4001, "不支持的图片格式")

    try:
        image_bytes, mask_bytes = await asyncio.gather(image.read(), mask.read())
        return await asyncio.wait_for(
            asyncio.to_thread(
                _process_request,
                image_bytes,
                image.content_type,
                mask_bytes,
                mask.content_type,
                output_format,
                request_id,
            ),
            timeout=settings.REQUEST_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        logger.warning("request timeout", extra={"request_id": request_id, "code": 6001})
        return build_error_response(6001, "请求处理超时")
    except ServiceError as exc:
        logger.warning("request failed", extra={"request_id": request_id, "code": exc.code})
        return build_error_response(exc.code, exc.message)
    except Exception:
        logger.exception("unexpected error", extra={"request_id": request_id, "code": 6002})
        return build_error_response(6002, "系统内部异常")

