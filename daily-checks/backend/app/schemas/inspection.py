import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel
from app.models.inspection import Shift, InspectionStatus, AlertSeverity, DataType


class ChecklistItemOut(BaseModel):
    id: uuid.UUID
    name: str
    sub_station: Optional[str] = None
    category: Optional[str]
    data_type: DataType
    unit: Optional[str]
    min_value: Optional[float]
    max_value: Optional[float]
    display_order: int
    is_active: bool = True

    model_config = {"from_attributes": True}


class StationOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    display_order: int
    is_active: bool = True
    checklist_items: list[ChecklistItemOut] = []

    model_config = {"from_attributes": True}


class ResultCreate(BaseModel):
    checklist_item_id: uuid.UUID
    station_id: uuid.UUID
    pass_fail: Optional[bool] = None
    numeric_value: Optional[float] = None
    notes: Optional[str] = None


class ResultOut(BaseModel):
    id: uuid.UUID
    checklist_item_id: uuid.UUID
    station_id: uuid.UUID
    pass_fail: Optional[bool]
    numeric_value: Optional[float]
    notes: Optional[str]
    flagged: bool
    recorded_at: datetime
    checklist_item: ChecklistItemOut

    model_config = {"from_attributes": True}


class InspectionCreate(BaseModel):
    production_line_id: uuid.UUID
    shift: Shift
    inspection_date: date
    operator_notes: Optional[str] = None
    results: list[ResultCreate]


class InspectionSubmit(BaseModel):
    operator_notes: Optional[str] = None
    results: list[ResultCreate]


class SupervisorReview(BaseModel):
    supervisor_notes: Optional[str] = None
    status: InspectionStatus = InspectionStatus.reviewed


class InspectionOut(BaseModel):
    id: uuid.UUID
    production_line_id: uuid.UUID
    production_line_name: Optional[str] = None
    operator_id: uuid.UUID
    operator_name: Optional[str] = None
    supervisor_id: Optional[uuid.UUID]
    shift: Shift
    inspection_date: date
    status: InspectionStatus
    operator_notes: Optional[str]
    supervisor_notes: Optional[str]
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]
    created_at: datetime
    results: list[ResultOut] = []

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_relations(cls, obj):
        data = cls.model_validate(obj)
        if hasattr(obj, 'production_line') and obj.production_line:
            data.production_line_name = obj.production_line.name
        if hasattr(obj, 'operator') and obj.operator:
            data.operator_name = obj.operator.full_name
        return data


class AlertOut(BaseModel):
    id: uuid.UUID
    inspection_id: uuid.UUID
    inspection_result_id: Optional[uuid.UUID]
    severity: AlertSeverity
    message: str
    acknowledged: bool
    created_at: datetime
    acknowledged_at: Optional[datetime]
    acknowledged_by: Optional[uuid.UUID]

    model_config = {"from_attributes": True}


class ProductionLineOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    is_active: bool
    supervisor_email: Optional[str] = None
    stations: list[StationOut] = []

    model_config = {"from_attributes": True}

# Location: backend/app/schemas/inspection.py