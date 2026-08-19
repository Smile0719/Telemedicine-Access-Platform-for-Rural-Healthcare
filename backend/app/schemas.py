from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PatientCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=80)
    last_name: str = Field(..., min_length=1, max_length=80)
    phone_number: str = Field(..., min_length=6, max_length=20)
    village: str = Field(..., min_length=1, max_length=80)
    gender: str | None = Field(default=None, max_length=20)
    symptoms: str | None = Field(default=None, max_length=500)


class PatientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    first_name: str
    last_name: str
    phone_number: str
    village: str
    gender: str | None = None
    symptoms: str | None = None
    is_verified: bool = False
    synced_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ConsultationCreate(BaseModel):
    patient_id: str
    clinician_name: str = Field(..., min_length=1, max_length=120)
    summary: str = Field(..., min_length=1)
    follow_up_required: bool = False


class ConsultationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    patient_id: str
    clinician_name: str
    summary: str
    follow_up_required: bool
    created_at: datetime


class SyncQueueItemCreate(BaseModel):
    type: Literal["patient_registration", "consultation", "follow_up"]
    payload: dict


class SyncQueueItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    payload: dict
    status: str
    created_at: datetime
