from fastapi import FastAPI

from app.api.v1.inpaint import router as inpaint_router


app = FastAPI(title="Watermark Removal API", version="0.1.0")
app.include_router(inpaint_router, prefix="/api/v1")

