from pydantic import BaseModel


class InpaintResultData(BaseModel):
    image_base64: str
    mime_type: str
    request_id: str
    process_time_ms: int


class ApiResponse(BaseModel):
    code: int
    data: InpaintResultData | None
    message: str

