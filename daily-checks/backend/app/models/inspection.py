import uuid
import enum
from datetime import datetime, timezone, date
from sqlalchemy import (
    String, Boolean, DateTime, Date, Float, Integer,
    ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class ProductionLine(Base):
    __tablename__ = "production_lines"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    supervisor_email: Mapped[str] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    stations: Mapped[list["Station"]] = relationship("Station", back_populates="production_line")
    inspections: Mapped[list["Inspection"]] = relationship("Inspection", back_populates="production_line")


class Station(Base):
    __tablename__ = "stations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    production_line_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("production_lines.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    production_line: Mapped["ProductionLine"] = relationship("ProductionLine", back_populates="stations")
    checklist_items: Mapped[list["ChecklistItem"]] = relationship("ChecklistItem", back_populates="station")


class DataType(str, enum.Enum):
    pass_fail = "pass_fail"
    numeric = "numeric"


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    station_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("stations.id"), nullable=False)
    sub_station: Mapped[str] = mapped_column(String(100), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=True)
    data_type: Mapped[DataType] = mapped_column(SAEnum(DataType), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=True)
    min_value: Mapped[float] = mapped_column(Float, nullable=True)
    max_value: Mapped[float] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    station: Mapped["Station"] = relationship("Station", back_populates="checklist_items")
    results: Mapped[list["InspectionResult"]] = relationship("InspectionResult", back_populates="checklist_item")


class Shift(str, enum.Enum):
    first = "1st Shift"
    second = "2nd Shift"
    third = "3rd Shift"


class InspectionStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    reviewed = "reviewed"


class Inspection(Base):
    __tablename__ = "inspections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    production_line_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("production_lines.id"), nullable=False)
    operator_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    supervisor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=True)
    shift: Mapped[Shift] = mapped_column(SAEnum(Shift), nullable=False)
    inspection_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[InspectionStatus] = mapped_column(
        SAEnum(InspectionStatus), nullable=False, default=InspectionStatus.draft
    )
    operator_notes: Mapped[str] = mapped_column(Text, nullable=True)
    supervisor_notes: Mapped[str] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    production_line: Mapped["ProductionLine"] = relationship("ProductionLine", back_populates="inspections")
    operator: Mapped["User"] = relationship("User", foreign_keys=[operator_id], back_populates="submitted_inspections")
    supervisor: Mapped["User"] = relationship("User", foreign_keys=[supervisor_id], back_populates="reviewed_inspections")
    results: Mapped[list["InspectionResult"]] = relationship("InspectionResult", back_populates="inspection", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="inspection", cascade="all, delete-orphan")


class InspectionResult(Base):
    __tablename__ = "inspection_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inspections.id"), nullable=False)
    station_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("stations.id"), nullable=False)
    checklist_item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("checklist_items.id"), nullable=False)
    pass_fail: Mapped[bool] = mapped_column(Boolean, nullable=True)
    numeric_value: Mapped[float] = mapped_column(Float, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    inspection: Mapped["Inspection"] = relationship("Inspection", back_populates="results")
    station: Mapped["Station"] = relationship("Station")
    checklist_item: Mapped["ChecklistItem"] = relationship("ChecklistItem", back_populates="results")
    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="inspection_result")


class AlertSeverity(str, enum.Enum):
    warning = "warning"
    critical = "critical"


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inspections.id"), nullable=False)
    inspection_result_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inspection_results.id"), nullable=True)
    acknowledged_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=True)
    severity: Mapped[AlertSeverity] = mapped_column(SAEnum(AlertSeverity), nullable=False, default=AlertSeverity.warning)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    acknowledged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    inspection: Mapped["Inspection"] = relationship("Inspection", back_populates="alerts")
    inspection_result: Mapped["InspectionResult"] = relationship("InspectionResult", back_populates="alerts")
    acknowledger: Mapped["User"] = relationship("User", foreign_keys=[acknowledged_by], back_populates="acknowledged_alerts")
