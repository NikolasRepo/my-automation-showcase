from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.inspection import (
    InspectionResult, Alert, AlertSeverity, ChecklistItem, DataType
)


async def evaluate_and_flag(
    result: InspectionResult,
    item: ChecklistItem,
    db: AsyncSession,
    station_name: str = "",
    line_name: str = "",
) -> Alert | None:
    flagged = False
    message = ""
    location = f" — {station_name}, {line_name}" if station_name and line_name else ""

    if item.data_type == DataType.pass_fail:
        if result.pass_fail is False:
            flagged = True
            message = f"FAIL recorded for: {item.name}{location}"

    elif item.data_type == DataType.numeric:
        val = result.numeric_value
        if val is not None:
            if item.min_value is not None and val < item.min_value:
                flagged = True
                message = (
                    f"{item.name} is below minimum: "
                    f"{val} {item.unit or ''} (min {item.min_value}){location}"
                )
            elif item.max_value is not None and val > item.max_value:
                flagged = True
                message = (
                    f"{item.name} exceeds maximum: "
                    f"{val} {item.unit or ''} (max {item.max_value}){location}"
                )

    if flagged:
        result.flagged = True
        severity = AlertSeverity.critical if item.data_type == DataType.pass_fail else AlertSeverity.warning
        alert = Alert(
            inspection_id=result.inspection_id,
            inspection_result_id=result.id,
            severity=severity,
            message=message,
        )
        db.add(alert)
        return alert

    return None

# Location: backend/app/services/alert_service.py