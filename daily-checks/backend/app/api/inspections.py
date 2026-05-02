from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.inspection import (
    Inspection, InspectionResult, ChecklistItem,
    InspectionStatus, ProductionLine, Station
)
from app.schemas.inspection import (
    InspectionCreate, InspectionOut, InspectionSubmit,
    SupervisorReview, ProductionLineOut, ChecklistItemOut
)
from app.services.alert_service import evaluate_and_flag
from app.services.email_service import send_alert_notification

router = APIRouter(prefix="/inspections", tags=["inspections"])


@router.get("/lines", response_model=list[ProductionLineOut])
async def list_lines(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(
        select(ProductionLine)
        .where(ProductionLine.is_active == True)
        .options(
            selectinload(ProductionLine.stations)
            .selectinload(Station.checklist_items)
        )
    )
    return result.scalars().all()


@router.get("/checklist", response_model=list[ChecklistItemOut])
async def get_checklist(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    result = await db.execute(
        select(ChecklistItem)
        .where(ChecklistItem.is_active == True)
        .order_by(ChecklistItem.display_order)
    )
    return result.scalars().all()


@router.post("", response_model=InspectionOut, status_code=201)
async def submit_inspection(
    payload: InspectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.operator, UserRole.admin)),
):
    inspection = Inspection(
        production_line_id=payload.production_line_id,
        operator_id=current_user.id,
        shift=payload.shift,
        inspection_date=payload.inspection_date,
        operator_notes=payload.operator_notes,
        status=InspectionStatus.submitted,
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(inspection)
    await db.flush()

    # Load line and station names upfront for alert messages
    line_result = await db.execute(
        select(ProductionLine).where(ProductionLine.id == payload.production_line_id)
    )
    line = line_result.scalar_one_or_none()
    line_name = line.name if line else str(payload.production_line_id)
    supervisor_email = line.supervisor_email if line else None

    alerts_created = []
    for r in payload.results:
        item_result = await db.execute(
            select(ChecklistItem).where(ChecklistItem.id == r.checklist_item_id)
        )
        item = item_result.scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail=f"Checklist item {r.checklist_item_id} not found")

        station_result = await db.execute(
            select(Station).where(Station.id == r.station_id)
        )
        station = station_result.scalar_one_or_none()
        if not station:
            raise HTTPException(status_code=404, detail=f"Station {r.station_id} not found")
        station_name = station.name

        result_row = InspectionResult(
            inspection_id=inspection.id,
            station_id=r.station_id,
            checklist_item_id=r.checklist_item_id,
            pass_fail=r.pass_fail,
            numeric_value=r.numeric_value,
            notes=r.notes,
        )
        db.add(result_row)
        await db.flush()

        alert = await evaluate_and_flag(
            result_row, item, db,
            station_name=station_name,
            line_name=line_name,
        )
        if alert:
            alerts_created.append(alert)

    await db.flush()

    # TODO: Re-enable before go-live
    # for alert in alerts_created:
    #     send_alert_notification(
    #         alert_message=alert.message,
    #         inspection_id=str(inspection.id),
    #         line_name=line_name,
    #         to=supervisor_email,
    #     )

    refreshed = await db.execute(
        select(Inspection)
        .where(Inspection.id == inspection.id)
        .options(
            selectinload(Inspection.results)
            .selectinload(InspectionResult.checklist_item)
        )
    )
    return refreshed.scalar_one()


@router.get("", response_model=list[InspectionOut])
async def list_inspections(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Inspection).options(
        selectinload(Inspection.results).selectinload(InspectionResult.checklist_item),
        selectinload(Inspection.production_line),
        selectinload(Inspection.operator),
    )
    if current_user.role == UserRole.operator:
        query = query.where(Inspection.operator_id == current_user.id)
    result = await db.execute(query.order_by(Inspection.submitted_at.desc()))
    inspections = result.scalars().all()
    return [InspectionOut.from_orm_with_relations(i) for i in inspections]


@router.get("/{inspection_id}", response_model=InspectionOut)
async def get_inspection(
    inspection_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Inspection)
        .where(Inspection.id == inspection_id)
        .options(selectinload(Inspection.results).selectinload(InspectionResult.checklist_item))
    )
    inspection = result.scalar_one_or_none()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    if current_user.role == UserRole.operator and inspection.operator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return inspection


@router.patch("/{inspection_id}/review", response_model=InspectionOut)
async def review_inspection(
    inspection_id: str,
    payload: SupervisorReview,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.leader, UserRole.admin)),
):
    result = await db.execute(
        select(Inspection)
        .where(Inspection.id == inspection_id)
        .options(selectinload(Inspection.results).selectinload(InspectionResult.checklist_item))
    )
    inspection = result.scalar_one_or_none()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    inspection.supervisor_id = current_user.id
    inspection.supervisor_notes = payload.supervisor_notes
    inspection.status = InspectionStatus.reviewed
    inspection.reviewed_at = datetime.now(timezone.utc)
    return inspection

# Location: backend/app/api/inspections.py