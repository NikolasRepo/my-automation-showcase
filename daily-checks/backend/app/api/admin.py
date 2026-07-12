# backend/app/api/admin.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User, UserRole
from app.models.inspection import (
    ProductionLine, Station, ChecklistItem, DataType, Inspection, InspectionResult
)
from app.schemas.inspection import ProductionLineOut, StationOut, ChecklistItemOut

router = APIRouter(prefix="/admin", tags=["admin"])


# ─── Pydantic schemas for admin inputs ───────────────────────────────────────

class LineCreate(BaseModel):
    name: str
    description: Optional[str] = None
    supervisor_email: Optional[str] = None


class LineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    supervisor_email: Optional[str] = None


class StationCreate(BaseModel):
    production_line_id: str
    name: str
    description: Optional[str] = None
    display_order: int = 0


class StationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None


class ChecklistItemCreate(BaseModel):
    station_id: str
    name: str
    sub_station: Optional[str] = None
    category: Optional[str] = None
    data_type: DataType
    unit: Optional[str] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    display_order: int = 0


class ChecklistItemUpdate(BaseModel):
    name: Optional[str] = None
    sub_station: Optional[str] = None
    category: Optional[str] = None
    data_type: Optional[DataType] = None
    unit: Optional[str] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    display_order: Optional[int] = None


# ─── Production line routes ───────────────────────────────────────────────────

@router.get("/lines", response_model=list[ProductionLineOut])
async def list_lines(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    result = await db.execute(
        select(ProductionLine)
        .options(
            selectinload(ProductionLine.stations)
            .selectinload(Station.checklist_items)
        )
        .order_by(ProductionLine.name)
    )
    return result.scalars().all()


@router.post("/lines", response_model=ProductionLineOut, status_code=201)
async def create_line(
    payload: LineCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    existing = await db.execute(
        select(ProductionLine).where(ProductionLine.name == payload.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A line with this name already exists")
    line = ProductionLine(
        name=payload.name,
        description=payload.description,
        supervisor_email=payload.supervisor_email,
    )
    db.add(line)
    await db.flush()
    await db.refresh(line)
    result = await db.execute(
        select(ProductionLine)
        .where(ProductionLine.id == line.id)
        .options(
            selectinload(ProductionLine.stations)
            .selectinload(Station.checklist_items)
        )
    )
    return result.scalar_one()


@router.patch("/lines/{line_id}", response_model=ProductionLineOut)
async def update_line(
    line_id: str,
    payload: LineUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    result = await db.execute(
        select(ProductionLine).where(ProductionLine.id == line_id)
    )
    line = result.scalar_one_or_none()
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")
    if payload.name is not None:
        line.name = payload.name
    if payload.description is not None:
        line.description = payload.description
    if payload.supervisor_email is not None:
        line.supervisor_email = payload.supervisor_email
    await db.flush()
    result = await db.execute(
        select(ProductionLine)
        .where(ProductionLine.id == line_id)
        .options(
            selectinload(ProductionLine.stations)
            .selectinload(Station.checklist_items)
        )
    )
    return result.scalar_one()


@router.patch("/lines/{line_id}/deactivate", response_model=ProductionLineOut)
async def deactivate_line(
    line_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    result = await db.execute(
        select(ProductionLine).where(ProductionLine.id == line_id)
    )
    line = result.scalar_one_or_none()
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")
    line.is_active = not line.is_active
    await db.flush()
    result = await db.execute(
        select(ProductionLine)
        .where(ProductionLine.id == line_id)
        .options(
            selectinload(ProductionLine.stations)
            .selectinload(Station.checklist_items)
        )
    )
    return result.scalar_one()


# ─── Station routes ───────────────────────────────────────────────────────────

@router.get("/stations", response_model=list[StationOut])
async def list_stations(
    line_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    query = select(Station).options(selectinload(Station.checklist_items))
    if line_id:
        query = query.where(Station.production_line_id == line_id)
    query = query.order_by(Station.display_order)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/stations", response_model=StationOut, status_code=201)
async def create_station(
    payload: StationCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    station = Station(
        production_line_id=payload.production_line_id,
        name=payload.name,
        description=payload.description,
        display_order=payload.display_order,
    )
    db.add(station)
    await db.flush()
    result = await db.execute(
        select(Station)
        .where(Station.id == station.id)
        .options(selectinload(Station.checklist_items))
    )
    return result.scalar_one()


@router.patch("/stations/{station_id}", response_model=StationOut)
async def update_station(
    station_id: str,
    payload: StationUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    result = await db.execute(
        select(Station).where(Station.id == station_id)
    )
    station = result.scalar_one_or_none()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    if payload.name is not None:
        station.name = payload.name
    if payload.description is not None:
        station.description = payload.description
    if payload.display_order is not None:
        station.display_order = payload.display_order
    await db.flush()
    result = await db.execute(
        select(Station)
        .where(Station.id == station_id)
        .options(selectinload(Station.checklist_items))
    )
    return result.scalar_one()


@router.patch("/stations/{station_id}/deactivate", response_model=StationOut)
async def deactivate_station(
    station_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    result = await db.execute(
        select(Station).where(Station.id == station_id)
    )
    station = result.scalar_one_or_none()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    station.is_active = not station.is_active
    await db.flush()
    result = await db.execute(
        select(Station)
        .where(Station.id == station_id)
        .options(selectinload(Station.checklist_items))
    )
    return result.scalar_one()


@router.delete("/lines/{line_id}", status_code=204)
async def delete_line(
    line_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    result = await db.execute(
        select(ProductionLine).where(ProductionLine.id == line_id)
    )
    line = result.scalar_one_or_none()
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")
    inspections = await db.execute(
        select(Inspection).where(Inspection.production_line_id == line_id).limit(1)
    )
    if inspections.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a line that has inspection records. Deactivate it instead."
        )
    await db.delete(line)


@router.delete("/stations/{station_id}", status_code=204)
async def delete_station(
    station_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    result = await db.execute(
        select(Station).where(Station.id == station_id)
    )
    station = result.scalar_one_or_none()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    results = await db.execute(
        select(InspectionResult).where(InspectionResult.station_id == station_id).limit(1)
    )
    if results.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a station that has inspection records. Deactivate it instead."
        )
    await db.delete(station)


@router.delete("/checklist-items/{item_id}", status_code=204)
async def delete_checklist_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    result = await db.execute(
        select(ChecklistItem).where(ChecklistItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    results = await db.execute(
        select(InspectionResult).where(InspectionResult.checklist_item_id == item_id).limit(1)
    )
    if results.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a checklist item that has inspection records. Deactivate it instead."
        )
    await db.delete(item)


# ─── Checklist item routes ────────────────────────────────────────────────────

@router.get("/checklist-items", response_model=list[ChecklistItemOut])
async def list_checklist_items(
    station_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    query = select(ChecklistItem)
    if station_id:
        query = query.where(ChecklistItem.station_id == station_id)
    query = query.order_by(ChecklistItem.display_order)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/checklist-items", response_model=ChecklistItemOut, status_code=201)
async def create_checklist_item(
    payload: ChecklistItemCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    item = ChecklistItem(
        station_id=payload.station_id,
        name=payload.name,
        sub_station=payload.sub_station,
        category=payload.category,
        data_type=payload.data_type,
        unit=payload.unit,
        min_value=payload.min_value,
        max_value=payload.max_value,
        display_order=payload.display_order,
    )
    db.add(item)
    await db.flush()
    return item


@router.patch("/checklist-items/{item_id}", response_model=ChecklistItemOut)
async def update_checklist_item(
    item_id: str,
    payload: ChecklistItemUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    result = await db.execute(
        select(ChecklistItem).where(ChecklistItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    if payload.name is not None:
        item.name = payload.name
    if payload.data_type is not None:
        item.data_type = payload.data_type
    if payload.category is not None:
        item.category = payload.category
    if payload.unit is not None:
        item.unit = payload.unit
    if payload.min_value is not None:
        item.min_value = payload.min_value
    if payload.max_value is not None:
        item.max_value = payload.max_value
    if payload.display_order is not None:
        item.display_order = payload.display_order
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/checklist-items/{item_id}/deactivate", response_model=ChecklistItemOut)
async def deactivate_checklist_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    result = await db.execute(
        select(ChecklistItem).where(ChecklistItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    item.is_active = not item.is_active
    return item