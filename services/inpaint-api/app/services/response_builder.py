import base64
from typing import Any

import cv2
from fastapi.responses import JSONResponse


def build_success_response(
    image: Any,
    request_id: str,
    process_time_ms: int,
    output_format: str,
) -> JSONResponse:
    extension = ".png" if output_format == "png" else ".jpg"
    success, encoded = cv2.imencode(extension, image)
    if not success:
        raise RuntimeError("encode failed")

    image_base64 = base64.b64encode(encoded.tobytes()).decode("ascii")
    mime_type = "image/png" if output_format == "png" else "image/jpeg"
    return JSONResponse(
        status_code=200,
        content={
            "code": 200,
            "data": {
                "image_base64": image_base64,
                "mime_type": mime_type,
                "request_id": request_id,
                "process_time_ms": process_time_ms,
            },
            "message": "操作成功",
        },
    )


def build_error_response(code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=200,
        content={"code": code, "data": None, "message": message},
    )

