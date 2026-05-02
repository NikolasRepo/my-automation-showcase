import logging
from datetime import date, datetime, timezone, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.models.inspection import Inspection, Alert, InspectionStatus
from app.services.email_service import send_daily_summary

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


async def run_daily_summary():
    logger.info("Running daily inspection summary job")
    yesterday = date.today() - timedelta(days=1)

    async with AsyncSessionLocal() as db:
        total_result = await db.execute(
            select(func.count(Inspection.id)).where(
                Inspection.inspection_date == yesterday,
                Inspection.status == InspectionStatus.submitted,
            )
        )
        total = total_result.scalar() or 0

        flagged_result = await db.execute(
            select(func.count(Inspection.id)).where(
                Inspection.inspection_date == yesterday,
                Inspection.alerts.any(),
            )
        )
        flagged = flagged_result.scalar() or 0

        unack_result = await db.execute(
            select(func.count(Alert.id)).where(Alert.acknowledged == False)
        )
        unacknowledged = unack_result.scalar() or 0

        lines_result = await db.execute(
            select(Inspection.production_line_id).where(
                Inspection.inspection_date == yesterday,
                Inspection.alerts.any(),
            ).distinct()
        )
        line_ids = [str(r[0]) for r in lines_result.fetchall()]

        send_daily_summary(
            summary_date=yesterday,
            total=total,
            flagged=flagged,
            #unacknowledged=unacknowledged,
            lines_with_issues=line_ids,
        )


def start_scheduler():
    scheduler.add_job(
        run_daily_summary,
        CronTrigger(hour=6, minute=0),
        id="daily_summary",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — daily summary runs at 6:00am")


def stop_scheduler():
    scheduler.shutdown()
