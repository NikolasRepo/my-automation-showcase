"""
Run this once after the database is created to seed initial data.

"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.database import AsyncSessionLocal, engine, Base
from app.models.inspection import ProductionLine, Station, ChecklistItem, DataType
from app.models.user import User, UserRole
from app.core.security import hash_password


# =============================================================================
# PRODUCTION LINES, STATIONS, AND CHECKLIST ITEMS
#
# data_type options:
#   DataType.pass_fail
#   DataType.ok_ng
#   DataType.numeric
#
# display_order controls the sequence items appear on the form
# supervisor_email is optional — used for alert notifications when configured.
# =============================================================================

PRODUCTION_LINES = [
    {
        "name": "Line A",
        "description": None,
        "supervisor_email": None,
        "stations": [
            {
                "name": "Station 1",
                "description": None,
                "display_order": 1,
                "checklist_items": [
                    {
                        "name": "Safety guard in place",
                        "category": None,
                        "data_type": DataType.pass_fail,
                        "unit": None,
                        "min_value": None,
                        "max_value": None,
                        "display_order": 1,
                    },
                    {
                        "name": "Emergency stop functional",
                        "category": None,
                        "data_type": DataType.ok_ng,
                        "unit": None,
                        "min_value": None,
                        "max_value": None,
                        "display_order": 2,
                    },
                    {
                        "name": "Line pressure",
                        "category": None,
                        "data_type": DataType.numeric,
                        "unit": "PSI",
                        "min_value": 40.0,
                        "max_value": 80.0,
                        "display_order": 3,
                    },
                ],
            },
            {
                "name": "Station 2",
                "description": None,
                "display_order": 2,
                "checklist_items": [
                    {
                        "name": "Conveyor belt condition",
                        "category": None,
                        "data_type": DataType.pass_fail,
                        "unit": None,
                        "min_value": None,
                        "max_value": None,
                        "display_order": 1,
                    },
                    {
                        "name": "Temperature",
                        "category": None,
                        "data_type": DataType.numeric,
                        "unit": "F",
                        "min_value": 65.0,
                        "max_value": 77.0,
                        "display_order": 2,
                    },
                ],
            },
        ],
    },
]


# =============================================================================
# STAFF ACCOUNTS
# Leaders and admins require a username and password.
# Operators require only a full name.
# =============================================================================

LEADERS = [
    {
        "full_name": "Leader A",
        "username": "leadera",
        "email": None,
        "password": "ChangeThisPassword123",
    },
    {
        "full_name": "Leader B",
        "username": "leaderb",
        "email": None,
        "password": "ChangeThisPassword123",
    },
    {
        "full_name": "Leader C",
        "username": "leaderc",
        "email": None,
        "password": "ChangeThisPassword123",
    },
]

ADMINS = [
    {
        "full_name": "System Admin",
        "username": "admin",
        "email": None,
        "password": "StrongPassword123",
    },
]

OPERATORS = [
    {"full_name": "Operator One"},
    {"full_name": "Operator Two"},
    {"full_name": "Operator Three"},
]


# =============================================================================
# SEED FUNCTION — no changes needed below this line
# =============================================================================

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:

        for line_data in PRODUCTION_LINES:
            line = ProductionLine(
                name=line_data["name"],
                description=line_data.get("description"),
                supervisor_email=line_data.get("supervisor_email"),
            )
            db.add(line)
            await db.flush()

            for station_data in line_data.get("stations", []):
                station = Station(
                    production_line_id=line.id,
                    name=station_data["name"],
                    description=station_data.get("description"),
                    display_order=station_data.get("display_order", 0),
                )
                db.add(station)
                await db.flush()

                for item_data in station_data.get("checklist_items", []):
                    item = ChecklistItem(
                        station_id=station.id,
                        name=item_data["name"],
                        category=item_data.get("category"),
                        data_type=item_data["data_type"],
                        unit=item_data.get("unit"),
                        min_value=item_data.get("min_value"),
                        max_value=item_data.get("max_value"),
                        display_order=item_data.get("display_order", 0),
                    )
                    db.add(item)

        for a in ADMINS:
            db.add(User(
                full_name=a["full_name"],
                username=a.get("username"),
                email=a.get("email"),
                hashed_password=hash_password(a["password"]),
                role=UserRole.admin,
            ))

        for s in LEADERS:
            db.add(User(
                full_name=s["full_name"],
                username=s.get("username"),
                email=s.get("email"),
                hashed_password=hash_password(s["password"]),
                role=UserRole.leader,
            ))

        for o in OPERATORS:
            db.add(User(
                full_name=o["full_name"],
                hashed_password="",
                role=UserRole.operator,
            ))

        await db.commit()
        print("Database seeded successfully.")
        print(f"  {len(PRODUCTION_LINES)} production lines created")
        print(f"  {len(ADMINS)} admin account(s) created")
        print(f"  {len(LEADERS)} leader account(s) created")
        print(f"  {len(OPERATORS)} operator account(s) created")
        print("\nIMPORTANT: Change all passwords immediately after first login.")


if __name__ == "__main__":
    asyncio.run(seed())
