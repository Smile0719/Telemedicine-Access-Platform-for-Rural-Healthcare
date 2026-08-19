from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import Consultation, Patient, SyncQueueItem
from app.schemas import ConsultationCreate, ConsultationRead, PatientCreate, PatientRead, SyncQueueItemCreate, SyncQueueItemRead

router = APIRouter(prefix="/api/v1", tags=["patients"])


def send_sms_notification(phone_number: str) -> None:
    # This is a placeholder for a feature-phone SMS workflow.
    print(f"SMS queued for {phone_number}")


@router.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": "telemedicine-api"}


@router.post("/patients", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
async def create_patient(payload: PatientCreate, background: BackgroundTasks, db: AsyncSession = Depends(get_db)) -> Patient:
    patient = Patient(**payload.model_dump())
    patient.is_verified = True
    patient.synced_at = datetime.utcnow()
    db.add(patient)
    await db.commit()
    await db.refresh(patient)

    sync_item = SyncQueueItem(
        type="patient_registration",
        payload={
            "patient_id": patient.id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "phone_number": patient.phone_number,
            "village": patient.village,
        },
        status="synced",
    )
    db.add(sync_item)
    await db.commit()

    background.add_task(send_sms_notification, patient.phone_number)
    return patient


@router.get("/patients", response_model=list[PatientRead])
async def list_patients(db: AsyncSession = Depends(get_db)) -> list[Patient]:
    result = await db.execute(select(Patient).order_by(Patient.created_at.desc()))
    return result.scalars().all()


@router.get("/patients/{patient_id}", response_model=PatientRead)
async def get_patient(patient_id: str, db: AsyncSession = Depends(get_db)) -> Patient:
    patient = await db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.post("/consultations", response_model=ConsultationRead, status_code=status.HTTP_201_CREATED)
async def create_consultation(payload: ConsultationCreate, db: AsyncSession = Depends(get_db)) -> Consultation:
    patient = await db.get(Patient, payload.patient_id)
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    consultation = Consultation(**payload.model_dump())
    db.add(consultation)
    await db.commit()
    await db.refresh(consultation)

    queue_item = SyncQueueItem(
        type="consultation",
        payload={"consultation_id": consultation.id, "patient_id": consultation.patient_id},
        status="synced",
    )
    db.add(queue_item)
    await db.commit()

    return consultation


@router.post("/sync-queue", response_model=SyncQueueItemRead, status_code=status.HTTP_201_CREATED)
async def enqueue_sync(payload: SyncQueueItemCreate, db: AsyncSession = Depends(get_db)) -> SyncQueueItem:
    item = SyncQueueItem(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item
