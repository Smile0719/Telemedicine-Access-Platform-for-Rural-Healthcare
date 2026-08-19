from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.routes.patients import router as patients_router
from app.config import settings

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=settings.gzip_min_size)

app.include_router(patients_router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Telemedicine Access Platform API"}
