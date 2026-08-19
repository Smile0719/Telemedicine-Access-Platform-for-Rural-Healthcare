"""Initial healthcare schema

Revision ID: 1a2b3c4d5e6f
Revises: 
Create Date: 2026-08-19 12:12:14.057000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "1a2b3c4d5e6f"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "patients",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("first_name", sa.String(length=80), nullable=False),
        sa.Column("last_name", sa.String(length=80), nullable=False),
        sa.Column("phone_number", sa.String(length=20), nullable=False),
        sa.Column("village", sa.String(length=80), nullable=False),
        sa.Column("gender", sa.String(length=20), nullable=True),
        sa.Column("symptoms", sa.Text(), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False),
        sa.Column("synced_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_patients_phone_number"), "patients", ["phone_number"], unique=False)
    op.create_index(op.f("ix_patients_synced_at"), "patients", ["synced_at"], unique=False)

    op.create_table(
        "consultations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("patient_id", sa.String(length=36), nullable=False),
        sa.Column("clinician_name", sa.String(length=120), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("follow_up_required", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"]),
    )
    op.create_index(op.f("ix_consultations_patient_id"), "consultations", ["patient_id"], unique=False)

    op.create_table(
        "sync_queue_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sync_queue_items_type"), "sync_queue_items", ["type"], unique=False)
    op.create_index(op.f("ix_sync_queue_items_status"), "sync_queue_items", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_sync_queue_items_status"), table_name="sync_queue_items")
    op.drop_index(op.f("ix_sync_queue_items_type"), table_name="sync_queue_items")
    op.drop_table("sync_queue_items")
    op.drop_index(op.f("ix_consultations_patient_id"), table_name="consultations")
    op.drop_table("consultations")
    op.drop_index(op.f("ix_patients_synced_at"), table_name="patients")
    op.drop_index(op.f("ix_patients_phone_number"), table_name="patients")
    op.drop_table("patients")
