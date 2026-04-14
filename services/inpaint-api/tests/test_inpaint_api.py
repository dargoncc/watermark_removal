import base64
from io import BytesIO
from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app


FIXTURE_DIR = Path(__file__).parent / "fixtures"


def build_files(mask_name: str = "mask_small_logo.png") -> dict[str, tuple[str, bytes, str]]:
    return {
        "image": (
            "source_with_small_logo.png",
            (FIXTURE_DIR / "source_with_small_logo.png").read_bytes(),
            "image/png",
        ),
        "mask": (
            mask_name,
            (FIXTURE_DIR / mask_name).read_bytes(),
            "image/png",
        ),
    }


def test_inpaint_returns_base64_png_payload() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/v1/inpaint",
        data={"output_format": "png", "request_id": "req-success"},
        files=build_files(),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["code"] == 200
    assert payload["message"] == "操作成功"
    assert payload["data"]["mime_type"] == "image/png"
    assert payload["data"]["request_id"] == "req-success"

    decoded = base64.b64decode(payload["data"]["image_base64"])
    image = Image.open(BytesIO(decoded))
    assert image.size == (320, 240)
    assert image.format == "PNG"


def test_inpaint_returns_missing_mask_code() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/v1/inpaint",
        data={"output_format": "png", "request_id": "req-missing-mask"},
        files={
            "image": (
                "source_with_small_logo.png",
                (FIXTURE_DIR / "source_with_small_logo.png").read_bytes(),
                "image/png",
            )
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "code": 4004,
        "data": None,
        "message": "缺少 mask",
    }


def test_inpaint_returns_mask_size_mismatch_code() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/v1/inpaint",
        data={"output_format": "png", "request_id": "req-invalid-mask"},
        files=build_files("mask_invalid_size.png"),
    )

    assert response.status_code == 200
    assert response.json() == {
        "code": 4005,
        "data": None,
        "message": "Mask 尺寸必须与原图一致",
    }


def test_inpaint_maps_engine_failure_to_code_5002(monkeypatch) -> None:
    client = TestClient(app)

    class FailingEngine:
        def inpaint(self, image, mask):
            raise RuntimeError("boom")

    monkeypatch.setattr("app.api.v1.inpaint.get_inpaint_engine", lambda: FailingEngine())

    response = client.post(
        "/api/v1/inpaint",
        data={"output_format": "png", "request_id": "req-engine-fail"},
        files=build_files(),
    )

    assert response.status_code == 200
    assert response.json() == {
        "code": 5002,
        "data": None,
        "message": "去水印处理失败",
    }


def test_inpaint_maps_timeout_to_code_6001(monkeypatch) -> None:
    client = TestClient(app)

    class SlowEngine:
        def inpaint(self, image, mask):
            import time

            time.sleep(0.05)
            return image

    monkeypatch.setattr("app.api.v1.inpaint.get_inpaint_engine", lambda: SlowEngine())
    monkeypatch.setattr("app.api.v1.inpaint.settings.REQUEST_TIMEOUT_SECONDS", 0.001)

    response = client.post(
        "/api/v1/inpaint",
        data={"output_format": "png", "request_id": "req-timeout"},
        files=build_files(),
    )

    assert response.status_code == 200
    assert response.json() == {
        "code": 6001,
        "data": None,
        "message": "请求处理超时",
    }
