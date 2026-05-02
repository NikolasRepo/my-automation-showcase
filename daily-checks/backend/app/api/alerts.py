from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.inspection import Alert
from app.schemas.inspection import AlertOut

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertOut])
async def list_alerts(
    unacknowledged_only: bool = False,
    db: AsyncSession = Depends(get_db),
    
    #Commented out for dev, remove for live
    #_: User = Depends(require_role(UserRole.leader, UserRole.admin)),
):
    query = select(Alert).order_by(Alert.created_at.desc())
    if unacknowledged_only:
        query = query.where(Alert.acknowledged == False)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{alert_id}/acknowledge", response_model=AlertOut)
async def acknowledge_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),

    #Commented out for dev, remove for live
    #current_user: User = Depends(require_role(UserRole.leader, UserRole.admin)),
):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = True
    alert.acknowledged_by = None
    alert.acknowledged_at = datetime.now(timezone.utc)
    return alert

# Location: backend/app/api/alerts.py
